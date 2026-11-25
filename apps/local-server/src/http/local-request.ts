import type { IncomingMessage } from "node:http";
import { CROSS_SITE, SEC_FETCH_SITE } from "../constants.ts";

export function isLocalRequest({ headers }: IncomingMessage) {
  const host = headers.host ?? "";
  return (
    /^127\.0\.0\.1:\d+$/.test(host) &&
    (!headers.origin || headers.origin === `http://${host}`) &&
    headers[SEC_FETCH_SITE] !== CROSS_SITE
  );
}
