import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { journalHandler } from "./journal.ts";

const root = resolve("dist");
const handleJournal = journalHandler();
const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

createServer(async (request, response) => {
  const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  if (pathname === "/api/trades") {
    await handleJournal(request, response);
    return;
  }
  const path = resolve(
    root,
    "." + (pathname === "/" ? "/index.html" : pathname),
  );
  const contentType = types[extname(path)];
  if (
    !path.startsWith(root + sep) ||
    !contentType ||
    !(await stat(path).catch(() => null))?.isFile()
  ) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, {
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
  });
  createReadStream(path)
    .on("error", () => response.destroy())
    .pipe(response);
}).listen(4173, "127.0.0.1", () =>
  console.log("Liquidation is running at http://127.0.0.1:4173"),
);
