import {
  TRASH_ACTION,
  TRASH_KIND,
} from "@liquidation/domain/journal/trash/constants";
import { workspaceCommand } from "@liquidation/domain/workspace/workspace";
import { tradeInput } from "@liquidation/domain/trades/trade";
import { tradeLinksSchema } from "@liquidation/domain/trades/trade-links";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { createJournal } from "../../../apps/local-server/src/journal.ts";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a/1kAAAAASUVORK5CYII=",
  "base64",
);

test("permanent deletion retains shared screenshots until their last active or trashed reference is gone", async () => {
  const directory = await mkdtemp(join(tmpdir(), "liquidation-purge-"));
  try {
    const journal = createJournal(directory);
    const id = crypto.randomUUID();
    for (const day of ["2026-11-23", "2026-11-24"]) {
      await journal.updateWorkspace(
        workspaceCommand.parse({
          record: "thought",
          day,
          input: { text: "Example", screenshotIds: [id] },
        }),
        new Map([[id, png]]),
      );
      await journal.updateTrash({
        action: TRASH_ACTION.MOVE,
        kind: TRASH_KIND.THOUGHT,
        key: day,
        revision: 1,
      });
    }
    const trash = (await journal.read()).trash;
    await journal.updateTrash({ action: TRASH_ACTION.PURGE, id: trash[0].id });
    expect(await journal.readScreenshot(id)).not.toBeNull();
    await journal.updateTrash({ action: TRASH_ACTION.PURGE, id: trash[1].id });
    expect(await journal.readScreenshot(id)).toBeNull();
    expect((await journal.read()).trash).toEqual([]);
    await expect(
      journal.updateTrash({ action: TRASH_ACTION.RESTORE, id: trash[1].id }),
    ).rejects.toThrow();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("permanent deletion refuses to leave live or trashed trade references dangling", async () => {
  const directory = await mkdtemp(join(tmpdir(), "liquidation-references-"));
  try {
    const journal = createJournal(directory);
    const id = crypto.randomUUID();
    await journal.updatePlan({
      action: "create",
      id,
      setup: {
        title: "Example",
        symbol: "EURUSD",
        direction: "long",
        entryCondition: "Review",
      },
    });
    const trade = await journal.append(
      tradeInput.parse({
        symbol: "EURUSD",
        direction: "long",
        openedAt: "2026-11-24T10:00:00Z",
        closedAt: "2026-11-24T11:00:00Z",
        profit: 100,
        commission: 0,
        swap: 0,
        risk: 50,
        notes: "",
        planId: id,
      }),
    );
    await journal.updateTrash({
      action: TRASH_ACTION.MOVE,
      kind: TRASH_KIND.PLAN,
      key: id,
      revision: 1,
    });
    const buried = (await journal.read()).trash[0];
    await expect(
      journal.updateTrash({ action: TRASH_ACTION.PURGE, id: buried.id }),
    ).rejects.toThrow();
    await journal.updateTradeLinks({
      id: trade.id,
      previous: tradeLinksSchema.parse(trade),
      next: tradeLinksSchema.parse({}),
    });
    await journal.updateTrash({ action: TRASH_ACTION.PURGE, id: buried.id });
    expect((await journal.read()).trades[0].planId).toBeUndefined();
    expect((await journal.read()).trash).toEqual([]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
