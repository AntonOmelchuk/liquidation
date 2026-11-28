import { entryRiskSizing } from "@liquidation/domain/accounts/entry-risk";
import {
  calculatedGrossProfit,
  riskFromSizing,
} from "@liquidation/domain/trades/financials";
import type { Journal } from "@liquidation/domain/journal/types";
import { deletedPlan } from "@liquidation/domain/journal/trash/trash";
import type {
  PnlCalculation,
  Position,
  PositionCommand,
  Trade,
  TradeInput,
  TradeLinkCommand,
  TradeLinks,
} from "@liquidation/domain/trades/types";
import { randomUUID } from "node:crypto";

import { POSITION_ACTION } from "@liquidation/domain/trades/constants";

import { tradeSchema } from "@liquidation/domain/trades/trade";
import { tradeLinksSchema } from "@liquidation/domain/trades/trade-links";
import { InvalidJournalInput, JournalConflict } from "../errors.ts";
import { recordTradePlaybook } from "./playbook-records.ts";
import { normalizeAccountLink } from "./account-records.ts";
import { tradeScreenshotIds } from "@liquidation/domain/trades/trade-evidence";
import { assertScreenshotAttachments } from "./screenshot-attachments.ts";

function assertPlanExists(
  journal: Journal,
  planId: string | undefined,
  previous?: string,
) {
  if (
    planId &&
    !journal.plans.some((plan) => plan.id === planId) &&
    !(planId === previous && deletedPlan(journal.trash, planId))
  ) {
    throw new InvalidJournalInput("The linked plan does not exist.");
  }
}

function replaceTradeLinks<Entry extends TradeLinks>(
  entry: Entry,
  links: TradeLinks,
) {
  const updated = { ...entry };
  // Omitted fields in a complete link snapshot represent removals.
  for (const key of Object.keys(
    tradeLinksSchema.shape,
  ) as (keyof TradeLinks)[]) {
    delete updated[key];
  }
  return { ...updated, ...links };
}

function sizeTrade<T extends Pick<Position, "accountId" | "openedAt" | "risk">>(
  journal: Journal,
  input: T,
  percent: number | null | undefined,
  previous?: Position,
) {
  if (percent === null) return { ...input, risk: null };
  if (percent === undefined) {
    return previous?.riskSizing
      ? { ...input, risk: previous.risk, riskSizing: previous.riskSizing }
      : input;
  }
  const account = journal.accounts.find(({ id }) => id === input.accountId);
  if (!account)
    throw new InvalidJournalInput("Select an account to size the trade.");
  const riskSizing = entryRiskSizing(
    account,
    journal,
    input.openedAt,
    percent,
    previous,
  );
  const risk = riskSizing ? riskFromSizing(riskSizing) : null;
  if (!riskSizing || risk === null)
    throw new InvalidJournalInput(
      "Risk needs a positive entry balance and a valid percentage.",
    );
  return { ...input, risk, riskSizing };
}

function tradeProfit(
  trade: Pick<Trade, "profit" | "risk" | "direction" | "prices">,
  calculation?: PnlCalculation,
) {
  if (!calculation) return trade.profit;
  const profit = calculatedGrossProfit(
    trade.risk,
    calculation,
    trade.direction,
    trade.prices,
  );
  if (profit === null)
    throw new InvalidJournalInput(
      "The trade lacks a valid risk or result for calculating P&L.",
    );
  return profit;
}

export function appendTrade(
  journal: Journal,
  input: TradeInput,
  uploads: ReadonlyMap<string, Uint8Array>,
) {
  assertScreenshotAttachments(new Set(), tradeScreenshotIds(input), uploads);
  assertPlanExists(journal, input.planId);
  const { riskPercent, pnlCalculation, ...record } = input;
  record.playbook = recordTradePlaybook(
    journal,
    input.playbook,
    undefined,
    true,
  );
  const sized = sizeTrade(
    journal,
    normalizeAccountLink(journal, record),
    riskPercent,
  );
  const trade = tradeSchema.safeParse({
    ...sized,
    id: randomUUID(),
    profit: tradeProfit(sized, pnlCalculation),
  });
  if (!trade.success) throw new InvalidJournalInput("Invalid trade.");
  journal.trades.unshift(trade.data);
  return trade.data;
}

