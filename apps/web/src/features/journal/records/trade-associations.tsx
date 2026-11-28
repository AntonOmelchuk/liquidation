import { tradeTagKey } from "@liquidation/domain/trades/trade-tags";
import { reviewedMistakes } from "@liquidation/domain/trades/mistakes";
import { mistakeLabel, useMistakeMessages } from "../../mistakes/messages.ts";
import { tradePlaybookRules } from "@liquidation/domain/playbooks/playbook";
import { CHECKLIST_PHASE } from "@liquidation/domain/playbooks/constants";
import {
  deletedPlan,
  deletedPlaybook,
} from "@liquidation/domain/journal/trash/trash";
import { TRADE_SESSION } from "@liquidation/domain/trades/constants";
import { TradeTestBadge } from "./trade-test-badge.tsx";
import type { TradeLinks } from "@liquidation/domain/trades/types";
import { accountHref, planHref, playbookHref } from "../../../app/page.ts";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { useLocale } from "../../../shared/messages.ts";
import { usePlaybookMessages } from "../../playbooks/messages.ts";
import { useJournal } from "../data/store.ts";
import { useTrashMessages } from "../../trash/messages.ts";
import { useTradeRecordMessages } from "./messages.ts";

export function TradeAssociations({
  planId,
  playbook,
  timeframe,
  account,
  accountId,
  style,
  session,
  entryType,
  limitEntryTest,
  mistakes,
  criticalMistakes,
  mistakesReviewed,
}: TradeLinks) {
  const { t, language } = useLocale();
  const mistake = useMistakeMessages();
  const critical = new Set((criticalMistakes ?? []).map(tradeTagKey));
  const b = usePlaybookMessages();
  const m = useTradeRecordMessages();
  const deleted = useTrashMessages().deleted;
  const plan = useJournal((state) =>
    state.plans.find(({ id }) => id === planId),
  );
  const book = useJournal((state) =>
    state.playbooks.find(({ id }) => id === playbook?.id),
  );
  const oldPlan = useJournal((state) => deletedPlan(state.trash, planId));
  const oldBook = useJournal((state) =>
    deletedPlaybook(state.trash, playbook?.id),
  );
  const accountRecord = useJournal((state) =>
    state.accounts.find(({ id }) => id === accountId),
  );
  const historicalBook = book ?? oldBook;
  const rules = playbook
    ? tradePlaybookRules(historicalBook, playbook)
    : undefined;
  const checks = [
    {
      phase: CHECKLIST_PHASE.ENTRY,
      title: b.filters,
      answers: playbook?.entry,
      rules: rules?.entry ?? [],
    },
    {
      phase: CHECKLIST_PHASE.MANAGEMENT,
      title: b.management,
      answers: playbook?.management,
      rules: rules?.management ?? [],
    },
  ];
  return (
    <>
      <dl className="trade-detail-facts">
        <div>
          <dt>{t.account}</dt>
          <dd>
            {accountRecord ? (
              <a className="record-link" href={accountHref(accountRecord.id)}>
                {accountRecord.name}
              </a>
            ) : (
              account || EMPTY_VALUE
            )}
          </dd>
        </div>
        <div>
          <dt>{t.style}</dt>
          <dd>{style || EMPTY_VALUE}</dd>
        </div>
        <div>
          <dt>{t.timeframe}</dt>
          <dd>{timeframe?.toUpperCase() || EMPTY_VALUE}</dd>
        </div>
        <div>
          <dt>{t.session}</dt>
          <dd>
            {session === TRADE_SESSION.OUTSIDE
              ? t.outsideSession
              : session || EMPTY_VALUE}
          </dd>
        </div>
        <div>
          <dt>{t.entryType}</dt>
          <dd>{entryType ? t[entryType] : EMPTY_VALUE}</dd>
        </div>
        <div>
          <dt>{m.entryTest}</dt>
          <dd>
            <TradeTestBadge value={limitEntryTest} />
          </dd>
        </div>
        <div>
          <dt>{t.linkedPlan}</dt>
          <dd>
            {plan ? (
              <a className="record-link" href={planHref(plan.id)}>
                {plan.setup.title}
              </a>
            ) : oldPlan ? (
              oldPlan.setup.title + " · " + deleted
            ) : (
              EMPTY_VALUE
            )}
          </dd>
        </div>
        <div>
          <dt>{b.link}</dt>
          <dd>
            {book ? (
              <a className="record-link" href={playbookHref(book.id)}>
                {book.title}
              </a>
            ) : historicalBook ? (
              historicalBook.title + " · " + deleted
            ) : (
              EMPTY_VALUE
            )}
          </dd>
        </div>
        <div>
          <dt>{b.setup}</dt>
          <dd>
            {rules?.setupName === undefined
              ? EMPTY_VALUE
              : rules.setupName || b.onlySetup}
          </dd>
        </div>
        <div className="wide">
          <dt>{t.mistakes}</dt>
          <dd>
            {mistakes?.length
              ? mistakes.map((tag) => (
                  <span
                    className={
                      critical.has(tradeTagKey(tag))
                        ? "trade-tag trade-tag-critical"
                        : "trade-tag"
                    }
                    key={tag}
                  >
                    {mistakeLabel(tag, language)}
                    {critical.has(tradeTagKey(tag)) && " · " + mistake.critical}
                  </span>
                ))
              : reviewedMistakes({ mistakes, mistakesReviewed })
                ? mistake.noMistakes
                : mistake.unreviewed}
          </dd>
        </div>
      </dl>
      {checks.some((check) => check.answers?.length) && (
        <div className="trade-checklists">
          {checks.map(({ phase, title, answers, rules }) =>
            answers?.length ? (
              <section key={phase}>
                <h3>{title}</h3>
                <ul className="trade-checklist">
                  {answers.map((answer) => {
                    const rule = rules.find(({ id }) => id === answer.ruleId);
                    return (
                      <li key={answer.ruleId}>
                        <span
                          className={answer.met ? "positive" : "negative"}
                          aria-label={answer.met ? m.pass : m.fail}
                        >
                          {answer.met ? "✓" : "×"}
                        </span>
                        <div>
                          <strong>{rule?.label ?? m.checklist}</strong>
                          {rule?.detail && <p>{rule.detail}</p>}
                          {answer.reason && (
                            <p className="negative">{answer.reason}</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null,
          )}
        </div>
      )}
    </>
  );
}
