import { comparePlanPerformance } from "@liquidation/domain/analytics/plan-performance";
import { JOURNAL_ROUTES } from "@liquidation/domain/journal/constants";
import { journalSchema } from "@liquidation/domain/journal/journal";
import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { PLAYBOOK_TEMPLATE } from "@liquidation/domain/playbooks/constants";
import {
  currentVersion,
  playbookCommand,
} from "@liquidation/domain/playbooks/playbook";
import { emptyPlaybookStrategy } from "@liquidation/domain/playbooks/strategy";
import { workspaceCommand } from "@liquidation/domain/workspace/workspace";
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
const openedAt = "2026-11-24T08:00:00Z";
const closedAt = "2026-11-24T09:00:00Z";
const tradeDetails = {
  symbol: "EURUSD",
  direction: "long" as const,
  openedAt,
  risk: 25,
  notes: "",
};

async function withJournal(
  run: (
    journal: ReturnType<typeof createJournal>,
    baseUrl: string,
  ) => Promise<void>,
) {
  const directory = await mkdtemp(join(tmpdir(), "liquidation-planning-"));
  const journal = createJournal(directory);
  const server = createServer(journalHandler(journal));
  try {
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    await run(
      journal,
      "http://127.0.0.1:" + (server.address() as AddressInfo).port,
    );
  } finally {
    if (server.listening)
      await new Promise<void>((resolve) => server.close(() => resolve()));
    await rm(directory, { recursive: true, force: true });
  }
}

async function post(url: string, data: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return { status: response.status, body: await response.json() };
}

test("trash preserves linked plans and versioned playbooks through a real position close and restores records and evidence", async () => {
  await withJournal(async (journal, baseUrl) => {
    const bookId = crypto.randomUUID();
    const setupId = crypto.randomUUID();
    const ruleId = crypto.randomUUID();
    const strategy = emptyPlaybookStrategy(PLAYBOOK_TEMPLATE.COMMUNITY);
    const image = crypto.randomUUID();
    strategy.community!.chartExamples.push({
      id: crypto.randomUUID(),
      label: "Review example",
      detail: "",
      screenshotIds: [image],
    });
    const book = playbookCommand.parse({
      action: "create",
      id: bookId,
      metadata: {
        title: "Community study",
        status: "active",
        overview: "",
        notes: "",
        limits: {},
      },
      rules: {
        setups: [
          {
            id: setupId,
            name: "Model A",
            description: "",
            rules: [{ id: ruleId, label: "Ready", detail: "" }],
          },
        ],
        filters: [],
        management: [],
        strategy,
      },
    });
    await journal.updatePlaybook(book, new Map([[image, png]]));
    const planId = crypto.randomUUID();
    await journal.updatePlan({
      action: "create",
      id: planId,
      setup: {
        title: "Plan A",
        symbol: "EURUSD",
        direction: "long",
        entryCondition: "Study",
        playbook: { id: bookId, version: 1 },
      },
    });
    const playbook = {
      id: bookId,
      version: 1,
      setupId,
      entry: [{ ruleId, met: true }],
    };
    await journal.updatePosition({
      action: "open",
      input: { ...tradeDetails, planId, playbook },
    });
    const position = (await journal.read()).positions[0];
    const url = baseUrl + JOURNAL_ROUTES.trash;
    expect(
      (
        await post(url, {
          action: "move",
          kind: TRASH_KIND.PLAN,
          key: planId,
          revision: 5,
        })
      ).status,
    ).toBe(409);
    const movedPlan = await post(url, {
      action: "move",
      kind: TRASH_KIND.PLAN,
      key: planId,
      revision: 1,
    });
    expect(movedPlan.status).toBe(200);
    const planTrash = journalSchema
      .parse(movedPlan.body)
      .trash.find(({ kind }) => kind === TRASH_KIND.PLAN)!;
    await post(url, {
      action: "move",
      kind: TRASH_KIND.PLAYBOOK,
      key: bookId,
      revision: 1,
    });
    await expect(
      journal.updatePosition({
        action: "open",
        input: { ...tradeDetails, planId, playbook },
      }),
    ).rejects.toThrow();
    await journal.updatePosition({
      action: "close",
      id: position.id,
      revision: position.revision,
      input: {
        closedAt,
        profit: 50,
        commission: 0,
        swap: 0,
        links: { planId, playbook },
      },
    });
    let state = await journal.read();
    expect(state.trades[0]).toMatchObject({
      id: position.id,
      planId,
      playbook,
    });
    expect(state.plans).toEqual([]);
    expect(state.playbooks).toEqual([]);
    const bookTrash = state.trash.find(
      ({ kind }) => kind === TRASH_KIND.PLAYBOOK,
    )!;
    expect(
      (
        await post(url, {
          action: "move",
          kind: TRASH_KIND.TRADE,
          key: position.id,
        })
      ).status,
    ).toBe(200);
    state = await journal.read();
    expect(state.trades).toEqual([]);
    const tradeTrash = state.trash.find(
      ({ kind }) => kind === TRASH_KIND.TRADE,
    )!;
    for (const entry of [tradeTrash, planTrash, bookTrash])
      expect(
        (await post(url, { action: "restore", id: entry.id })).status,
      ).toBe(200);
    state = await journal.read();
    expect(state.trash).toEqual([]);
    expect(state.trades[0].planId).toBe(planId);
    expect(state.playbooks[0].revision).toBe(2);
    expect(
      currentVersion(state.playbooks[0]).strategy?.community?.chartExamples[0]
        .screenshotIds,
    ).toEqual([image]);
    expect(Buffer.from((await journal.readScreenshot(image))!.bytes)).toEqual(
      png,
    );
  });
});

