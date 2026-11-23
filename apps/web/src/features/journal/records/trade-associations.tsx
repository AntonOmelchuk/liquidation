import { linkedVersion } from "@liquidation/domain/playbooks/playbook";
import { TRADE_SESSION } from "@liquidation/domain/trades/constants";
import type { TradeLinks } from "@liquidation/domain/trades/types";

import { planHref, playbookHref } from "../../../app/page.ts";
import { useLocale } from "../../../shared/messages.ts";
import { usePlaybookMessages } from "../../playbooks/messages.ts";
import { useJournal } from "../data/store.ts";

export function TradeAssociations({
  planId,
  playbook,
  timeframe,
  account,
  session,
  entryType,
  mistakes,
}: TradeLinks) {
  const { t } = useLocale();
  const b = usePlaybookMessages();
  const plan = useJournal((state) =>
    state.plans.find(({ id }) => id === planId),
  );
  const book = useJournal((state) =>
    state.playbooks.find(({ id }) => id === playbook?.id),
  );
  const version = book && playbook && linkedVersion(book, playbook);
  const setup = version?.setups.find(({ id }) => id === playbook?.setupId);

  const classifications = [
    account,
    session === TRADE_SESSION.OUTSIDE ? t.outsideSession : session,
    entryType ? t[entryType] : undefined,
  ].filter(Boolean);
  return (
    <>
      {timeframe && (
        <small>
          {t.timeframe} · {timeframe}
        </small>
      )}
      {classifications.length > 0 && (
        <small>{classifications.join(" · ")}</small>
      )}
      {Boolean(mistakes?.length) && (
        <small>
          {t.mistakes} · {mistakes?.join(", ")}
        </small>
      )}
      {plan && (
        <small>
          {t.linkedPlan} ·{" "}
          <a className="record-link" href={planHref(plan.id)}>
            {plan.setup.title}
          </a>
        </small>
      )}
      {book && (
        <small>
          {b.link} ·{" "}
          <a className="record-link" href={playbookHref(book.id)}>
            {book.title}
          </a>
          {version && ` · v${version.number}`}
          {setup && ` · ${setup.name || b.onlySetup}`}
        </small>
      )}
    </>
  );
}
