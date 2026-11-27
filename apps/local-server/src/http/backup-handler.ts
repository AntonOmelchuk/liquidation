import {
  BACKUP_MEDIA_TYPE,
  BACKUP_ROUTES,
  MAX_BACKUP_BYTES,
} from "@liquidation/domain/backup/constants";
import { backupSelectionSchema } from "@liquidation/domain/backup/contracts";
import {
  HTTP_METHOD,
  HTTP_STATUS,
} from "@liquidation/domain/journal/constants";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { pipeline } from "node:stream/promises";
import { RequestError } from "../errors.ts";
import type { createJournal } from "../journal.ts";
import { backupTooLarge } from "../storage/backup/archive.ts";
import type { BackupDownload } from "../storage/backup/types.ts";
import { readJournalBody } from "./request-body.ts";

async function sendArchive(response: ServerResponse, archive: BackupDownload) {
  try {
    if (response.destroyed) return;
    const { size } = await stat(archive.path);
    response.writeHead(HTTP_STATUS.OK, {
      "Content-Type": BACKUP_MEDIA_TYPE,
      "Content-Disposition": `attachment; filename="${archive.filename}"`,
      "Content-Length": size,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    });
    await pipeline(createReadStream(archive.path), response);
  } finally {
    await archive.dispose?.();
  }
}

export async function handleBackupRequest(
  backup: ReturnType<typeof createJournal>["backup"],
  route: string,
  request: IncomingMessage,
  response: ServerResponse,
  send: (status: number, data: unknown) => void,
) {
  const safety = route.startsWith(BACKUP_ROUTES.safety);
  const download = route === BACKUP_ROUTES.download;
  if (
    request.method !== (download || safety ? HTTP_METHOD.GET : HTTP_METHOD.POST)
  )
    throw new RequestError(
      HTTP_STATUS.METHOD_NOT_ALLOWED,
      "Method not allowed.",
    );
  if (download || safety) {
    await sendArchive(
      response,
      safety
        ? await backup.safety(route.slice(BACKUP_ROUTES.safety.length))
        : await backup.download(),
    );
    return;
  }
  if (route === BACKUP_ROUTES.preview) {
    const media = request.headers["content-type"]
      ?.split(";", 1)[0]
      ?.trim()
      .toLowerCase();
    if (media !== BACKUP_MEDIA_TYPE) {
      request.resume();
      throw new RequestError(
        HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE,
        "Choose a ZIP backup.",
      );
    }
    if (Number(request.headers["content-length"]) > MAX_BACKUP_BYTES) {
      request.resume();
      throw backupTooLarge();
    }
    send(HTTP_STATUS.OK, await backup.preview(request));
    return;
  }
  const { input } = await readJournalBody(request, false);
  const command = backupSelectionSchema.safeParse(input);
  if (!command.success)
    throw new RequestError(
      HTTP_STATUS.UNPROCESSABLE_CONTENT,
      "Invalid backup preview.",
    );
  if (route === BACKUP_ROUTES.cancel) {
    await backup.cancel(command.data.token);
    send(HTTP_STATUS.OK, { canceled: true });
    return;
  }
  send(HTTP_STATUS.OK, await backup.restore(command.data.token));
}