test("persists independent thoughts, watchlist reviews and missed trades and handles date collisions in trash", async () => {
  await withJournal(async (journal, baseUrl) => {
    const workspace = baseUrl + JOURNAL_ROUTES.workspace;
    const trash = baseUrl + JOURNAL_ROUTES.trash;
    const thought = {
      record: "thought",
      day: "2026-11-24",
      input: { text: "No opening setup today.", screenshotIds: [] },
    };
    expect((await post(workspace, thought)).status).toBe(200);
    const removed = await post(trash, {
      action: "move",
      kind: TRASH_KIND.THOUGHT,
      key: thought.day,
      revision: 1,
    });
    const old = journalSchema.parse(removed.body).trash[0];
    expect(
      (
        await post(workspace, {
          ...thought,
          input: { ...thought.input, text: "New thought" },
        })
      ).status,
    ).toBe(200);
    expect((await post(workspace, { ...thought, revision: 1 })).status).toBe(
      409,
    );
    expect((await post(trash, { action: "restore", id: old.id })).status).toBe(
      409,
    );
    const planId = crypto.randomUUID();
    await journal.updatePlan({
      action: "create",
      id: planId,
      setup: {
        title: "Market plan",
        symbol: "EURUSD",
        direction: "long",
        entryCondition: "Study",
      },
      review: { status: "missed", outcome: { closedAt, netR: 5, risk: 100 } },
    });
    const watch = {
      record: "watchlist",
      start: "2026-11-23",
      input: {
        outlook: "Weekly context",
        review: "",
        items: [
          {
            symbol: "EURUSD",
            narrative: "bullish",
            notes: "Track a setup",
            planIds: [planId],
            outcome: "pending",
            review: "",
            screenshotIds: [],
          },
        ],
      },
    };
    expect((await post(workspace, watch)).status).toBe(200);
    expect(
      (
        await post(workspace, {
          ...watch,
          revision: 1,
          input: {
            ...watch.input,
            review: "One missed opportunity",
            items: [{ ...watch.input.items[0], outcome: "missed" }],
          },
        })
      ).status,
    ).toBe(200);
    const miss = {
      record: "missed",
      id: crypto.randomUUID(),
      input: {
        ...tradeDetails,
        missedAt: openedAt,
        reason: "distraction",
        planId,
        outcome: { closedAt, netR: 2, risk: 25 },
        screenshotIds: [],
      },
    };
    expect((await post(workspace, miss)).status).toBe(200);
    expect(
      (await post(workspace, { ...miss, id: crypto.randomUUID() })).status,
    ).toBe(409);
    let state = await journal.read();
    expect(
      comparePlanPerformance({
        ...state,
        missedTrades: state.workspace.missedTrades,
      }).cash.missed,
    ).toBe(50);
    await journal.updateTrash({
      action: "move",
      kind: TRASH_KIND.MISSED,
      key: miss.id,
      revision: 1,
    });
    state = await journal.read();
    expect(state.workspace.missedTrades).toEqual([]);
    expect(state.workspace.watchlists[0]).toMatchObject({
      revision: 2,
      review: "One missed opportunity",
    });
    expect(state.workspace.watchlists[0].items[0].outcome).toBe("missed");
    expect(state.workspace.thoughts[0].revision).toBe(2);
    expect(state.workspace.thoughts[0].text).toBe("New thought");

    const note = workspaceCommand.parse({
      record: "learning",
      id: crypto.randomUUID(),
      input: {
        kind: "note",
        title: "Lesson",
        body: "Saved",
        completed: false,
        archived: false,
      },
    });
    await journal.updateWorkspace(note);
    if (note.record !== "learning") throw new Error("Unexpected note command");
    const noteDeleted = await post(trash, {
      action: "move",
      kind: TRASH_KIND.LEARNING,
      key: note.id,
      revision: 1,
    });
    const buried = journalSchema
      .parse(noteDeleted.body)
      .trash.find(({ kind }) => kind === TRASH_KIND.LEARNING)!;
    expect(
      (await post(trash, { action: "restore", id: buried.id })).status,
    ).toBe(200);
    expect((await journal.read()).workspace.learning[0].body).toBe("Saved");
  });
});
