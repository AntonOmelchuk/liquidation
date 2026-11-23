import { backtestCommand } from "@liquidation/domain/backtests/backtest";
import {
  HTTP_METHOD,
  HTTP_STATUS,
  JOURNAL_ROUTES,
  MEDIA_TYPE,
} from "@liquidation/domain/journal/constants";
import { isJournalRoute } from "@liquidation/domain/journal/journal";
import { planCommand } from "@liquidation/domain/plans/plan";
import { playbookCommand } from "@liquidation/domain/playbooks/playbook";
import { positionCommand } from "@liquidation/domain/trades/position";
import { tradeInput } from "@liquidation/domain/trades/trade";
import { tradeLinkCommand } from "@liquidation/domain/trades/trade-links";
import type { IncomingMessage, ServerResponse } from "node:http";
import { CROSS_SITE, SEC_FETCH_SITE } from "../constants.ts";
import {
  InvalidJournalInput,
  JournalConflict,
  RequestError,
} from "../errors.ts";
import { createJournal } from "../journal.ts";
import { readJournalBody } from "./request-body.ts";

export function journalHandler(journal = createJournal()) {
  return async (request: IncomingMessage, response: ServerResponse) => {
    function send(status: number, data: unknown) {
      response.writeHead(status, {
        "Content-Type": MEDIA_TYPE.JSON,
        "Cache-Control": "no-store",
      });
      response.end(JSON.stringify(data));
    }

    const host = request.headers.host ?? "";
    const origin = request.headers.origin;
    if (
      !/^127\.0\.0\.1:\d+$/.test(host) ||
      (origin && origin !== `http://${host}`) ||
      request.headers[SEC_FETCH_SITE] === CROSS_SITE
    ) {
      send(HTTP_STATUS.FORBIDDEN, { error: "Request origin is not allowed." });
      return;
    }
    try {
      const route = request.url?.split("?", 1)[0];
      if (!isJournalRoute(route)) {
        send(HTTP_STATUS.NOT_FOUND, { error: "Unknown journal route." });
        return;
      }
      if (route?.startsWith(JOURNAL_ROUTES.planScreenshot)) {
        if (request.method !== HTTP_METHOD.GET)
          throw new RequestError(
            HTTP_STATUS.METHOD_NOT_ALLOWED,
            "Method not allowed.",
          );
        const screenshot = await journal.readScreenshot(
          route.slice(JOURNAL_ROUTES.planScreenshot.length),
        );
        if (!screenshot)
          throw new RequestError(
            HTTP_STATUS.NOT_FOUND,
            "Screenshot not found.",
          );
        response.writeHead(HTTP_STATUS.OK, {
          "Content-Type": screenshot.type,
          "Content-Length": screenshot.bytes.length,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "default-src 'none'",
        });
        response.end(screenshot.bytes);
        return;
      }
      if (request.method === HTTP_METHOD.GET) {
        const snapshot = await journal.read();
        send(
          HTTP_STATUS.OK,
          route === JOURNAL_ROUTES.trades ? snapshot.trades : snapshot,
        );
        return;
      }
      if (request.method !== HTTP_METHOD.POST) {
        send(HTTP_STATUS.METHOD_NOT_ALLOWED, { error: "Method not allowed." });
        return;
      }
      const { input, uploads } = await readJournalBody(
        request,
        route === JOURNAL_ROUTES.plans ||
          route === JOURNAL_ROUTES.playbooks ||
          route === JOURNAL_ROUTES.backtests,
      );
      if (route === JOURNAL_ROUTES.plans) {
        const command = planCommand.safeParse(input);
        if (!command.success) {
          send(HTTP_STATUS.UNPROCESSABLE_CONTENT, { error: "Invalid plan." });
          return;
        }
        send(HTTP_STATUS.OK, await journal.updatePlan(command.data, uploads));
        return;
      }
      if (route === JOURNAL_ROUTES.playbooks) {
        const command = playbookCommand.safeParse(input);
        if (!command.success)
          throw new InvalidJournalInput("Invalid playbook.");
        send(
          HTTP_STATUS.OK,
          await journal.updatePlaybook(command.data, uploads),
        );
        return;
      }
      if (route === JOURNAL_ROUTES.backtests) {
        const command = backtestCommand.safeParse(input);
        if (!command.success)
          throw new InvalidJournalInput("Invalid backtest.");
        send(
          HTTP_STATUS.OK,
          await journal.updateBacktest(command.data, uploads),
        );
        return;
      }
      if (route === JOURNAL_ROUTES.tradeLinks) {
        const command = tradeLinkCommand.safeParse(input);
        if (!command.success)
          throw new InvalidJournalInput("Invalid trade links.");
        send(HTTP_STATUS.OK, await journal.updateTradeLinks(command.data));
        return;
      }
      if (route === JOURNAL_ROUTES.positions) {
        const command = positionCommand.safeParse(input);
        if (!command.success) {
          send(HTTP_STATUS.UNPROCESSABLE_CONTENT, {
            error: "Invalid position.",
          });
          return;
        }
        send(HTTP_STATUS.OK, await journal.updatePosition(command.data));
        return;
      }
      const result = tradeInput.safeParse(input);
      if (!result.success) {
        send(HTTP_STATUS.UNPROCESSABLE_CONTENT, { error: "Invalid trade." });
        return;
      }
      send(HTTP_STATUS.CREATED, await journal.append(result.data));
    } catch (error) {
      if (error instanceof RequestError) {
        send(error.status, { error: error.message });
        return;
      }
      if (error instanceof JournalConflict) {
        send(HTTP_STATUS.CONFLICT, { error: error.message });
        return;
      }
      if (error instanceof InvalidJournalInput) {
        send(HTTP_STATUS.UNPROCESSABLE_CONTENT, { error: error.message });
        return;
      }
      send(HTTP_STATUS.INTERNAL_SERVER_ERROR, {
        error: "Could not access the local journal.",
      });
    }
  };
}
