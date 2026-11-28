import { planCommand } from "@liquidation/domain/plans/plan";
import type { PlanSetup } from "@liquidation/domain/plans/types";
import type { PlaybookCommand } from "@liquidation/domain/playbooks/types";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";

import { createJournal } from "../../../apps/local-server/src/journal.ts";

const setup: PlanSetup = {
  title: "New York sweep",
  symbol: "EURUSD",
  direction: "long",
  startsOn: "2026-11-22",
  entryCondition: "Wait for a reclaim.",
};

const positionInput = {
  symbol: "EURUSD",
  openedAt: "2026-11-19T13:00:00Z",
  direction: "long" as const,
  risk: 40,
  notes: "Historical entry",
  timeframe: "M15",
};

const tradeInput = {
  ...positionInput,
  closedAt: "2026-11-19T14:00:00Z",
  profit: 90,
  commission: -7,
  swap: 0,
};

async function withJournal(
  run: (
    journal: ReturnType<typeof createJournal>,
    directory: string,
  ) => Promise<void>,
) {
  const directory = await mkdtemp(join(tmpdir(), "liquidation-plan-links-"));
  try {
    await run(createJournal(directory), directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function newPlaybook() {
  return {
    action: "create",
    id: randomUUID(),
    metadata: {
      title: "New York reversal",
      status: "active",
      overview: "",
      notes: "",
      limits: {},
    },
    rules: {
      setups: [{ id: randomUUID(), name: "Sweep", description: "", rules: [] }],
      filters: [],
      management: [
        {
          id: randomUUID(),
          label: "Stopped using the original level",
          detail: "",
        },
      ],
    },
  } satisfies PlaybookCommand;
}

test("creates a plan with a chosen status and playbook and edits its historical trade links", async () => {
  await withJournal(async (journal, directory) => {
    const book = newPlaybook();
    await journal.updatePlaybook(book);
    await journal.updatePlaybook({
      ...book,
      action: "edit",
      revision: 1,
      rules: {
        ...book.rules,
        management: [{ ...book.rules.management[0], label: "Updated rule" }],
      },
    });
    const playbook = { id: book.id };
    const old = await journal.append({
      ...tradeInput,
      playbook,
    });
    const open = (
      await journal.updatePosition({ action: "open", input: positionInput })
    ).positions[0];
    const id = randomUUID();
    const command = planCommand.parse({
      action: "create",
      id,
      setup: { ...setup, playbook },
      review: { status: "in-progress" },
      tradeChanges: [
        { id: old.id, previousPlanId: null, attached: true },
        { id: open.id, previousPlanId: null, attached: true },
      ],
    });
    const created = await journal.updatePlan(command);
    expect(created.plans[0]).toMatchObject({
      id,
      setup: { playbook },
      review: { status: "in-progress" },
    });
    expect(created.trades[0]).toEqual({ ...old, planId: id });
    expect(created.positions[0]).toMatchObject({
      id: open.id,
      planId: id,
      revision: 2,
    });
    expect((await journal.updatePlan(command)).positions[0].revision).toBe(2);

    await expect(
      journal.updatePosition({
        action: "close",
        id: open.id,
        revision: open.revision,
        input: tradeInput,
      }),
    ).rejects.toThrow("Position has changed.");

    await journal.updatePlan(
      planCommand.parse({
        action: "edit",
        id,
        revision: 1,
        setup: { ...setup, playbook },
        review: { status: "failed", reason: "No confirmation." },
        tradeChanges: [{ id: open.id, previousPlanId: id, attached: false }],
      }),
    );
    const reopened = await createJournal(directory).read();
    expect(reopened.plans[0].review).toEqual({
      status: "failed",
      reason: "No confirmation.",
    });
    expect(reopened.plans[0].setup.playbook).toEqual(playbook);
    expect(reopened.trades[0]).toEqual({ ...old, planId: id });
    expect(reopened.positions[0].planId).toBeUndefined();
    expect(reopened.positions[0].revision).toBe(3);
  });
});

test("moves a trade when the original plan matches and rolls back a batch containing a stale trade", async () => {
  await withJournal(async (journal) => {
    const oldId = randomUUID();
    const newId = randomUUID();
    await journal.updatePlan({ action: "create", id: oldId, setup });
    await journal.updatePlan({
      action: "create",
      id: newId,
      setup: { ...setup, title: "Revised idea" },
    });
    const linked = await journal.append({ ...tradeInput, planId: oldId });
    const unlinked = await journal.append(tradeInput);
    const edit = {
      action: "edit" as const,
      id: newId,
      revision: 1,
      setup: { ...setup, title: "Revised idea" },
      review: { status: "worked" as const },
    };
    await expect(
      journal.updatePlan({
        ...edit,
        tradeChanges: [
          { id: unlinked.id, previousPlanId: null, attached: true },
          { id: linked.id, previousPlanId: null, attached: true },
        ],
      }),
    ).rejects.toThrow("A selected trade was linked to a different plan.");

    const unchanged = await journal.read();
    expect(unchanged.trades).toEqual([unlinked, linked]);
    expect(unchanged.plans[0]).toMatchObject({
      id: newId,
      revision: 1,
      review: { status: "waiting" },
    });

    const moved = await journal.updatePlan({
      ...edit,
      tradeChanges: [{ id: linked.id, previousPlanId: oldId, attached: true }],
    });
    expect(moved.trades).toEqual([unlinked, { ...linked, planId: newId }]);
  });
});

test("validates a playbook version on a plan and accepts a playbook chosen at position close", async () => {
  await withJournal(async (journal) => {
    const book = newPlaybook();
    await journal.updatePlaybook(book);
    const id = randomUUID();
    const playbook = { id: book.id };
    const createPlan = {
      action: "create" as const,
      id,
      setup: { ...setup, playbook },
    };

    await expect(
      journal.updatePlan({
        ...createPlan,
        setup: { ...setup, playbook: { id: randomUUID() } },
      }),
    ).rejects.toThrow("The linked playbook is unavailable");
    expect((await journal.read()).plans).toHaveLength(0);
    await journal.updatePlan(createPlan);

    const open = (
      await journal.updatePosition({ action: "open", input: positionInput })
    ).positions[0];
    const links = {
      planId: id,
      timeframe: "H1",
      playbook: {
        ...playbook,
        setupId: book.rules.setups[0].id,
        management: [{ ruleId: book.rules.management[0].id, met: true }],
      },
    };
    const result = await journal.updatePosition({
      action: "close",
      id: open.id,
      revision: open.revision,
      input: { ...tradeInput, links },
    });
    expect(result.positions).toHaveLength(0);
    expect(result.trades[0]).toMatchObject({
      ...tradeInput,
      ...links,
      id: open.id,
    });
  });
});
