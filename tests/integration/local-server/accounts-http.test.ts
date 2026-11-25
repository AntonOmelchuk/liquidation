import { JOURNAL_ROUTES } from "@liquidation/domain/journal/constants";
import { journalSchema } from "@liquidation/domain/journal/journal";
import { tradeInput } from "@liquidation/domain/trades/trade";
import { tradeLinksSchema } from "@liquidation/domain/trades/trade-links";
import { tradeAccountKey } from "@liquidation/domain/trades/trade-tags";
import { accountPerformance } from "@liquidation/domain/accounts/performance";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { journalHandler } from "../../../apps/local-server/src/http/journal-handler.ts";
import { createJournal } from "../../../apps/local-server/src/journal.ts";

test("accounts adopt legacy labels, preserve stable links through rename/close, and protect ledger history", async () => {
  const directory = await mkdtemp(join(tmpdir(), "liquidation-accounts-"));
  const journal = createJournal(directory);
  const server = createServer(journalHandler(journal));
  try {
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const base = "http://127.0.0.1:" + (server.address() as AddressInfo).port;
    async function post(route: string, value: unknown) {
      const result = await fetch(base + route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });
      return { status: result.status, body: await result.json() };
    }
    const openedAt = "2026-11-20T10:00:00Z";
    const closedAt = "2026-11-20T11:00:00Z";
    const input = {
      symbol: "EURUSD",
      direction: "long",
      risk: 50,
      openedAt,
      closedAt,
      profit: 105,
      commission: -5,
      swap: 0,
      notes: "",
      account: " evaluation ",
    };
    const legacy = await journal.append(tradeInput.parse(input));
    const id = crypto.randomUUID();
    const account = {
      name: "Evaluation",
      firm: "Example",
      kind: "prop",
      currency: "USD",
      startingBalance: 10000,
      archived: false,
      notes: "",
    };
    const create = await post(JOURNAL_ROUTES.accounts, {
      record: "account",
      id,
      input: account,
    });
    expect(create.status).toBe(200);
    let state = journalSchema.parse(create.body);
    expect(state.trades[0]).toMatchObject({
      id: legacy.id,
      accountId: id,
      account: "Evaluation",
    });
    expect(tradeAccountKey(state.trades[0])).toBe(id);
    expect(
      (
        await post(JOURNAL_ROUTES.accounts, {
          record: "account",
          id: crypto.randomUUID(),
          input: { ...account, name: "Second", currency: "EUR" },
        })
      ).status,
    ).toBe(422);
    expect(
      (
        await post(JOURNAL_ROUTES.positions, {
          action: "open",
          input: { ...input, accountId: id },
        })
      ).status,
    ).toBe(200);
    const position = (await journal.read()).positions[0];
    expect(
      (
        await post(JOURNAL_ROUTES.accounts, {
          record: "account",
          id,
          revision: 1,
          input: { ...account, name: "Funded", archived: true },
        })
      ).status,
    ).toBe(200);
    state = await journal.read();
    expect(state.trades[0].account).toBe("Funded");
    expect(state.positions[0]).toMatchObject({
      id: position.id,
      accountId: id,
      account: "Funded",
      revision: position.revision + 1,
    });
    expect(
      (
        await post(JOURNAL_ROUTES.positions, {
          action: "open",
          input: { ...input, accountId: id },
        })
      ).status,
    ).toBe(422);
    const open = state.positions[0];
    expect(
      (
        await post(JOURNAL_ROUTES.positions, {
          action: "close",
          id: open.id,
          revision: open.revision,
          input: {
            closedAt,
            profit: 55,
            commission: -5,
            swap: 0,
            links: { ...tradeLinksSchema.parse(open), breakeven: true },
          },
        })
      ).status,
    ).toBe(200);
    const movementId = crypto.randomUUID();
    const movement = {
      record: "movement",
      id: movementId,
      input: {
        accountId: id,
        kind: "deposit",
        amount: 1000,
        at: "2026-11-19T10:00:00Z",
        notes: "Funding",
      },
    };
    expect((await post(JOURNAL_ROUTES.accounts, movement)).status).toBe(200);
    state = await journal.read();
    expect(state.trades).toHaveLength(2);
    expect(
      state.trades.every(
        (trade) => trade.accountId === id && trade.account === "Funded",
      ),
    ).toBe(true);
    expect(state.trades[0].breakeven).toBe(true);
    expect(
      accountPerformance(state.accounts[0], state, "2026-11-24T00:00:00Z")
        .balance,
    ).toBe(11150);
    expect(
      (
        await post(JOURNAL_ROUTES.trash, {
          action: "move",
          kind: "account",
          key: id,
          revision: 2,
        })
      ).status,
    ).toBe(409);
    expect(
      (
        await post(JOURNAL_ROUTES.trash, {
          action: "move",
          kind: "movement",
          key: movementId,
          revision: 1,
        })
      ).status,
    ).toBe(200);
    state = await journal.read();
    const buried = state.trash.find((entry) => entry.kind === "movement")!;
    expect(
      (await post(JOURNAL_ROUTES.trash, { action: "restore", id: buried.id }))
        .status,
    ).toBe(200);
    expect((await journal.read()).movements[0]).toMatchObject({
      id: movementId,
      revision: 2,
    });
  } finally {
    if (server.listening)
      await new Promise<void>((resolve) => server.close(() => resolve()));
    await rm(directory, { recursive: true, force: true });
  }
});
