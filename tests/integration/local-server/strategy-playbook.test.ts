import { emptyPlaybookStrategy } from "@liquidation/domain/playbooks/strategy";
import type { PlaybookCommand } from "@liquidation/domain/playbooks/types";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { createJournal } from "../../../apps/local-server/src/journal.ts";

test("saves editable strategy examples without changing the standard template", async () => {
  const directory = await mkdtemp(join(tmpdir(), "liquidation-strategy-"));
  try {
    const journal = createJournal(directory);
    const create: PlaybookCommand = {
      action: "create",
      id: crypto.randomUUID(),
      metadata: {
        title: "London",
        status: "experiment",
        overview: "",
        notes: "",
        limits: {},
      },
      rules: {
        setups: [
          { id: crypto.randomUUID(), name: "", description: "", rules: [] },
        ],
        filters: [],
        management: [],
      },
    };
    await journal.updatePlaybook(create);
    const shot = crypto.randomUUID();
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a/1kAAAAASUVORK5CYII=",
      "base64",
    );
    const strategy = {
      ...emptyPlaybookStrategy(),
      symbols: ["EURUSD"],
      examples: [
        {
          id: crypto.randomUUID(),
          label: "Move stop",
          detail: "Confirm structure.",
          screenshotIds: [shot],
        },
      ],
    };
    const backtest: PlaybookCommand = {
      ...create,
      id: crypto.randomUUID(),
      rules: { ...create.rules, strategy },
    };
    await expect(journal.updatePlaybook(backtest)).rejects.toThrow(
      "A referenced screenshot is missing",
    );
    await journal.updatePlaybook(backtest, new Map([[shot, png]]));
    expect((await journal.updatePlaybook(backtest)).playbooks[0].revision).toBe(
      1,
    );
    await expect(
      journal.updatePlaybook({
        ...backtest,
        action: "edit",
        revision: 1,
        rules: create.rules,
      }),
    ).rejects.toThrow("The playbook template cannot be changed.");
    await journal.updatePlaybook({
      ...backtest,
      action: "edit",
      revision: 1,
      rules: { ...backtest.rules, strategy: { ...strategy, examples: [] } },
    });
    const reopened = await createJournal(directory).read();
    const edited = reopened.playbooks.find(({ id }) => id === backtest.id)!;
    expect(edited.rules.strategy?.examples).toEqual([]);
    expect(edited.legacyVersions).toBeUndefined();
    expect(
      reopened.playbooks.find(({ id }) => id === create.id)?.rules.strategy,
    ).toBeUndefined();
    expect(await journal.readScreenshot(shot)).toBeNull();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("keeps setup examples attached to the editable playbook and purges them after deletion", async () => {
  const directory = await mkdtemp(
    join(tmpdir(), "liquidation-playbook-images-"),
  );
  try {
    const journal = createJournal(directory);
    const overviewId = crypto.randomUUID();
    const setupId = crypto.randomUUID();
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a/1kAAAAASUVORK5CYII=",
      "base64",
    );
    const create: PlaybookCommand = {
      action: "create",
      id: crypto.randomUUID(),
      metadata: {
        title: "Setup examples",
        status: "active",
        overview: "",
        notes: "",
        limits: {},
      },
      rules: {
        setups: [
          {
            id: crypto.randomUUID(),
            name: "London sweep",
            description: "Example",
            rules: [],
            screenshotIds: [setupId],
          },
        ],
        filters: [],
        management: [],
        screenshotIds: [overviewId],
      },
    };
    await expect(journal.updatePlaybook(create)).rejects.toThrow(
      "A referenced screenshot is missing",
    );
    await journal.updatePlaybook(
      create,
      new Map([
        [overviewId, png],
        [setupId, png],
      ]),
    );
    const updated = await journal.updatePlaybook({
      ...create,
      action: "edit",
      revision: 1,
      rules: {
        ...create.rules,
        setups: create.rules.setups.map((setup) => ({
          ...setup,
          name: "Reclaim",
        })),
      },
    });
    expect(updated.playbooks[0].rules.setups[0].name).toBe("Reclaim");
    expect(updated.playbooks[0].rules.setups[0].screenshotIds).toEqual([
      setupId,
    ]);
    expect(updated.playbooks[0].rules.screenshotIds).toEqual([overviewId]);
    expect((await journal.readScreenshot(setupId))?.bytes).toEqual(png);
    await journal.updateTrash({
      action: "move",
      kind: "playbook",
      key: create.id,
      revision: 2,
    });
    const entry = (await journal.read()).trash[0];
    await journal.updateTrash({ action: "purge", id: entry.id });
    expect(await journal.readScreenshot(setupId)).toBeNull();
    expect(await journal.readScreenshot(overviewId)).toBeNull();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
