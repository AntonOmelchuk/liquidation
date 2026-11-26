import { JOURNAL_ROUTES } from "@liquidation/domain/journal/constants";
import { journalSchema } from "@liquidation/domain/journal/journal";
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { journalHandler } from "../../../apps/local-server/src/http/journal-handler.ts";
import { createJournal } from "../../../apps/local-server/src/journal.ts";

test("saves preparation, cards, highlights and course notes beside legacy journal data", async () => {
  const directory = await mkdtemp(join(tmpdir(), "liquidation-workspace-"));
  const journal = createJournal(directory);
  const server = createServer(journalHandler(journal));
  try {
    await writeFile(
      join(directory, "journal.json"),
      JSON.stringify({ version: 1, trades: [] }),
    );
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const url =
      "http://127.0.0.1:" +
      (server.address() as AddressInfo).port +
      JOURNAL_ROUTES.workspace;
    const post = (data: unknown) =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    expect(
      journalSchema.parse(await (await fetch(url)).json()).workspace,
    ).toEqual({
      preparations: [],
      reports: [],
      learning: [],
      highlights: [],
      thoughts: [],
      watchlists: [],
      missedTrades: [],
    });
    const prep = {
      record: "preparation",
      kind: "week",
      start: "2026-11-23",
      input: {
        outlook: "Wait for London.",
        watch: "",
        news: "",
        study: "",
        alerts: "EURUSD 1.14",
        tasks: [
          { id: crypto.randomUUID(), text: "Check calendar", done: false },
        ],
      },
    };
    expect((await post({ ...prep, start: "2026-11-24" })).status).toBe(422);
    expect((await post(prep)).status).toBe(200);
    const concurrent = await Promise.all([
      post({ ...prep, revision: 1 }),
      post({
        ...prep,
        revision: 1,
        input: { ...prep.input, outlook: "An alternate edit" },
      }),
    ]);
    expect(concurrent.map(({ status }) => status).sort()).toEqual([200, 409]);

    const {
      positions: [position],
    } = await journal.updatePosition({
      action: "open",
      input: {
        symbol: "EURUSD",
        openedAt: "2026-11-23T08:00:00Z",
        direction: "long",
        notes: "",
        risk: 10,
      },
    });
    const report = {
      record: "report",
      kind: "week",
      start: "2026-11-23",
      input: {
        grade: "A",
        quality: "B",
        progress: 8,
        focus: "",
        process: "",
        learned: "",
        errors: "",
        best: "Good entry",
        overview: "",
        missed: "",
        lesson: "",
        next: "",
        bestTradeId: position.id,
        assessments: [{ id: position.id, grade: "A", note: "Waited." }],
      },
    };
    expect(
      (
        await post({
          ...report,
          input: { ...report.input, bestTradeId: crypto.randomUUID() },
        })
      ).status,
    ).toBe(422);
    expect((await post(report)).status).toBe(200);
    await journal.updatePosition({
      action: "close",
      id: position.id,
      revision: position.revision,
      input: {
        closedAt: "2026-12-02T12:00:00Z",
        profit: 12.2,
        commission: -0.1,
        swap: 0,
      },
    });
    expect(
      (
        await post({
          record: "highlight",
          id: position.id,
          input: { featured: true, note: "Good entry" },
        })
      ).status,
    ).toBe(200);
    const course = {
      record: "learning",
      id: crypto.randomUUID(),
      input: {
        title: "Risk review",
        kind: "lesson",
        completed: false,
        link: "https://example.com/course",
        body: "My course notes.",
      },
    };
    expect(
      (
        await post({
          ...course,
          input: { ...course.input, link: "javascript:alert(1)" },
        })
      ).status,
    ).toBe(422);
    expect((await post(course)).status).toBe(200);
    expect(
      (
        await post({
          ...course,
          revision: 1,
          input: { ...course.input, archived: true, completed: true },
        })
      ).status,
    ).toBe(200);
    const snapshot = await createJournal(directory).read();
    expect(snapshot.workspace.preparations[0]).toMatchObject({
      revision: 2,
      start: prep.start,
    });
    expect(snapshot.workspace.reports[0]).toMatchObject({
      revision: 1,
      ...report.input,
    });
    expect(snapshot.workspace.highlights[0]).toMatchObject({
      id: position.id,
      featured: true,
    });
    expect(snapshot.workspace.learning[0]).toMatchObject({
      ...course.input,
      completed: true,
    });
    expect(snapshot.workspace.learning[0]).not.toHaveProperty("archived");
    expect(snapshot.positions).toEqual([]);
    expect(snapshot.trades[0].id).toBe(position.id);
  } finally {
    if (server.listening)
      await new Promise<void>((resolve) => server.close(() => resolve()));
    await rm(directory, { recursive: true, force: true });
  }
});
