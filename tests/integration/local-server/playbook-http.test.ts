import { JOURNAL_ROUTES } from "@liquidation/domain/journal/constants";
import { journalSchema } from "@liquidation/domain/journal/journal";
import type { PlaybookCommand } from "@liquidation/domain/playbooks/types";
import type { Trade } from "@liquidation/domain/trades/types";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";

import {
  adherence,
  playbookResults,
  playbookReviewProgress,
  ruleOutcomes,
} from "@liquidation/domain/playbooks/playbook-performance";

import { journalHandler } from "../../../apps/local-server/src/http/journal-handler.ts";
import { createJournal } from "../../../apps/local-server/src/journal.ts";

test("retains the trade checklists after editing the playbook, closing and reloading", async () => {
  const directory = await mkdtemp(join(tmpdir(), "liquidation-playbooks-"));
  const server = createServer(journalHandler(createJournal(directory)));
  try {
    await writeFile(
      join(directory, "journal.json"),
      JSON.stringify({ version: 1, trades: [] }),
    );
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

    function post(path: string, data: unknown) {
      return fetch(origin + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }

    const planId = randomUUID();
    const id = randomUUID();
    const setupId = randomUUID();
    const entryId = randomUUID();
    const filterId = randomUUID();
    const managementId = randomUUID();
    const plan = {
      title: "EURUSD plan",
      symbol: "EURUSD",
      direction: "long",
      entryCondition: "Wait for confirmation.",
    };
    expect(
      (
        await post(JOURNAL_ROUTES.plans, {
          action: "create",
          id: planId,
          setup: plan,
        })
      ).status,
    ).toBe(200);
    const create: PlaybookCommand = {
      action: "create",
      id,
      metadata: {
        title: "London reversal",
        status: "active",
        overview: "",
        notes: "",
        limits: {},
        reviewEvery: 1,
      },
      rules: {
        setups: [
          {
            id: setupId,
            name: "Sweep",
            description: "",
            rules: [
              {
                id: entryId,
                label: "Liquidity swept",
                detail: "Sweep the Asian range.",
              },
            ],
          },
        ],
        filters: [{ id: filterId, label: "Session", detail: "" }],
        management: [{ id: managementId, label: "Original stop", detail: "" }],
      },
    };
    expect((await post(JOURNAL_ROUTES.playbooks, create)).status).toBe(200);
    const open = {
      action: "open",
      input: {
        symbol: "EURUSD",
        direction: "long",
        openedAt: "2026-11-20T10:00:00Z",
        risk: 20,
        notes: "Original note",
        planId,
        playbook: {
          id,
          setupId,
          entry: [
            { ruleId: entryId, met: true },
            { ruleId: filterId, met: false, reason: "Early entry" },
          ],
        },
      },
    };
    const unexplained = await post(JOURNAL_ROUTES.positions, {
      ...open,
      input: {
        ...open.input,
        playbook: {
          ...open.input.playbook,
          entry: [
            { ruleId: entryId, met: true },
            { ruleId: filterId, met: false },
          ],
        },
      },
    });
    expect(unexplained.status).toBe(422);
    await unexplained.text();
    const foreignCheck = await post(JOURNAL_ROUTES.positions, {
      ...open,
      input: {
        ...open.input,
        playbook: {
          ...open.input.playbook,
          entry: [
            { ruleId: entryId, met: true },
            { ruleId: entryId, met: true },
          ],
        },
      },
    });
    expect(foreignCheck.status).toBe(422);
    await foreignCheck.text();
    const opened = journalSchema.parse(
      await (await post(JOURNAL_ROUTES.positions, open)).json(),
    ).positions[0];
    expect(opened.playbook).toMatchObject({
      ...open.input.playbook,
      recordedRules: {
        setupName: "Sweep",
        management: create.rules.management,
      },
    });

    const edit: PlaybookCommand = {
      action: "edit",
      id,
      revision: 1,
      metadata: { ...create.metadata, status: "retired" },
      rules: {
        ...create.rules,
        management: [{ id: randomUUID(), label: "New exit rule", detail: "" }],
      },
    };
    expect((await post(JOURNAL_ROUTES.playbooks, edit)).status).toBe(200);
    expect((await post(JOURNAL_ROUTES.positions, open)).status).toBe(422);

    const outcome = {
      closedAt: "2026-11-20T11:00:00Z",
      profit: 43,
      commission: -2,
      swap: -1,
    };
    const close = {
      action: "close",
      id: opened.id,
      revision: opened.revision,
      input: { ...outcome, management: [{ ruleId: managementId, met: true }] },
    };
    expect(
      (
        await post(JOURNAL_ROUTES.positions, {
          ...close,
          input: {
            ...close.input,
            management: [{ ruleId: edit.rules.management[0].id, met: true }],
          },
        })
      ).status,
    ).toBe(422);
    expect((await post(JOURNAL_ROUTES.positions, close)).status).toBe(200);

    const saved = await createJournal(directory).read();
    const [closed] = saved.trades;
    const [book] = saved.playbooks;
    expect(saved.positions).toEqual([]);
    expect(closed).toMatchObject({
      id: opened.id,
      planId,
      playbook: { ...open.input.playbook, management: close.input.management },
      ...outcome,
    });
    expect(book.rules.management[0].label).toBe("New exit rule");
    expect(book).not.toHaveProperty("versions");
    expect(book.legacyVersions).toBeUndefined();
    expect(closed.playbook?.recordedRules?.management[0].label).toBe(
      "Original stop",
    );
    expect(closed.playbook?.version).toBeUndefined();
    expect(playbookResults(saved.trades)).toEqual({
      count: 1,
      net: 40,
      winRate: 1,
      totalR: 2,
      riskMissing: 0,
    });
    expect(adherence(saved.trades, "entry")).toEqual({ count: 1, rate: 0 });
    expect(adherence(saved.trades, "management")).toEqual({
      count: 1,
      rate: 1,
    });
    expect(ruleOutcomes(book, saved.trades).rows[0].misses[0].reason).toBe(
      "Early entry",
    );
    expect(ruleOutcomes(book, saved.trades).assessed).toBe(1);
    expect(playbookReviewProgress(book, 1)?.due).toBe(1);

    const screenshotId = randomUUID();
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a/1kAAAAASUVORK5CYII=",
      "base64",
    );
    const upload = new FormData();
    upload.set(
      "command",
      JSON.stringify({
        action: "add-review",
        id,
        revision: 2,
        reviewId: randomUUID(),
        note: { text: "Wait for session open.", screenshotIds: [screenshotId] },
      }),
    );
    upload.set(
      `shot:${screenshotId}`,
      new Blob([png], { type: "image/png" }),
      "review.png",
    );
    const added = journalSchema.parse(
      await (
        await fetch(origin + JOURNAL_ROUTES.playbooks, {
          method: "POST",
          body: upload,
        })
      ).json(),
    ).playbooks[0];
    expect(added.reviews[0].text).toBe("Wait for session open.");
    expect(playbookReviewProgress(added, 1)?.due).toBe(0);
    expect(
      Buffer.from(
        await (
          await fetch(origin + JOURNAL_ROUTES.planScreenshot + screenshotId)
        ).arrayBuffer(),
      ),
    ).toEqual(png);
  } finally {
    if (server.listening)
      await new Promise<void>((resolve) => server.close(() => resolve()));
    await rm(directory, { recursive: true, force: true });
  }
});

