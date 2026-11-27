import {
  BACKUP_MEDIA_TYPE,
  BACKUP_ROUTES,
} from "@liquidation/domain/backup/constants";
import {
  backupPreviewSchema,
  backupRestoreSchema,
} from "@liquidation/domain/backup/contracts";
import {
  JOURNAL_ROUTES,
  JOURNAL_VERSION,
} from "@liquidation/domain/journal/constants";
import { journalSchema } from "@liquidation/domain/journal/journal";
import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { tradeRecordInput } from "@liquidation/domain/trades/trade";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { journalHandler } from "../../../apps/local-server/src/http/journal-handler.ts";
import { createJournal } from "../../../apps/local-server/src/journal.ts";
import {
  PREVIOUS_SCREENSHOTS,
  RESTORE_TRANSACTION,
} from "../../../apps/local-server/src/storage/backup/constants.ts";
import {
  JOURNAL_FILE,
  SCREENSHOT_DIRECTORY,
} from "../../../apps/local-server/src/storage/constants.ts";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a/1kAAAAASUVORK5CYII=",
  "base64",
);
const trade = tradeRecordInput.parse({
  symbol: "EURUSD",
  direction: "long",
  openedAt: "2026-11-23T10:00:00Z",
  closedAt: "2026-11-23T12:00:00Z",
  profit: 42,
  commission: -2,
  swap: 0,
  risk: 20,
  notes: "Entry",
});

test("previews and restores a ZIP with screenshots and Trash, keeping the replaced journal", async () => {
  const directory = await mkdtemp(join(tmpdir(), "liquidation-backup-"));
  const inputImage = randomUUID();
  const trashImage = randomUUID();
  const missingImage = randomUUID();
  const nextImage = randomUUID();
  const original = journalSchema.parse({
    version: JOURNAL_VERSION,
    trades: [
      {
        ...trade,
        id: randomUUID(),
        entryScreenshotIds: [inputImage, missingImage],
      },
    ],
    trash: [
      {
        id: randomUUID(),
        at: trade.closedAt,
        kind: TRASH_KIND.THOUGHT,
        value: {
          day: "2026-11-23",
          text: "Prior analysis",
          screenshotIds: [trashImage],
          revision: 1,
        },
      },
    ],
  });
  const journal = createJournal(directory);
  const server = createServer(journalHandler(journal));
  try {
    const images = join(directory, SCREENSHOT_DIRECTORY);
    await mkdir(images);
    await Promise.all([
      writeFile(join(images, inputImage), png),
      writeFile(join(images, trashImage), png),
      writeFile(join(directory, JOURNAL_FILE), JSON.stringify(original)),
    ]);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const origin = "http://127.0.0.1:" + (server.address() as AddressInfo).port;
    const upload = (bytes: ArrayBuffer | string) =>
      fetch(origin + BACKUP_ROUTES.preview, {
        method: "POST",
        headers: { "Content-Type": BACKUP_MEDIA_TYPE },
        body: bytes,
      });
    const preview = async (bytes: ArrayBuffer) => {
      const response = await upload(bytes);
      expect(response.status).toBe(200);
      return backupPreviewSchema.parse(await response.json());
    };
    const select = (route: string, token: string) =>
      fetch(origin + route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

    const download = await fetch(origin + BACKUP_ROUTES.download);
    expect(download.status).toBe(200);
    expect(download.headers.get("content-type")).toBe(BACKUP_MEDIA_TYPE);
    expect(download.headers.get("content-disposition")).toMatch(
      /^attachment;.*\.zip"$/,
    );
    const zip = await download.arrayBuffer();
    expect((await upload("Invalid backup")).status).toBe(422);

    const stale = await preview(zip);
    expect(stale.summary).toMatchObject({
      trades: 1,
      screenshots: 2,
      missingScreenshots: 1,
      trash: 1,
    });
    expect(await journal.read()).toEqual(original);
    await journal.append(
      { ...trade, entryScreenshotIds: [nextImage] },
      new Map([[nextImage, png]]),
    );
    const current = await journal.read();
    expect(current.trades).toHaveLength(2);
    expect((await select(BACKUP_ROUTES.restore, stale.token)).status).toBe(409);
    expect(await journal.read()).toEqual(current);

    const canceled = await preview(zip);
    expect((await select(BACKUP_ROUTES.cancel, canceled.token)).status).toBe(
      200,
    );
    expect((await select(BACKUP_ROUTES.restore, canceled.token)).status).toBe(
      409,
    );
    expect(await journal.read()).toEqual(current);

    const ready = await preview(zip);
    const response = await select(BACKUP_ROUTES.restore, ready.token);
    expect(response.status).toBe(200);
    const restored = backupRestoreSchema.parse(await response.json());
    expect(restored.journal).toEqual(original);
    expect(await createJournal(directory).read()).toEqual(original);
    expect(new Set(await readdir(images))).toEqual(
      new Set([inputImage, trashImage]),
    );
    for (const id of [inputImage, trashImage]) {
      const image = await fetch(origin + JOURNAL_ROUTES.planScreenshot + id);
      expect(image.status).toBe(200);
      expect(Buffer.from(await image.arrayBuffer())).toEqual(png);
    }

    const safety = await fetch(
      origin + BACKUP_ROUTES.safety + restored.safetyId,
    );
    expect(safety.status).toBe(200);
    const undo = await preview(await safety.arrayBuffer());
    expect(undo.summary).toMatchObject({ trades: 2, screenshots: 3, trash: 1 });
    expect((await select(BACKUP_ROUTES.restore, undo.token)).status).toBe(200);
    expect(await journal.read()).toEqual(current);
    expect((await journal.readScreenshot(nextImage))?.bytes).toEqual(png);
  } finally {
    if (server.listening)
      await new Promise<void>((resolve) => server.close(() => resolve()));
    await rm(directory, { recursive: true, force: true });
  }
});

test("recovers the previous journal if the process stopped before publishing a restore", async () => {
  const directory = await mkdtemp(
    join(tmpdir(), "liquidation-interrupted-restore-"),
  );
  const transaction = join(directory, RESTORE_TRANSACTION);
  const id = randomUUID();
  const original = journalSchema.parse({
    version: JOURNAL_VERSION,
    trades: [{ ...trade, id: randomUUID(), entryScreenshotIds: [id] }],
  });
  try {
    const priorImages = join(transaction, PREVIOUS_SCREENSHOTS);
    const liveImages = join(directory, SCREENSHOT_DIRECTORY);
    await mkdir(priorImages, { recursive: true });
    await mkdir(liveImages);
    await Promise.all([
      writeFile(join(priorImages, id), png),
      writeFile(join(directory, JOURNAL_FILE), JSON.stringify(original)),
      writeFile(
        join(transaction, JOURNAL_FILE),
        JSON.stringify({ ...original, trades: [] }),
      ),
    ]);
    const journal = createJournal(directory);
    expect(await journal.read()).toEqual(original);
    expect((await journal.readScreenshot(id))?.bytes).toEqual(png);
    expect(await readdir(directory)).not.toContain(RESTORE_TRANSACTION);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
