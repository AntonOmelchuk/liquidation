import {
  JOURNAL_ROUTES,
  MULTIPART_FIELD,
} from "@liquidation/domain/journal/constants";
import { journalSchema } from "@liquidation/domain/journal/journal";
import { tradeLinksSchema } from "@liquidation/domain/trades/trade-links";
import { tradeSchema } from "@liquidation/domain/trades/trade";
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { createJournal } from "../../../apps/local-server/src/journal.ts";
import { journalHandler } from "../../../apps/local-server/src/http/journal-handler.ts";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a/1kAAAAASUVORK5CYII=",
  "base64",
);
const entry = {
  symbol: "EURUSD",
  direction: "long",
  openedAt: "2026-11-23T10:00:00Z",
  risk: 20,
  notes: "Entry",
};
const outcome = {
  closedAt: "2026-11-23T12:00:00Z",
  profit: 42,
  commission: -2,
  swap: 0,
};

test("uploads and retains trade evidence through open, close, review, trash and restore", async () => {
  const directory = await mkdtemp(
    join(tmpdir(), "liquidation-trade-evidence-"),
  );
  const journal = createJournal(directory);
  const server = createServer(journalHandler(journal));
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const origin = "http://127.0.0.1:" + (server.address() as AddressInfo).port;
  function post(path: string, command: unknown, ids: string[] = []) {
    if (!ids.length)
      return fetch(origin + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });
    const body = new FormData();
    body.set(MULTIPART_FIELD.COMMAND, JSON.stringify(command));
    for (const id of ids)
      body.append(
        MULTIPART_FIELD.SCREENSHOT_PREFIX + id,
        new Blob([png], { type: "image/png" }),
        "chart.png",
      );
    return fetch(origin + path, { method: "POST", body });
  }
  const chart = async (id: string) =>
    fetch(origin + JOURNAL_ROUTES.planScreenshot + id);
  const entryId = crypto.randomUUID(),
    exitId = crypto.randomUUID(),
    extraId = crypto.randomUUID();
  try {
    const open = {
      action: "open",
      input: { ...entry, entryScreenshotIds: [entryId] },
    };
    expect((await post(JOURNAL_ROUTES.positions, open)).status).toBe(422);
    expect(
      (await post(JOURNAL_ROUTES.positions, open, [entryId, extraId])).status,
    ).toBe(422);
    expect((await chart(entryId)).status).toBe(404);
    const opened = await post(JOURNAL_ROUTES.positions, open, [entryId]);
    expect(opened.status).toBe(200);
    const position = journalSchema.parse(await opened.json()).positions[0];
    expect(position.entryScreenshotIds).toEqual([entryId]);
    expect(Buffer.from(await (await chart(entryId)).arrayBuffer())).toEqual(
      png,
    );
    const editedPosition = await post(JOURNAL_ROUTES.positions, {
      action: "edit",
      id: position.id,
      revision: position.revision,
      input: { ...position, breakeven: true },
    });
    expect(editedPosition.status).toBe(200);
    const updated = journalSchema.parse(await editedPosition.json())
      .positions[0];
    expect(updated.entryScreenshotIds).toEqual([entryId]);
    expect((await chart(entryId)).status).toBe(200);
    const close = {
      action: "close",
      id: position.id,
      revision: updated.revision,
      input: {
        ...outcome,
        links: {
          ...tradeLinksSchema.parse(updated),
          exitScreenshotIds: [exitId],
        },
      },
    };
    expect((await post(JOURNAL_ROUTES.positions, close)).status).toBe(422);
    const closed = await post(JOURNAL_ROUTES.positions, close, [exitId]);
    expect(closed.status).toBe(200);
    const trade = journalSchema.parse(await closed.json()).trades[0];
    expect(trade).toMatchObject({
      id: position.id,
      entryScreenshotIds: [entryId],
      exitScreenshotIds: [exitId],
      profit: 42,
    });
    const previous = tradeLinksSchema.parse(trade);
    const next = {
      ...previous,
      mistakes: ["Early entry", "FOMO"],
      criticalMistakes: ["FOMO"],
      mistakesReviewed: true,
      reviewNotes: "Wait for confirmation.",
      entryScreenshotIds: [extraId, entryId],
    };
    const reviewed = await post(
      JOURNAL_ROUTES.tradeLinks,
      { id: trade.id, previous, next },
      [extraId],
    );
    expect(reviewed.status).toBe(200);
    expect(journalSchema.parse(await reviewed.json()).trades[0]).toMatchObject(
      next,
    );
    const current = tradeLinksSchema.parse((await journal.read()).trades[0]);
    const invalidId = crypto.randomUUID();
    expect(
      (
        await post(
          JOURNAL_ROUTES.tradeLinks,
          {
            id: trade.id,
            previous,
            next: { ...next, exitScreenshotIds: [invalidId] },
          },
          [invalidId],
        )
      ).status,
    ).toBe(409);
    expect((await chart(invalidId)).status).toBe(404);
    expect(
      (
        await post(JOURNAL_ROUTES.tradeLinks, {
          id: trade.id,
          previous: current,
          next: { ...current, criticalMistakes: ["Wrong tag"] },
        })
      ).status,
    ).toBe(422);
    const reduced = { ...current, entryScreenshotIds: [extraId] };
    expect(
      (
        await post(JOURNAL_ROUTES.tradeLinks, {
          id: trade.id,
          previous: current,
          next: reduced,
        })
      ).status,
    ).toBe(200);
    expect((await chart(entryId)).status).toBe(404);
    expect((await chart(exitId)).status).toBe(200);
    await post(JOURNAL_ROUTES.trash, {
      action: "move",
      kind: "trade",
      key: trade.id,
    });
    let saved = await journal.read();
    expect(saved.trades).toEqual([]);
    expect((await chart(extraId)).status).toBe(200);
    await post(JOURNAL_ROUTES.trash, {
      action: "restore",
      id: saved.trash[0].id,
    });
    saved = await createJournal(directory).read();
    expect(saved.trades[0]).toMatchObject(reduced);
    expect((await chart(exitId)).status).toBe(200);
    await post(JOURNAL_ROUTES.trash, {
      action: "move",
      kind: "trade",
      key: trade.id,
    });
    saved = await journal.read();
    expect(
      (
        await post(JOURNAL_ROUTES.trash, {
          action: "purge",
          id: saved.trash[0].id,
        })
      ).status,
    ).toBe(200);
    expect((await chart(extraId)).status).toBe(404);
    expect((await chart(exitId)).status).toBe(404);

    const directId = crypto.randomUUID();
    const direct = await post(
      JOURNAL_ROUTES.trades,
      { ...entry, ...outcome, entryScreenshotIds: [directId] },
      [directId],
    );
    expect(direct.status).toBe(201);
    expect(tradeSchema.parse(await direct.json()).entryScreenshotIds).toEqual([
      directId,
    ]);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await rm(directory, { recursive: true, force: true });
  }
});

