import type { Journal } from "@liquidation/domain/journal/types";
import type {
  PositionCommand,
  TradeLinkCommand,
  TradeLinks,
} from "@liquidation/domain/trades/types";
import { randomUUID } from "node:crypto";

import { POSITION_ACTION } from "@liquidation/domain/trades/constants";

import { tradeSchema } from "@liquidation/domain/trades/trade";
import { tradeLinksSchema } from "@liquidation/domain/trades/trade-links";
import type { TradeInput } from "@liquidation/domain/trades/types";
import { InvalidJournalInput, JournalConflict } from "../errors.ts";
import { assertPlaybookLink } from "./playbook-records.ts";

function assertPlanExists(journal: Journal, planId: string | undefined) {
  if (planId && !journal.plans.some((plan) => plan.id === planId)) {
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

export function appendTrade(journal: Journal, input: TradeInput) {
  assertPlanExists(journal, input.planId);
  assertPlaybookLink(journal, input.playbook, undefined, true);
  const trade = { ...input, id: randomUUID() };
  journal.trades.unshift(trade);
  return trade;
}

export function mutatePosition(journal: Journal, command: PositionCommand) {
  if (command.action === POSITION_ACTION.OPEN) {
    assertPlanExists(journal, command.input.planId);
    assertPlaybookLink(journal, command.input.playbook);
    journal.positions.unshift({
      ...command.input,
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
    assertPlanExists(journal, command.input.planId);
    assertPlaybookLink(journal, command.input.playbook, position.playbook);
    journal.positions[index] = {
      ...command.input,
      id: position.id,
      revision: position.revision + 1,
    };
  } else {
    const { management, links, ...outcome } = command.input;
    const associations = links ?? tradeLinksSchema.parse(position);
    let playbook = associations.playbook;
    if (links) assertPlanExists(journal, links.planId);
    if (management) {
      if (!playbook?.version)
        throw new InvalidJournalInput(
          "A versioned playbook is needed to review management.",
        );
      playbook = { ...playbook, management };
    }
    if (links || management)
      assertPlaybookLink(journal, playbook, position.playbook, true);
    const trade = tradeSchema.safeParse(
      replaceTradeLinks(
        { ...position, ...outcome },
        { ...associations, playbook },
      ),
    );
    if (!trade.success)
      throw new InvalidJournalInput("Invalid position close.");
    journal.positions.splice(index, 1);
    journal.trades.unshift(trade.data);
  }
  return journal;
}

export function mutateTradeLinks(
  journal: Journal,
  { id, previous, next }: TradeLinkCommand,
) {
  const index = journal.trades.findIndex((trade) => trade.id === id);
  const trade = journal.trades[index];
  if (!trade) throw new JournalConflict("Trade no longer exists.");
  const current = JSON.stringify(tradeLinksSchema.parse(trade));
  if (current === JSON.stringify(next)) return journal;
  if (current !== JSON.stringify(previous))
    throw new JournalConflict("Trade links have changed.");

  assertPlanExists(journal, next.planId);
  assertPlaybookLink(journal, next.playbook, trade.playbook, true);
  journal.trades[index] = replaceTradeLinks(trade, next);
  return journal;
}
