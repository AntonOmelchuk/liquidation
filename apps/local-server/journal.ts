import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { tradeInput, tradeSchema } from "../../packages/domain/trade.ts";

const journalSchema = z.object({
  version: z.literal(1),
  trades: z.array(tradeSchema),
});

export function createJournal(
  directory = process.env.LIQUIDATION_DATA_DIR ||
    join(homedir(), ".liquidation"),
) {
  const path = join(directory, "journal.json");
  let pending: Promise<unknown> = Promise.resolve();

  async function read() {
    try {
      return journalSchema.parse(JSON.parse(await readFile(path, "utf8")));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      return journalSchema.parse({ version: 1, trades: [] });
    }
  }

  function append(input: z.infer<typeof tradeInput>) {
    const operation = pending.then(async () => {
      const journal = await read();
      const trade = { ...input, id: randomUUID() };
      journal.trades.unshift(trade);
      await mkdir(directory, { recursive: true, mode: 0o700 });
      const temporary = join(directory, `.journal-${trade.id}.tmp`);
      try {
        await writeFile(temporary, JSON.stringify(journal, null, 2), {
          flag: "wx",
          mode: 0o600,
          flush: true,
        });
        await rename(temporary, path);
      } finally {
        await rm(temporary, { force: true });
      }
      return trade;
    });
    pending = operation.catch(() => undefined);
    return operation;
  }

  return { read, append };
}

export function journalHandler(journal = createJournal()) {
  return async (request: IncomingMessage, response: ServerResponse) => {
    function send(status: number, data: unknown) {
      response.writeHead(status, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      });
      response.end(JSON.stringify(data));
    }

    const host = request.headers.host ?? "";
    const origin = request.headers.origin;
    if (
      !/^127\.0\.0\.1:\d+$/.test(host) ||
      (origin && origin !== `http://${host}`) ||
      request.headers["sec-fetch-site"] === "cross-site"
    ) {
      send(403, { error: "Request origin is not allowed." });
      return;
    }
    try {
      if (request.method === "GET") {
        send(200, (await journal.read()).trades);
        return;
      }
      if (request.method !== "POST") {
        send(405, { error: "Method not allowed." });
        return;
      }
      if (request.headers["content-type"] !== "application/json") {
        send(415, { error: "Expected JSON." });
        return;
      }
      let body = "";
      for await (const chunk of request) {
        body += chunk.toString();
        if (body.length > 32768) {
          send(413, { error: "Trade exceeds the request limit." });
          return;
        }
      }
      let input: unknown;
      try {
        input = JSON.parse(body);
      } catch {
        send(400, { error: "Invalid JSON." });
        return;
      }
      const result = tradeInput.safeParse(input);
      if (!result.success) {
        send(422, { error: "Invalid trade." });
        return;
      }
      send(201, await journal.append(result.data));
    } catch {
      send(500, { error: "Could not access the local journal." });
    }
  };
}
