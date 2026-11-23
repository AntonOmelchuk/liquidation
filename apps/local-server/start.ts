import { HTTP_STATUS } from "@liquidation/domain/journal/constants";
import { isJournalRoute } from "@liquidation/domain/journal/journal";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import {
  INDEX_DOCUMENT,
  LOCAL_HOST,
  LOCAL_PORT,
  ROOT_PATH,
} from "./src/constants.ts";
import { journalHandler } from "./src/http/journal-handler.ts";

const root = resolve("dist");
const handleJournal = journalHandler();
const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

createServer(async (request, response) => {
  const pathname = new URL(request.url ?? ROOT_PATH, "http://127.0.0.1")
    .pathname;
  if (isJournalRoute(pathname)) {
    await handleJournal(request, response);
    return;
  }
  const path = resolve(
    root,
    "." + (pathname === ROOT_PATH ? INDEX_DOCUMENT : pathname),
  );
  const contentType = types[extname(path)];
  if (
    !path.startsWith(root + sep) ||
    !contentType ||
    !(await stat(path).catch(() => null))?.isFile()
  ) {
    response.writeHead(HTTP_STATUS.NOT_FOUND).end();
    return;
  }
  response.writeHead(HTTP_STATUS.OK, {
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
  });
  createReadStream(path)
    .on("error", () => response.destroy())
    .pipe(response);
}).listen(LOCAL_PORT, LOCAL_HOST, () =>
  console.log("Liquidation is running at http://127.0.0.1:4173"),
);
