import type { Journal } from "@liquidation/domain/journal/types";
import { deletedPlan } from "@liquidation/domain/journal/trash/trash";
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

export function appendTrade(
  journal: Journal,
  input: TradeInput,
  uploads: ReadonlyMap<string, Uint8Array>,
) {
  assertScreenshotAttachments(new Set(), tradeScreenshotIds(input), uploads);
  assertPlanExists(journal, input.planId);
  assertPlaybookLink(journal, input.playbook, undefined, true);
  const trade = { ...normalizeAccountLink(journal, input), id: randomUUID() };
  journal.trades.unshift(trade);
  return trade;
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
    assertPlaybookLink(journal, command.input.playbook);
    journal.positions.unshift({
      ...normalizeAccountLink(journal, command.input),
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
    assertPlaybookLink(journal, command.input.playbook, position.playbook);
    journal.positions[index] = {
      ...normalizeAccountLink(journal, command.input, position),
      id: position.id,
      revision: position.revision + 1,
    };
  } else {
    const { management, links, ...outcome } = command.input;
    const associations = normalizeAccountLink(
      journal,
      links ?? tradeLinksSchema.parse(position),
      position,
    );
    let playbook = associations.playbook;
    if (links) assertPlanExists(journal, links.planId, position.planId);
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
  if (current !== JSON.stringify(previous))
    throw new JournalConflict("Trade links have changed.");

  assertPlanExists(journal, next.planId, trade.planId);
  assertPlaybookLink(journal, next.playbook, trade.playbook, true);
  const result = tradeSchema.safeParse(
    replaceTradeLinks(trade, normalizeAccountLink(journal, next, trade)),
  );
  if (!result.success) throw new InvalidJournalInput("Invalid trade context.");
  assertScreenshotAttachments(
    tradeScreenshotIds(trade),
    tradeScreenshotIds(result.data),
    uploads,
  );
  journal.trades[index] = result.data;
  return journal;
}
