import type { BacktestCommand } from "@liquidation/domain/backtests/types";
import type { AccountCommand } from "@liquidation/domain/accounts/types";
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
import type { WorkspaceCommand } from "@liquidation/domain/workspace/types";
import type { TrashCommand } from "@liquidation/domain/journal/trash/types";

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

export function savePosition(
  command: PositionCommand,
  uploads?: ReadonlyMap<string, File>,
) {
  return saveRecord(JOURNAL_ROUTES.positions, command, uploads);
}

function evidenceRequest(
  route: string,
  command: unknown,
  uploads?: ReadonlyMap<string, File>,
) {
  if (!uploads?.size) return request(route, command);

  const form = new FormData();
  form.set(MULTIPART_FIELD.COMMAND, JSON.stringify(command));
  for (const [id, file] of uploads)
    form.append(`${MULTIPART_FIELD.SCREENSHOT_PREFIX}${id}`, file);
  return request(route, form);
}

async function saveRecord(
  route: string,
  command: unknown,
  uploads?: ReadonlyMap<string, File>,
) {
  return journalSchema.parse(await evidenceRequest(route, command, uploads));
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

export function saveTradeLinks(
  command: TradeLinkCommand,
  uploads?: ReadonlyMap<string, File>,
) {
  return saveRecord(JOURNAL_ROUTES.tradeLinks, command, uploads);
}

export function saveWorkspace(
  command: WorkspaceCommand,
  uploads?: ReadonlyMap<string, File>,
) {
  return saveRecord(JOURNAL_ROUTES.workspace, command, uploads);
}
export async function saveTrash(command: TrashCommand) {
  return journalSchema.parse(await request(JOURNAL_ROUTES.trash, command));
}

export async function saveAccount(command: AccountCommand) {
  return journalSchema.parse(await request(JOURNAL_ROUTES.accounts, command));
}

export async function saveTrade(
  trade: Omit<Trade, "id">,
  uploads?: ReadonlyMap<string, File>,
) {
  return tradeSchema.parse(
    await evidenceRequest(JOURNAL_ROUTES.trades, trade, uploads),
  );
}
