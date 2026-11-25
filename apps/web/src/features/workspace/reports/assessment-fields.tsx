import { netCents, realizedR } from "@liquidation/domain/trades/trade";
import { TRASH_KIND } from "@liquidation/domain/journal/trash/constants";
import { useJournal } from "../../journal/data/store.ts";
import { useTrashMessages } from "../../trash/messages.ts";
import { useId, useState } from "react";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { REPORT_GRADES } from "@liquidation/domain/workspace/constants";
import { useWorkspaceMessages } from "../messages.ts";
import {
  ASSESSMENT_NOTE_MAX,
  GRADE_MAX,
  REPORT_ROW_STEP,
} from "./constants.ts";
import type { AssessmentFieldsProps, ReviewSubject } from "./types.ts";

export function SubjectResult({ subject }: { subject: ReviewSubject }) {
  const { format } = useLocale();
  const m = useWorkspaceMessages();
  const deleted = useTrashMessages().deleted;
  const inTrash = useJournal((state) =>
    state.trash.some(
      (entry) =>
        (entry.kind === TRASH_KIND.TRADE ||
          entry.kind === TRASH_KIND.POSITION) &&
        entry.value.id === subject.id,
    ),
  );
  if (inTrash) return <span className="subdued">{deleted}</span>;
  if (!("closedAt" in subject))
    return <span className="subdued">{m.open}</span>;
  const net = netCents(subject) / 100;
  const r = realizedR(subject);
  return (
    <span className={numericTone(net)}>
      {format.money.format(net)}
      {r === null ? "" : " · " + format.money.format(r) + " R"}
    </span>
  );
}

export function AssessmentFields({
  candidates,
  grades,
  onChange,
}: AssessmentFieldsProps) {
  const { t, format } = useLocale();
  const m = useWorkspaceMessages();
  const listId = useId();
  const [limit, setLimit] = useState(REPORT_ROW_STEP);
  const map = new Map(grades.map((item) => [item.id, item]));
  const visible = candidates.filter(
    ({ id }, index) => index < limit || map.has(id),
  );

  function change(
    id: string,
    patch: Partial<AssessmentFieldsProps["grades"][number]>,
  ) {
    const current = map.get(id) ?? { id, grade: "", note: "" };
    const next = { ...current, ...patch };
    const others = grades.filter((grade) => grade.id !== id);
    onChange(next.grade || next.note ? [...others, next] : others);
  }

  if (!candidates.length) return <p>{t.noTrades}</p>;

  return (
    <>
      <p>{m.gradingHint}</p>
      <datalist id={listId}>
        {REPORT_GRADES.map((grade) => (
          <option value={grade} key={grade} />
        ))}
      </datalist>
      <div className="table">
        <table aria-label={m.assessments} className="report-assessments">
          <thead>
            <tr>
              <th scope="col">{t.symbol}</th>
              <th scope="col">{m.grade}</th>
              <th scope="col">{t.result}</th>
              <th scope="col">{t.notes}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((subject) => {
              const label =
                subject.symbol +
                " · " +
                t[subject.direction] +
                " · " +
                format.date.format(Date.parse(subject.openedAt));
              return (
                <tr key={subject.id}>
                  <th scope="row">
                    {subject.symbol}
                    <small>{label.slice(subject.symbol.length + 3)}</small>
                  </th>
                  <td>
                    <input
                      aria-label={m.grade + " · " + label}
                      list={listId}
                      maxLength={GRADE_MAX}
                      value={map.get(subject.id)?.grade ?? ""}
                      onChange={(event) =>
                        change(subject.id, { grade: event.target.value })
                      }
                    />
                  </td>
                  <td>
                    <SubjectResult subject={subject} />
                  </td>
                  <td>
                    <textarea
                      aria-label={t.notes + " · " + label}
                      rows={2}
                      maxLength={ASSESSMENT_NOTE_MAX}
                      value={map.get(subject.id)?.note ?? ""}
                      onChange={(event) =>
                        change(subject.id, { note: event.target.value })
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {visible.length < candidates.length && (
        <button
          type="button"
          className="secondary"
          onClick={() => setLimit(limit + REPORT_ROW_STEP)}
        >
          {m.assessments} · {visible.length}/{candidates.length} ＋
        </button>
      )}
    </>
  );
}

export function SavedAssessments({
  candidates,
  grades,
}: Pick<AssessmentFieldsProps, "candidates" | "grades">) {
  const { t, format } = useLocale();
  const m = useWorkspaceMessages();
  if (!grades.length) return null;
  const byId = new Map(candidates.map((subject) => [subject.id, subject]));
  return (
    <div className="table">
      <table aria-label={m.assessments}>
        <thead>
          <tr>
            <th scope="col">{t.symbol}</th>
            <th scope="col">{m.grade}</th>
            <th scope="col">{t.result}</th>
            <th scope="col">{t.notes}</th>
          </tr>
        </thead>
        <tbody>
          {grades.map(({ id, grade, note }) => {
            const subject = byId.get(id);
            return (
              <tr key={id}>
                <th scope="row">
                  {subject
                    ? subject.symbol + " · " + t[subject.direction]
                    : EMPTY_VALUE}
                  {subject && (
                    <small>
                      {format.date.format(Date.parse(subject.openedAt))}
                    </small>
                  )}
                </th>
                <td>{grade || EMPTY_VALUE}</td>
                <td>
                  {subject ? <SubjectResult subject={subject} /> : EMPTY_VALUE}
                </td>
                <td className="record-prose">{note || EMPTY_VALUE}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
