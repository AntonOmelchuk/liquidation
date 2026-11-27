import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { localApiHandler } from "./apps/local-server/src/http/local-api.ts";

export default defineConfig({
  root: fileURLToPath(new URL("./apps/web/", import.meta.url)),
  build: {
    outDir: fileURLToPath(new URL("./dist/", import.meta.url)),
    emptyOutDir: true,
  },
  plugins: [
    react(),
    {
      name: "liquidation-local-api",
      configureServer(server) {
        const { handle: handleApi, start } = localApiHandler();
        const httpServer = server.httpServer;
        httpServer?.once("listening", () => httpServer.once("close", start()));
        server.middlewares.use((request, response, next) => {
          if (!handleApi(request, response)) next();
        });
      },
    },
  ],
});
