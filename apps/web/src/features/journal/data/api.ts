import type { BacktestCommand } from "@liquidation/domain/backtests/types";
import {
  HTTP_METHOD,
  JOURNAL_ROUTES,
  MEDIA_TYPE,
  MULTIPART_FIELD,
} from "@liquidation/domain/journal/constants";
import type { PlanCommand } from "@liquidation/domain/plans/types";
import type { PlaybookCommand } from "@liquidation/domain/playbooks/types";
import type {
  PositionCommand,
  Trade,
  TradeLinkCommand,
} from "@liquidation/domain/trades/types";

import { journalSchema } from "@liquidation/domain/journal/journal";

import { tradeSchema } from "@liquidation/domain/trades/trade";

export class JournalRequestError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Journal request failed with status ${status}`);
    this.status = status;
  }
}

async function request(endpoint: string, body?: unknown): Promise<unknown> {
  const options =
    body === undefined
      ? undefined
      : body instanceof FormData
        ? { method: HTTP_METHOD.POST, body }
        : {
            method: HTTP_METHOD.POST,
            headers: { "Content-Type": MEDIA_TYPE.JSON },
            body: JSON.stringify(body),
          };
  const response = await fetch(endpoint, options);
  if (!response.ok) {
    throw new JournalRequestError(response.status);
  }
  return response.json();
}

export async function loadJournal() {
  return journalSchema.parse(await request(JOURNAL_ROUTES.positions));
}

export async function savePosition(command: PositionCommand) {
  return journalSchema.parse(await request(JOURNAL_ROUTES.positions, command));
}

async function saveRecord(
  route: string,
  command: PlanCommand | PlaybookCommand | BacktestCommand,
  uploads?: ReadonlyMap<string, File>,
) {
  if (!uploads?.size) return journalSchema.parse(await request(route, command));

  const form = new FormData();
  form.set(MULTIPART_FIELD.COMMAND, JSON.stringify(command));
  for (const [id, file] of uploads)
    form.append(`${MULTIPART_FIELD.SCREENSHOT_PREFIX}${id}`, file);
  return journalSchema.parse(await request(route, form));
}

export function savePlan(
  command: PlanCommand,
  uploads?: ReadonlyMap<string, File>,
) {
  return saveRecord(JOURNAL_ROUTES.plans, command, uploads);
}

export function savePlaybook(
  command: PlaybookCommand,
  uploads?: ReadonlyMap<string, File>,
) {
  return saveRecord(JOURNAL_ROUTES.playbooks, command, uploads);
}

export function saveBacktest(
  command: BacktestCommand,
  uploads?: ReadonlyMap<string, File>,
) {
  return saveRecord(JOURNAL_ROUTES.backtests, command, uploads);
}

export async function saveTradeLinks(command: TradeLinkCommand) {
  return journalSchema.parse(await request(JOURNAL_ROUTES.tradeLinks, command));
}

export async function saveTrade(trade: Omit<Trade, "id">) {
  return tradeSchema.parse(await request(JOURNAL_ROUTES.trades, trade));
}