export function mutatePosition(
  journal: Journal,
  command: PositionCommand,
  uploads: ReadonlyMap<string, Uint8Array>,
) {
  if (command.action === POSITION_ACTION.OPEN) {
    assertScreenshotAttachments(
      new Set(),
      tradeScreenshotIds(command.input),
      uploads,
    );
    assertPlanExists(journal, command.input.planId);
    const { riskPercent, ...record } = command.input;
    record.playbook = recordTradePlaybook(journal, record.playbook);
    const sized = sizeTrade(
      journal,
      normalizeAccountLink(journal, record),
      riskPercent,
    );
    journal.positions.unshift({
      ...sized,
      id: randomUUID(),
      revision: 1,
    });
    return journal;
  }

  const index = journal.positions.findIndex(({ id }) => id === command.id);
  const position = journal.positions[index];
  if (!position || position.revision !== command.revision)
    throw new JournalConflict("Position has changed.");

  if (command.action === POSITION_ACTION.EDIT) {
    assertScreenshotAttachments(
      tradeScreenshotIds(position),
      tradeScreenshotIds(command.input),
      uploads,
    );
    assertPlanExists(journal, command.input.planId, position.planId);
    const { riskPercent, ...record } = command.input;
    record.playbook = recordTradePlaybook(
      journal,
      record.playbook,
      position.playbook,
    );
    const sized = sizeTrade(
      journal,
      normalizeAccountLink(journal, record, position),
      riskPercent,
      position,
    );
    journal.positions[index] = {
      ...sized,
      id: position.id,
      revision: position.revision + 1,
    };
  } else {
    const { management, links, pnlCalculation, ...outcome } = command.input;
    const associations = normalizeAccountLink(
      journal,
      links ?? tradeLinksSchema.parse(position),
      position,
    );
    let playbook = associations.playbook;
    if (links) assertPlanExists(journal, links.planId, position.planId);
    if (management) {
      if (!playbook)
        throw new InvalidJournalInput(
          "A linked playbook is needed to review management.",
        );
      playbook = { ...playbook, management };
    }
    if (links || management)
      playbook = recordTradePlaybook(
        journal,
        playbook,
        position.playbook,
        true,
      );
    const draft = replaceTradeLinks(
      { ...position, ...outcome },
      { ...associations, playbook },
    );
    const trade = tradeSchema.safeParse({
      ...draft,
      profit: tradeProfit(draft, pnlCalculation),
    });
    if (!trade.success)
      throw new InvalidJournalInput("Invalid position close.");
    assertScreenshotAttachments(
      tradeScreenshotIds(position),
      tradeScreenshotIds(trade.data),
      uploads,
    );
    journal.positions.splice(index, 1);
    journal.trades.unshift(trade.data);
  }
  return journal;
}

export function mutateTradeLinks(
  journal: Journal,
  { id, previous, next }: TradeLinkCommand,
  uploads: ReadonlyMap<string, Uint8Array>,
) {
  const index = journal.trades.findIndex((trade) => trade.id === id);
  const trade = journal.trades[index];
  if (!trade) throw new JournalConflict("Trade no longer exists.");
  const current = JSON.stringify(tradeLinksSchema.parse(trade));
  if (current === JSON.stringify(next)) {
    assertScreenshotAttachments(
      tradeScreenshotIds(trade),
      tradeScreenshotIds(trade),
      uploads,
    );
    return journal;
  }
  const links = normalizeAccountLink(journal, next, trade);
  links.playbook = recordTradePlaybook(
    journal,
    links.playbook,
    trade.playbook,
    true,
  );
  if (current === JSON.stringify(tradeLinksSchema.parse(links))) {
    assertScreenshotAttachments(
      tradeScreenshotIds(trade),
      tradeScreenshotIds(trade),
      uploads,
    );
    return journal;
  }
  if (current !== JSON.stringify(previous))
    throw new JournalConflict("Trade links have changed.");

  assertPlanExists(journal, next.planId, trade.planId);
  const result = tradeSchema.safeParse(replaceTradeLinks(trade, links));
  if (!result.success) throw new InvalidJournalInput("Invalid trade context.");
  assertScreenshotAttachments(
    tradeScreenshotIds(trade),
    tradeScreenshotIds(result.data),
    uploads,
  );
  journal.trades[index] = result.data;
  return journal;
}
