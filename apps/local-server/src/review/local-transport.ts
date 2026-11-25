import { request } from "node:http";
import {
  HTTP_METHOD,
  HTTP_STATUS,
  MEDIA_TYPE,
} from "@liquidation/domain/journal/constants";
import { LOCAL_HOST } from "../constants.ts";
import {
  REVIEW_MODEL_PATH,
  REVIEW_MODEL_PORT,
  REVIEW_MODEL_RESPONSE_LIMIT,
} from "./constants.ts";
import type { ReviewCompletionRequest } from "./types.ts";

export function localCompletion(
  port = REVIEW_MODEL_PORT,
): ReviewCompletionRequest {
  return (body, signal) =>
    new Promise((resolve, reject) => {
      const outgoing = request(
        {
          hostname: LOCAL_HOST,
          port,
          path: REVIEW_MODEL_PATH,
          method: HTTP_METHOD.POST,
          // A direct one-use connection keeps journal aggregates off shared proxies.
          agent: false,
          signal,
          headers: {
            "Content-Type": MEDIA_TYPE.JSON,
            "Content-Length": Buffer.byteLength(body),
          },
        },
        (incoming) => {
          if (incoming.statusCode !== HTTP_STATUS.OK) {
            incoming.destroy();
            reject(new Error("The local model is unavailable."));
            return;
          }

          const chunks: Buffer[] = [];
          let bytes = 0;
          incoming.on("data", (chunk: Buffer) => {
            bytes += chunk.length;
            if (bytes > REVIEW_MODEL_RESPONSE_LIMIT) {
              incoming.destroy(
                new Error("The local model response is too large."),
              );
              return;
            }
            chunks.push(chunk);
          });
          incoming.once("error", reject);
          incoming.once("end", () => {
            try {
              resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
            } catch {
              resolve(null);
            }
          });
        },
      );
      outgoing.once("error", reject);
      outgoing.end(body);
    });
}
