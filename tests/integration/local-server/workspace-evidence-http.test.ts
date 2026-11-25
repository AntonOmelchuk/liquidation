import { JOURNAL_ROUTES } from "@liquidation/domain/journal/constants";
import { journalSchema } from "@liquidation/domain/journal/journal";
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

test("persists lecture text and image blocks in order and retains their attachments when archived", async () => {
  await withJournal(async (baseUrl, journal) => {
    const id = crypto.randomUUID();
    const data = {
      kind: "lesson",
      title: "Day one",
      body: "Legacy paragraph",
      archived: false,
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

    const archive = {
      ...update,
      revision: 2,
      input: { ...entry, archived: true },
    };
    expect((await post(baseUrl, archive)).status).toBe(200);
    const picture = await fetch(
      baseUrl + JOURNAL_ROUTES.planScreenshot + imageId,
    );
    expect(picture.headers.get("content-type")).toBe("image/png");
    expect(Buffer.from(await picture.arrayBuffer())).toEqual(png);
    expect((await journal.read()).workspace.learning[0]).toMatchObject({
      archived: true,
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
