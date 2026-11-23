import { JOURNAL_ROUTES } from "@liquidation/domain/journal/constants";
import { journalSchema } from "@liquidation/domain/journal/journal";
import { netCents } from "@liquidation/domain/trades/trade";
import { tradeLinksSchema } from "@liquidation/domain/trades/trade-links";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { journalHandler } from "../../../apps/local-server/src/http/journal-handler.ts";
import { createJournal } from "../../../apps/local-server/src/journal.ts";

test("persists classifications through position close, edits and a reload", async () => {
  const directory = await mkdtemp(
    join(tmpdir(), "liquidation-classifications-"),
  );
  const journal = createJournal(directory);
  const server = createServer(journalHandler(journal));
  try {
    const openedAt = "2026-11-23T10:00:00Z";
    const closedAt = "2026-11-23T12:00:00Z";
    const entry = {
      symbol: "EURUSD",
      direction: "long",
      openedAt,
      risk: 20,
      notes: "",
    };
    const legacy = {
      ...entry,
      id: randomUUID(),
      closedAt,
      profit: 10,
      commission: -1,
      swap: 0,
    };
    await writeFile(
      join(directory, "journal.json"),
      JSON.stringify({ version: 1, trades: [legacy] }),
    );
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const post = (path: string, data: unknown) =>
      fetch(origin + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

    const opened = await post(JOURNAL_ROUTES.positions, {
      action: "open",
      input: {
        ...entry,
        account: " Evaluation ",
        timeframe: "M15",
        session: "LKZ",
        entryType: "market",
      },
    });
    expect(opened.status).toBe(200);
    const { id, revision, account } = journalSchema.parse(await opened.json())
      .positions[0];
    expect(account).toBe("Evaluation");

    const closing = {
      action: "close",
      id,
      revision,
      input: {
        closedAt,
        profit: 44,
        commission: -2,
        swap: 0,
        links: {
          account,
          timeframe: "M15",
          entryType: "limit",
          mistakes: ["Early entry", "early entry"],
        },
      },
    };
    const closed = await post(JOURNAL_ROUTES.positions, closing);
    expect(closed.status).toBe(200);
    const trade = journalSchema.parse(await closed.json()).trades[0];
    expect(trade).toMatchObject({
      id,
      account: "Evaluation",
      timeframe: "M15",
      entryType: "limit",
      mistakes: ["Early entry"],
    });
    expect(trade.session).toBeUndefined();
    expect(netCents(trade)).toBe(4200);
    const previous = tradeLinksSchema.parse(trade);
    const edited = { id, previous, next: { session: "NYKZ" } };
    expect((await post(JOURNAL_ROUTES.tradeLinks, edited)).status).toBe(200);
    expect((await post(JOURNAL_ROUTES.tradeLinks, edited)).status).toBe(200);
    expect(
      (
        await post(JOURNAL_ROUTES.tradeLinks, {
          ...edited,
          next: { account: "Other" },
        })
      ).status,
    ).toBe(409);
    expect(
      (
        await post(JOURNAL_ROUTES.tradeLinks, {
          ...edited,
          next: { mistakes: Array(11).fill("Too many") },
        })
      ).status,
    ).toBe(422);

    const persisted = await createJournal(directory).read();
    expect(persisted.positions).toEqual([]);
    expect(persisted.trades[1]).toEqual(legacy);
    expect(tradeLinksSchema.parse(persisted.trades[0])).toEqual({
      session: "NYKZ",
    });
    expect(netCents(persisted.trades[0])).toBe(4200);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await rm(directory, { recursive: true, force: true });
  }
});
