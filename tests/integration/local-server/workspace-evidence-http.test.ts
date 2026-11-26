import { JOURNAL_ROUTES } from "@liquidation/domain/journal/constants";
import { journalSchema } from "@liquidation/domain/journal/journal";
import {
  TRASH_ACTION,
  TRASH_KIND,
} from "@liquidation/domain/journal/trash/constants";
import { LEARNING_TOPIC } from "@liquidation/domain/workspace/constants";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { journalHandler } from "../../../apps/local-server/src/http/journal-handler.ts";
import { createJournal } from "../../../apps/local-server/src/journal.ts";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a/1kAAAAASUVORK5CYII=",
  "base64",
);

async function withJournal(
  run: (
    baseUrl: string,
    journal: ReturnType<typeof createJournal>,
  ) => Promise<void>,
) {
  const dir = await mkdtemp(join(tmpdir(), "liquidation-evidence-"));
  const journal = createJournal(dir);
  const server = createServer(journalHandler(journal));
  try {
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address() as AddressInfo;
    await run("http://127.0.0.1:" + address.port, journal);
  } finally {
    if (server.listening)
      await new Promise<void>((resolve) => server.close(() => resolve()));
    await rm(dir, { recursive: true, force: true });
  }
}

function post(baseUrl: string, command: unknown, pictureId?: string) {
  let request: RequestInit;
  if (pictureId) {
    const body = new FormData();
    body.set("command", JSON.stringify(command));
    body.set(
      "shot:" + pictureId,
      new Blob([png], { type: "image/png" }),
      "chart.png",
    );
    request = { method: "POST", body };
  } else {
    request = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(command),
    };
  }
  return fetch(baseUrl + JOURNAL_ROUTES.workspace, request);
}

test("persists lecture blocks and attachments while editing their topic and author", async () => {
  await withJournal(async (baseUrl, journal) => {
    const id = crypto.randomUUID();
    const data = {
      kind: "lesson",
      title: "Day one",
      body: "Legacy paragraph",
      completed: false,
    };
    const original = { record: "learning", id, input: data };
    expect((await post(baseUrl, original)).status).toBe(200);
    expect((await journal.read()).workspace.learning[0].body).toBe(data.body);

    const imageId = crypto.randomUUID();
    const body = [
      { id: crypto.randomUUID(), type: "text", text: data.body },
      {
        id: crypto.randomUUID(),
        type: "image",
        caption: "Session chart",
        screenshotIds: [imageId],
      },
      { id: crypto.randomUUID(), type: "text", text: "Next paragraph" },
    ];
    const update = {
      ...original,
      revision: 1,
      input: {
        ...data,
        body: "",
        group: "  Trading   community ",
        blocks: body,
      },
    };
    expect((await post(baseUrl, update)).status).toBe(422);
    expect((await journal.read()).workspace.learning[0].revision).toBe(1);

    const saved = await post(baseUrl, update, imageId);
    expect(saved.status).toBe(200);
    const entry = journalSchema.parse(await saved.json()).workspace.learning[0];
    expect(entry.group).toBe("Trading community");
    expect(entry.blocks).toEqual(body);

    const edit = {
      ...update,
      revision: 2,
      input: {
        ...entry,
        topic: LEARNING_TOPIC.PRICE_ACTION,
        author: "  Price   Action Community  ",
      },
    };
    expect((await post(baseUrl, edit)).status).toBe(200);
    const picture = await fetch(
      baseUrl + JOURNAL_ROUTES.planScreenshot + imageId,
    );
    expect(picture.headers.get("content-type")).toBe("image/png");
    expect(Buffer.from(await picture.arrayBuffer())).toEqual(png);
    expect((await journal.read()).workspace.learning[0]).toMatchObject({
      topic: LEARNING_TOPIC.PRICE_ACTION,
      author: "Price Action Community",
      blocks: body,
    });

    const orphan = crypto.randomUUID();
    const note = {
      record: "learning",
      id: crypto.randomUUID(),
      input: { ...data, kind: "note" },
    };
    expect((await post(baseUrl, note, orphan)).status).toBe(422);
    expect(
      (await fetch(baseUrl + JOURNAL_ROUTES.planScreenshot + orphan)).status,
    ).toBe(404);
    expect(
      (await post(baseUrl, { ...note, input: { ...note.input, blocks: body } }))
        .status,
    ).toBe(422);
    expect((await post(baseUrl, note)).status).toBe(200);
  });
});

test("uploads note images and preserves them through edits and Trash", async () => {
  await withJournal(async (baseUrl, journal) => {
    const id = crypto.randomUUID();
    const image = crypto.randomUUID();
    const command = {
      record: "learning",
      id,
      input: {
        kind: "note",
        title: "Session review",
        body: "Read the chart",
        screenshotIds: [image],
      },
    };
    expect((await post(baseUrl, command)).status).toBe(422);
    expect((await post(baseUrl, command, image)).status).toBe(200);

    const amended = await post(baseUrl, {
      ...command,
      revision: 1,
      input: {
        ...command.input,
        body: "Compare both sessions",
        topic: LEARNING_TOPIC.BACKTESTING,
        author: "Study desk",
      },
    });
    expect(amended.status).toBe(200);
    const imageUrl = baseUrl + JOURNAL_ROUTES.planScreenshot + image;
    const picture = await fetch(imageUrl);
    expect(picture.headers.get("content-type")).toBe("image/png");
    expect(Buffer.from(await picture.arrayBuffer())).toEqual(png);

    const move = (revision: number) =>
      journal.updateTrash({
        action: TRASH_ACTION.MOVE,
        kind: TRASH_KIND.LEARNING,
        key: id,
        revision,
      });
    const trashed = await move(2);
    expect((await fetch(imageUrl)).status).toBe(200);
    const restored = await journal.updateTrash({
      action: TRASH_ACTION.RESTORE,
      id: trashed.trash[0].id,
    });
    const note = restored.workspace.learning[0];
    expect(note).toMatchObject({
      completed: false,
      topic: LEARNING_TOPIC.BACKTESTING,
      author: "Study desk",
      screenshotIds: [image],
    });
    const deleted = await move(note.revision);
    await journal.updateTrash({
      action: TRASH_ACTION.PURGE,
      id: deleted.trash[0].id,
    });
    expect((await fetch(imageUrl)).status).toBe(404);
  });
});

