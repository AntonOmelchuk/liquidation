import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { createJournal } from "./journal.ts";

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
