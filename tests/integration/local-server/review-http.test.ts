import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { JOURNAL_ROUTES } from "@liquidation/domain/journal/constants";
import { REVIEW_MODEL_STATUS } from "@liquidation/domain/review/constants";
import { journalHandler } from "../../../apps/local-server/src/http/journal-handler.ts";
import { createJournal } from "../../../apps/local-server/src/journal.ts";
import { createLocalReview } from "../../../apps/local-server/src/review/local-model.ts";
import { localCompletion } from "../../../apps/local-server/src/review/local-transport.ts";

const query = {
  from: "2026-11-01",
  through: "2026-11-23",
  timeZone: "Europe/Kyiv",
};

test("the review route sends derived facts to the loopback provider and validates its response", async () => {
  const directory = await mkdtemp(join(tmpdir(), "liquidation-ai-review-"));
  const payloads: { path: string | undefined; body: string }[] = [];
  let mode = "valid";
  const model = createServer(async (request, response) => {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(chunk);
    payloads.push({
      path: request.url,
      body: Buffer.concat(chunks).toString("utf8"),
    });
    if (mode === "redirect") {
      response.writeHead(307, { Location: "/unexpected" }).end();
      return;
    }
    if (mode === "oversize") {
      response.writeHead(200).end("x".repeat(70_000));
      return;
    }
    const content = JSON.stringify({
      insights: [
        {
          evidenceId: mode === "unknown" ? "F99" : "F1",
          hypothesis:
            "Чи повторюється ця закономірність у наступних спостереженнях?",
        },
      ],
    });
    response
      .writeHead(200, { "Content-Type": "application/json" })
      .end(JSON.stringify({ choices: [{ message: { content } }] }));
  });
  model.listen(0, "127.0.0.1");
  await once(model, "listening");
  const journal = createJournal(directory);
  const server = createServer(
    journalHandler(
      journal,
      createLocalReview(
        true,
        localCompletion((model.address() as AddressInfo).port),
      ),
    ),
  );
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const path = `http://127.0.0.1:${(server.address() as AddressInfo).port}${JOURNAL_ROUTES.aiReview}`;
    const review = (body: unknown, headers?: Record<string, string>) =>
      fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(body),
      });

    expect((await fetch(path)).status).toBe(405);
    expect(await (await review(query)).json()).toEqual({
      status: REVIEW_MODEL_STATUS.EMPTY,
    });
    expect(payloads).toHaveLength(0);
    await journal.append({
      symbol: "XAUUSD",
      direction: "long",
      openedAt: "2026-11-20T09:00:00Z",
      closedAt: "2026-11-20T11:00:00Z",
      profit: 115,
      swap: -3,
      commission: -2,
      risk: 40,
      notes: "Private chart note",
      account: "Private account label",
    });
    expect((await review({ ...query, prompt: "free text" })).status).toBe(422);
    expect((await review({ ...query, timeZone: "unknown" })).status).toBe(422);
    expect(
      (await review(query, { Origin: "https://unrelated.example" })).status,
    ).toBe(403);
    expect(payloads).toHaveLength(0);

    const complete = await review(query);
    expect(complete.status).toBe(200);
    expect(await complete.json()).toMatchObject({
      status: REVIEW_MODEL_STATUS.READY,
      insights: [{ evidenceId: "F1" }],
    });
    expect(payloads[0].path).toBe("/v1/chat/completions");
    const { messages, response_format } = JSON.parse(payloads[0].body);
    expect(response_format.type).toBe("json_object");
    expect(JSON.parse(messages[1].content).facts[0]).toMatchObject({
      id: "F1",
      net: 110,
      count: 1,
    });
    expect(payloads[0].body).not.toMatch(/Private|XAUUSD|2026-11-20/);

    mode = "unknown";
    expect(await (await review(query)).json()).toEqual({
      status: REVIEW_MODEL_STATUS.INVALID,
    });
    mode = "redirect";
    expect(await (await review(query)).json()).toEqual({
      status: REVIEW_MODEL_STATUS.UNAVAILABLE,
    });
    expect(payloads).toHaveLength(3);
    mode = "oversize";
    expect(await (await review(query)).json()).toEqual({
      status: REVIEW_MODEL_STATUS.UNAVAILABLE,
    });
    expect(payloads).toHaveLength(4);
    expect((await journal.read()).trades).toHaveLength(1);
  } finally {
    await Promise.all([
      new Promise<void>((resolve) => server.close(() => resolve())),
      new Promise<void>((resolve) => model.close(() => resolve())),
    ]);
    await rm(directory, { recursive: true, force: true });
  }
});