test("saves standalone and linked examples while keeping examples out of journal trades", async () => {
  await withJournal(async (baseUrl, journal) => {
    const trade = await journal.append({
      symbol: "EURUSD",
      direction: "long",
      openedAt: "2026-11-23T08:00:00Z",
      closedAt: "2026-11-23T09:00:00Z",
      profit: -40,
      commission: -2,
      swap: 0,
      risk: 50,
      notes: "Correct exit rule",
    });
    const id = crypto.randomUUID();
    const pictureId = crypto.randomUUID();
    const own = {
      record: "highlight",
      id,
      input: {
        featured: true,
        note: "Explain the setup",
        example: { title: "Model entry", symbol: "eurusd" },
        screenshotIds: [pictureId],
      },
    };
    const linked = {
      record: "highlight",
      id: trade.id,
      input: { featured: true, note: "Followed the stop rule" },
    };
    expect((await post(baseUrl, { ...linked, id })).status).toBe(422);
    expect(
      (await post(baseUrl, { ...own, id: trade.id }, pictureId)).status,
    ).toBe(422);
    expect((await post(baseUrl, own, pictureId)).status).toBe(200);
    expect((await post(baseUrl, linked)).status).toBe(200);

    const snapshot = await journal.read();
    expect(snapshot.trades).toEqual([trade]);
    expect(snapshot.workspace.highlights).toMatchObject([
      {
        id,
        featured: true,
        example: { title: "Model entry", symbol: "EURUSD" },
        screenshotIds: [pictureId],
      },
      { id: trade.id, featured: true },
    ]);
    expect(
      (
        await post(baseUrl, {
          ...own,
          revision: 1,
          input: { ...own.input, featured: false },
        })
      ).status,
    ).toBe(200);
    expect((await journal.read()).workspace.highlights[0].featured).toBe(false);
  });
});

test("saves example metadata and timeframe charts through deletion, restore and purge", async () => {
  await withJournal(async (baseUrl, journal) => {
    const id = crypto.randomUUID();
    const pictureId = crypto.randomUUID();
    const details = {
      date: "2026-11-26",
      market: "indices",
      style: "Swing",
      timeframe: "H4",
      model: "Key level",
      rr: 2.81,
      type: "reversal",
    };
    const analysis = [
      {
        id: crypto.randomUUID(),
        timeframe: "W1",
        text: "Higher-timeframe context",
        screenshotIds: [pictureId],
      },
      {
        id: crypto.randomUUID(),
        timeframe: "D1",
        text: "Look for absorption",
        screenshotIds: [],
      },
    ];
    const command = {
      record: "highlight",
      id,
      input: {
        featured: true,
        note: "",
        example: { title: "Index setup", symbol: "SPX500" },
        details,
        analysis,
      },
    };
    expect((await post(baseUrl, command)).status).toBe(422);
    expect((await post(baseUrl, command, pictureId)).status).toBe(200);
    const move = (revision: number) =>
      journal.updateTrash({
        action: TRASH_ACTION.MOVE,
        kind: TRASH_KIND.HIGHLIGHT,
        key: id,
        revision,
      });
    const trashed = await move(1);
    const imageUrl = baseUrl + JOURNAL_ROUTES.planScreenshot + pictureId;
    expect((await fetch(imageUrl)).status).toBe(200);
    const restored = await journal.updateTrash({
      action: TRASH_ACTION.RESTORE,
      id: trashed.trash[0].id,
    });
    const example = restored.workspace.highlights[0];
    expect(example).toMatchObject({ details, analysis });
    expect(restored.trades).toEqual([]);
    const deleted = await move(example.revision);
    await journal.updateTrash({
      action: TRASH_ACTION.PURGE,
      id: deleted.trash[0].id,
    });
    expect((await fetch(imageUrl)).status).toBe(404);
  });
});

test("stores card images and written P&L with a daily review", async () => {
  await withJournal(async (baseUrl, journal) => {
    const id = crypto.randomUUID();
    const command = {
      record: "report",
      kind: "day",
      start: "2026-11-24",
      input: {
        grade: "A",
        quality: "B",
        focus: "",
        process: "",
        learned: "",
        errors: "",
        best: "",
        overview: "Card",
        missed: "",
        lesson: "",
        next: "",
        assessments: [],
        writtenPnl: 42.5,
        screenshotIds: [id],
      },
    };
    expect((await post(baseUrl, command)).status).toBe(422);
    const response = await post(baseUrl, command, id);
    expect(response.status).toBe(200);
    expect((await journal.read()).workspace.reports[0]).toMatchObject({
      writtenPnl: 42.5,
      screenshotIds: [id],
    });
    expect((await journal.readScreenshot(id))?.bytes).toEqual(png);
  });
});
