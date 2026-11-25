import {
  MAX_SCREENSHOT_BYTES,
  MAX_SCREENSHOT_UPLOAD_BYTES,
} from "@liquidation/domain/evidence/constants";
import { screenshotIdSchema } from "@liquidation/domain/evidence/screenshots";
import {
  HTTP_STATUS,
  MEDIA_TYPE,
  MULTIPART_FIELD,
} from "@liquidation/domain/journal/constants";
import { isText } from "@liquidation/domain/shared/guards";
import type { IncomingMessage } from "node:http";
import {
  EVIDENCE_JSON_LIMIT,
  EVIDENCE_MULTIPART_LIMIT,
  JOURNAL_JSON_LIMIT,
} from "../constants.ts";
import { RequestError } from "../errors.ts";

async function readBytes(request: IncomingMessage, limit: number) {
  const declaredSize = Number(request.headers["content-length"]);
  if (declaredSize > limit) {
    request.resume();
    throw new RequestError(
      HTTP_STATUS.CONTENT_TOO_LARGE,
      "The request is too large.",
    );
  }

  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > limit) {
      request.resume();
      throw new RequestError(
        HTTP_STATUS.CONTENT_TOO_LARGE,
        "The request is too large.",
      );
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, size);
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new RequestError(HTTP_STATUS.BAD_REQUEST, "Invalid JSON.");
  }
}

export async function readJournalBody(
  request: IncomingMessage,
  acceptsScreenshots: boolean,
  jsonLimit = acceptsScreenshots ? EVIDENCE_JSON_LIMIT : JOURNAL_JSON_LIMIT,
) {
  const type = request.headers["content-type"] ?? "";
  const mediaType = type.split(";", 1)[0].trim().toLowerCase();
  const uploads = new Map<string, Uint8Array>();

  if (acceptsScreenshots && mediaType === MEDIA_TYPE.MULTIPART) {
    const bytes = await readBytes(request, EVIDENCE_MULTIPART_LIMIT);
    let parts: FormData;
    try {
      parts = await new Response(new Uint8Array(bytes), {
        headers: { "Content-Type": type },
      }).formData();
    } catch {
      throw new RequestError(
        HTTP_STATUS.BAD_REQUEST,
        "Invalid multipart request.",
      );
    }
    const commands = parts.getAll(MULTIPART_FIELD.COMMAND);
    const command = commands[0];
    if (commands.length !== 1 || !isText(command)) {
      throw new RequestError(HTTP_STATUS.BAD_REQUEST, "Expected one command.");
    }
    if (Buffer.byteLength(command) > EVIDENCE_JSON_LIMIT) {
      throw new RequestError(
        HTTP_STATUS.CONTENT_TOO_LARGE,
        "The record text is too large.",
      );
    }
    let uploadedBytes = 0;
    for (const [key, part] of parts) {
      if (key === MULTIPART_FIELD.COMMAND) continue;
      const id = key.slice(MULTIPART_FIELD.SCREENSHOT_PREFIX.length);
      if (
        !key.startsWith(MULTIPART_FIELD.SCREENSHOT_PREFIX) ||
        !screenshotIdSchema.safeParse(id).success ||
        uploads.has(id) ||
        isText(part)
      ) {
        throw new RequestError(
          HTTP_STATUS.BAD_REQUEST,
          "Invalid screenshot field.",
        );
      }
      uploadedBytes += part.size;
      if (
        part.size > MAX_SCREENSHOT_BYTES ||
        uploadedBytes > MAX_SCREENSHOT_UPLOAD_BYTES
      ) {
        throw new RequestError(
          HTTP_STATUS.CONTENT_TOO_LARGE,
          "The screenshot upload is too large.",
        );
      }
      uploads.set(id, new Uint8Array(await part.arrayBuffer()));
    }
    return { input: parseJson(command), uploads };
  }

  if (mediaType !== MEDIA_TYPE.JSON) {
    throw new RequestError(
      HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE,
      "Expected JSON.",
    );
  }
  const bytes = await readBytes(request, jsonLimit);
  return { input: parseJson(bytes.toString("utf8")), uploads };
}
