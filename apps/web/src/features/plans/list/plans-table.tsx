import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { DeleteRecord } from "../../trash/delete-record.tsx";
import { PAGE_VIEW } from "../../../app/constants.ts";
import type { PlanRowProps, PlansTableProps } from "./types.ts";

import { planHref } from "../../../app/page.ts";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { PencilIcon } from "../../../shared/ui/action-icons.tsx";
import { InstrumentIcons } from "../../../shared/ui/instrument-picker.tsx";
import { usePlaybookMessages } from "../../playbooks/messages.ts";
import {
  PlanNarrativeLabel,
  PlanSpan,
  PlanStatusChip,
} from "../details/plan-facts.tsx";
import { PlanPlaybookLink } from "../editor/plan-playbook.tsx";
import { usePlanMessages } from "../messages.ts";

function PlanRow({ plan, actual }: PlanRowProps) {
  const p = usePlanMessages();
  const { t, format } = useLocale();
  const { id, setup } = plan;
  const count = (number: number) => format.integer.format(number);
  const totalR = actual?.totalR ?? null;
  return (
    <tr className="plan-row">
      <th scope="row" className="plan-name">
        <a href={planHref(id)}>{setup.title}</a>
        <small className="plan-row-market">
          <span className="instrument-label">
            <InstrumentIcons symbol={setup.symbol} />
            {setup.symbol}
          </span>
          <span>{t[setup.direction]}</span>
          <PlanNarrativeLabel setup={setup} />
        </small>
      </th>
      <td>
        <PlanSpan setup={setup} compact />
      </td>
      <td>
        <a
          className="plan-status-link"
          href={planHref(id, PAGE_VIEW.REVIEW)}
          aria-label={`${p.changeStatus} · ${setup.title} · ${p[plan.review.status]}`}
        >
          <PlanStatusChip plan={plan} compact />
        </a>
      </td>
      <td className="plan-table-playbook">
        <PlanPlaybookLink reference={setup.playbook} />
      </td>
      <td>
        {actual?.count ? (
          <div className="plan-table-counts">
            {actual.closed > 0 && (
              <span>
                {p.closedState} · {count(actual.closed)}
              </span>
            )}
            {actual.open > 0 && (
              <span>
                {p.openState} · {count(actual.open)}
              </span>
            )}
          </div>
        ) : (
          EMPTY_VALUE
        )}
      </td>
      <td
        className="plan-table-result"
        title={
          actual?.missingRisk
            ? p.missingRisk + " · " + count(actual.missingRisk)
            : undefined
        }
      >
        {totalR === null ? (
          EMPTY_VALUE
        ) : (
          <strong className={numericTone(totalR)}>
            {format.money.format(totalR)} R
          </strong>
        )}
      </td>
      <td className="plan-table-actions">
        <div className="plan-row-actions">
          <a
            className="action-link secondary icon-action"
            href={planHref(id, PAGE_VIEW.EDIT)}
            aria-label={`${p.edit} · ${setup.title}`}
            title={p.editShort}
          >
            <PencilIcon />
          </a>
          <DeleteRecord
            kind={TRASH_KIND.PLAN}
            recordKey={id}
            revision={plan.revision}
            iconOnly
            recordLabel={setup.title}
          />
        </div>
      </td>
    </tr>
  );
}

export function PlansTable({ groups, execution, label }: PlansTableProps) {
  const { format } = useLocale();
  const p = usePlanMessages();
  const b = usePlaybookMessages();

  return (
    <div
      className="table plans-table"
      role="region"
      aria-label={label ?? p.allPlans}
      tabIndex={0}
    >
      <table aria-label={label ?? p.allPlans}>
        <thead>
          <tr>
            <th scope="col">{p.title}</th>
            <th scope="col">{p.period}</th>
            <th scope="col">{p.status}</th>
            <th scope="col">{b.link}</th>
            <th scope="col">{p.linked}</th>
            <th scope="col">{p.result}</th>
            <th scope="col" className="plan-table-actions">
              {p.actions}
            </th>
          </tr>
        </thead>
        {groups.map(({ period, plans }) => (
          <tbody key={period}>
            <tr className="plan-table-group">
              <th scope="rowgroup" colSpan={7}>
                {p[period]} <span>{format.integer.format(plans.length)}</span>
              </th>
            </tr>
            {plans.map((plan) => (
              <PlanRow
                key={plan.id}
                plan={plan}
                actual={execution.get(plan.id)?.actual}
              />
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