test("links historical trades without ratings, rejects conflicting edits and leaves the result unchanged", async () => {
  const directory = await mkdtemp(
    join(tmpdir(), "liquidation-historical-links-"),
  );
  try {
    const journal = createJournal(directory);
    const id = randomUUID();
    const record: Omit<Trade, "id"> = {
      symbol: "XAUUSD",
      direction: "short",
      openedAt: "2026-11-20T08:00:00Z",
      closedAt: "2026-11-20T08:30:00Z",
      profit: 19.2,
      commission: -2.6,
      swap: 0,
      risk: null,
      notes: "Historical trade",
    };
    const trade = await journal.append(record);
    const command: PlaybookCommand = {
      action: "create",
      id,
      metadata: {
        title: "Sweep",
        status: "experiment",
        overview: "",
        notes: "",
        limits: {},
      },
      rules: {
        setups: [{ id: randomUUID(), name: "", description: "", rules: [] }],
        filters: [],
        management: [],
      },
    };
    await journal.updatePlaybook(command);
    const next = { playbook: { id } };
    const update = { id: trade.id, previous: {}, next };
    const linked = await journal.updateTradeLinks(update);
    expect(linked.trades[0].playbook).toMatchObject({ id });
    expect(adherence(linked.trades, "entry")).toEqual({ count: 0, rate: null });
    expect(await journal.updateTradeLinks(update)).toEqual(linked);
    await expect(
      journal.updateTradeLinks({
        ...update,
        next: { playbook: { id }, limitEntryTest: true },
      }),
    ).rejects.toThrow("Trade links have changed.");
    await journal.updateTradeLinks({
      ...update,
      previous: { playbook: linked.trades[0].playbook },
      next: {},
    });
    expect((await createJournal(directory).read()).trades).toEqual([trade]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
