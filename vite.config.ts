import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { journalHandler } from "./apps/local-server/journal.ts";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "liquidation-local-journal",
      configureServer(server) {
        const handleJournal = journalHandler();
        server.middlewares.use((request, response, next) => {
          if (request.url === "/api/trades") {
            void handleJournal(request, response);
          } else {
            next();
          }
        });
      },
    },
  ],
});
