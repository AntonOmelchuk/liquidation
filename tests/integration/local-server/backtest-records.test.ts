import {
  backtestCommand,
  backtestResults,
  sampleResult,
} from "@liquidation/domain/backtests/backtest";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { createJournal } from "../../../apps/local-server/src/journal.ts";

test("validates the initial stop, stores evidence and keeps simulated records outside real trades", async () => {
  const directory = await mkdtemp(join(tmpdir(), "liquidation-backtest-"));
  try {
    const journal = createJournal(directory);
    const id = randomUUID();
    const screenshotId = randomUUID();
    const run = backtestCommand.parse({
      action: "create",
      id,
      metadata: { title: "Sweep sample", thesis: "" },
    });
    await journal.updateBacktest(run);
    const sample = {
      id: randomUUID(),
      symbol: "NAS100",
      direction: "short",
      timeframe: "M15",
      openedAt: "2026-11-20T08:00:00Z",
      closedAt: "2026-11-20T09:00:00Z",
      entry: 20_000,
      stop: 20_100,
      exit: 19_800,
      costsR: 0.1,
      screenshotIds: [screenshotId],
      notes: "Fixed risk",
    } as const;
    const command = { action: "add-sample", id, revision: 1, sample } as const;
    expect(
      backtestCommand.safeParse({
        ...command,
        sample: { ...sample, stop: 20_000 },
      }).success,
    ).toBe(false);
    expect(
      backtestCommand.safeParse({
        ...command,
        sample: { ...sample, closedAt: "2026-11-20T07:00:00Z" },
      }).success,
    ).toBe(false);
    await expect(
      journal.updateBacktest(backtestCommand.parse(command)),
    ).rejects.toThrow("screenshot is missing");
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a/1kAAAAASUVORK5CYII=",
      "base64",
    );
    await journal.updateBacktest(
      backtestCommand.parse(command),
      new Map([[screenshotId, png]]),
    );
    const edit = {
      ...command,
      action: "edit-sample",
      sample: { ...sample, exit: 19_900 },
    };
    await expect(
      journal.updateBacktest(backtestCommand.parse(edit)),
    ).rejects.toThrow("Backtest has changed.");
    await journal.updateBacktest(
      backtestCommand.parse({ ...edit, revision: 2 }),
    );
    const restarted = createJournal(directory);
    const saved = await restarted.read();
    expect(saved.trades).toEqual([]);
    expect(saved.positions).toEqual([]);
    expect(saved.backtests[0].samples[0].screenshotIds).toEqual([screenshotId]);
    expect(backtestResults(saved.backtests[0].samples)).toMatchObject({
      count: 1,
      totalR: 0.9,
      winRate: 1,
    });
    expect(
      sampleResult({
        ...sample,
        direction: "long",
        stop: 19_950,
        exit: 19_975,
      }),
    ).toBe(-0.6);
    expect((await restarted.readScreenshot(screenshotId))?.bytes).toEqual(png);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
