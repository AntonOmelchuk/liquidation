import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { createJournal } from "../../../apps/local-server/src/journal.ts";

test("persists concurrent requests and reloads them in a new journal instance", async () => {
  const directory = await mkdtemp(join(tmpdir(), "liquidation-test-"));
  try {
    const journal = createJournal(directory);
    expect((await journal.read()).trades).toEqual([]);
    const entry = {
      direction: "short" as const,
      openedAt: "2026-11-22T07:00:00Z",
      closedAt: "2026-11-22T08:00:00Z",
      profit: 30,
      commission: -1,
      swap: 0,
      risk: 10,
      notes: "",
    };
    const results = await Promise.all([
      journal.append({ ...entry, symbol: "EURUSD" }),
      journal.append({ ...entry, symbol: "GBPUSD" }),
    ]);
    expect((await createJournal(directory).read()).trades).toEqual(
      results.toReversed(),
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("loads legacy journals and closes an edited position exactly once", async () => {
  const directory = await mkdtemp(join(tmpdir(), "liquidation-position-"));
  try {
    await writeFile(
      join(directory, "journal.json"),
      JSON.stringify({ version: 1, trades: [] }),
    );
    const journal = createJournal(directory);
    const input = {
      symbol: "EURUSD",
      direction: "long" as const,
      openedAt: "2026-11-20T10:00:00Z",
      risk: 25,
      notes: "Initial thesis",
    };
    expect((await journal.read()).positions).toEqual([]);
    const opened = await journal.updatePosition({ action: "open", input });
    const { id, revision } = opened.positions[0];
    expect(opened.trades).toHaveLength(0);
    const edited = await journal.updatePosition({
      action: "edit",
      id,
      revision,
      input: { ...input, notes: "Updated thesis" },
    });

    const closing = {
      action: "close" as const,
      id,
      revision: edited.positions[0].revision,
      input: {
        closedAt: "2026-11-20T11:00:00Z",
        profit: 50,
        commission: -2,
        swap: 0,
      },
    };
    await expect(
      journal.updatePosition({ ...closing, revision }),
    ).rejects.toThrow();
    await expect(
      journal.updatePosition({
        ...closing,
        input: { ...closing.input, closedAt: "2026-11-20T09:00:00Z" },
      }),
    ).rejects.toThrow();
    const attempts = await Promise.allSettled([
      journal.updatePosition(closing),
      journal.updatePosition(closing),
    ]);
    expect(attempts.map(({ status }) => status)).toEqual([
      "fulfilled",
      "rejected",
    ]);

    const saved = await createJournal(directory).read();
    expect(saved.positions).toEqual([]);
    expect(saved.trades).toEqual([
      { ...input, notes: "Updated thesis", id, ...closing.input },
    ]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("persists plans on legacy journals and retains the original setup and trade links", async () => {
  const directory = await mkdtemp(join(tmpdir(), "liquidation-plans-"));
  try {
    await writeFile(
      join(directory, "journal.json"),
      JSON.stringify({ version: 1, trades: [] }),
    );
    const journal = createJournal(directory);
    const planId = "0a047d28-0555-4dfb-b1fb-acfea3c1e577";
    const setup = {
      title: "New York reversal",
      symbol: "NAS100",
      direction: "short" as const,
      entryCondition: "Enter after a failed breakout.",
    };
    expect((await journal.read()).plans).toEqual([]);
    const created = { action: "create" as const, id: planId, setup };
    await journal.updatePlan(created);
    const duplicate = await journal.updatePlan(created);
    expect(duplicate.plans).toHaveLength(1);
    expect(duplicate.plans[0].review.status).toBe("waiting");
    const edit = {
      action: "edit" as const,
      id: planId,
      revision: 1,
      setup: { ...setup, target: 19_500 },
      review: { status: "failed" as const, reason: "No valid entry." },
    };
    await journal.updatePlan(edit);
    await expect(journal.updatePlan(edit)).rejects.toThrow("Plan has changed.");

    const opened = await journal.updatePosition({
      action: "open",
      input: {
        symbol: setup.symbol,
        direction: setup.direction,
        openedAt: "2026-11-20T13:00:00Z",
        risk: 50,
        notes: "",
        planId,
      },
    });
    const position = opened.positions[0];
    await journal.updatePosition({
      action: "close",
      id: position.id,
      revision: position.revision,
      input: {
        closedAt: "2026-11-20T14:00:00Z",
        profit: -50,
        commission: -2,
        swap: 0,
      },
    });
    const saved = await createJournal(directory).read();
    expect(saved.plans[0]).toMatchObject({
      id: planId,
      revision: 2,
      originalSetup: setup,
      setup: edit.setup,
      review: edit.review,
    });
    expect(saved.trades[0]).toMatchObject({ id: position.id, planId });
    await expect(
      journal.append({
        ...saved.trades[0],
        planId: "0a047d28-0555-4dfb-b1fb-acfea3c1e578",
      }),
    ).rejects.toThrow("The linked plan does not exist.");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
