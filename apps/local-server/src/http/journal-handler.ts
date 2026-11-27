import { backtestCommand } from "@liquidation/domain/backtests/backtest";
import { accountCommandSchema } from "@liquidation/domain/accounts/account";
import { isBackupRoute } from "@liquidation/domain/backup/constants";
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
import { buildReview } from "@liquidation/domain/review/report";
import { reviewQuerySchema } from "@liquidation/domain/review/schemas";
import { tradeRecordInput } from "@liquidation/domain/trades/trade";
import { tradeLinkCommand } from "@liquidation/domain/trades/trade-links";
import { workspaceCommand } from "@liquidation/domain/workspace/workspace";
import { trashCommandSchema } from "@liquidation/domain/journal/trash/trash";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  InvalidJournalInput,
  JournalConflict,
  RequestError,
} from "../errors.ts";
import { createJournal } from "../journal.ts";
import { createLocalReview } from "../review/local-model.ts";
import type { ReviewSummarizer } from "../review/types.ts";
import { isLocalRequest } from "./local-request.ts";
import { readJournalBody } from "./request-body.ts";
import { handleBackupRequest } from "./backup-handler.ts";

export function journalHandler(
  journal = createJournal(),
  summarizeReview: ReviewSummarizer = createLocalReview(),
) {
  return async (request: IncomingMessage, response: ServerResponse) => {
    function send(status: number, data: unknown) {
      if (response.destroyed || response.headersSent) return;
      response.writeHead(status, {
        "Content-Type": MEDIA_TYPE.JSON,
        "Cache-Control": "no-store",
      });
      response.end(JSON.stringify(data));
    }

    if (!isLocalRequest(request)) {
      send(HTTP_STATUS.FORBIDDEN, { error: "Request origin is not allowed." });
      return;
    }
    try {
      const route = request.url?.split("?", 1)[0];
      if (!isJournalRoute(route)) {
        send(HTTP_STATUS.NOT_FOUND, { error: "Unknown journal route." });
        return;
      }
      if (route && isBackupRoute(route)) {
        await handleBackupRequest(
          journal.backup,
          route,
          request,
          response,
          send,
        );
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
      if (route === JOURNAL_ROUTES.aiReview) {
        if (request.method !== HTTP_METHOD.POST) {
          send(HTTP_STATUS.METHOD_NOT_ALLOWED, {
            error: "Method not allowed.",
          });
          return;
        }
        const { input } = await readJournalBody(request, false);
        const query = reviewQuerySchema.safeParse(input);
        if (!query.success) {
          send(HTTP_STATUS.UNPROCESSABLE_CONTENT, {
            error: "Invalid review period.",
          });
          return;
        }
        const controller = new AbortController();
        response.once("close", () => controller.abort());
        const report = buildReview(await journal.read(), query.data);
        send(HTTP_STATUS.OK, await summarizeReview(report, controller.signal));
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
          route === JOURNAL_ROUTES.backtests ||
          route === JOURNAL_ROUTES.workspace ||
          route === JOURNAL_ROUTES.trades ||
          route === JOURNAL_ROUTES.positions ||
          route === JOURNAL_ROUTES.tradeLinks,
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
        send(
          HTTP_STATUS.OK,
          await journal.updateTradeLinks(command.data, uploads),
        );
        return;
      }
      if (route === JOURNAL_ROUTES.workspace) {
        const command = workspaceCommand.safeParse(input);
        if (!command.success)
          throw new InvalidJournalInput("Invalid workspace entry.");
        send(
          HTTP_STATUS.OK,
          await journal.updateWorkspace(command.data, uploads),
        );
        return;
      }
      if (route === JOURNAL_ROUTES.trash) {
        const command = trashCommandSchema.safeParse(input);
        if (!command.success)
          throw new InvalidJournalInput("Invalid trash command.");
        send(HTTP_STATUS.OK, await journal.updateTrash(command.data));
        return;
      }
      if (route === JOURNAL_ROUTES.accounts) {
        const command = accountCommandSchema.safeParse(input);
        if (!command.success)
          throw new InvalidJournalInput("Invalid account record.");
        send(HTTP_STATUS.OK, await journal.updateAccount(command.data));
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
        send(
          HTTP_STATUS.OK,
          await journal.updatePosition(command.data, uploads),
        );
        return;
      }
      const result = tradeRecordInput.safeParse(input);
      if (!result.success) {
        send(HTTP_STATUS.UNPROCESSABLE_CONTENT, { error: "Invalid trade." });
        return;
      }
      send(HTTP_STATUS.CREATED, await journal.append(result.data, uploads));
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