test("historical unchecked rules without reasons remain editable when adding chart evidence", async () => {
  const directory = await mkdtemp(
    join(tmpdir(), "liquidation-legacy-trade-evidence-"),
  );
  try {
    const journal = createJournal(directory);
    const bookId = crypto.randomUUID(),
      setupId = crypto.randomUUID(),
      ruleId = crypto.randomUUID(),
      id = crypto.randomUUID(),
      chartId = crypto.randomUUID();
    const book = {
      id: bookId,
      revision: 1,
      title: "Legacy strategy",
      status: "active",
      overview: "",
      notes: "",
      limits: {},
      createdAt: entry.openedAt,
      updatedAt: entry.openedAt,
      reviews: [],
      versions: [
        {
          number: 1,
          at: entry.openedAt,
          setups: [
            {
              id: setupId,
              name: "Sweep",
              description: "",
              rules: [{ id: ruleId, label: "Sweep first", detail: "" }],
            },
          ],
          filters: [],
          management: [],
        },
      ],
    };
    const legacy = {
      ...entry,
      ...outcome,
      id,
      playbook: {
        id: bookId,
        version: 1,
        setupId,
        entry: [{ ruleId, met: false }],
      },
    };
    await writeFile(
      join(directory, "journal.json"),
      JSON.stringify({ version: 1, trades: [legacy], playbooks: [book] }),
    );
    const previous = tradeLinksSchema.parse((await journal.read()).trades[0]);
    await journal.updateTradeLinks(
      { id, previous, next: { ...previous, entryScreenshotIds: [chartId] } },
      new Map([[chartId, png]]),
    );
    expect((await journal.read()).trades[0]).toMatchObject({
      entryScreenshotIds: [chartId],
      playbook: {
        id: bookId,
        setupId,
        entry: legacy.playbook.entry,
        recordedRules: {
          setupName: "Sweep",
          entry: [{ id: ruleId, label: "Sweep first", detail: "" }],
        },
      },
    });
    expect(await journal.readScreenshot(chartId)).not.toBeNull();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
