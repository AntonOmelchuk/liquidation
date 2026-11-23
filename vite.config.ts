import { isJournalRoute } from "@liquidation/domain/journal/journal";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { journalHandler } from "./apps/local-server/src/http/journal-handler.ts";

export default defineConfig({
  root: fileURLToPath(new URL("./apps/web/", import.meta.url)),
  build: {
    outDir: fileURLToPath(new URL("./dist/", import.meta.url)),
    emptyOutDir: true,
  },
  plugins: [
    react(),
    {
      name: "liquidation-local-journal",
      configureServer(server) {
        const handleJournal = journalHandler();
        server.middlewares.use((request, response, next) => {
          if (isJournalRoute(request.url?.split("?", 1)[0])) {
            void handleJournal(request, response);
          } else {
            next();
          }
        });
      },
    },
  ],
});
