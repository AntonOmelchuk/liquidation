import { PLAYBOOK_STATUS } from "@liquidation/domain/playbooks/constants";
import { deletedPlaybook } from "@liquidation/domain/journal/trash/trash";
import { useState } from "react";
import type { PlanPlaybookFieldProps, PlanPlaybookLinkProps } from "./types.ts";

import { playbookHref } from "../../../app/page.ts";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { useJournal } from "../../journal/data/store.ts";
import { useHistoricalPlaybookOptions } from "../../journal/data/references.ts";
import { useTrashMessages } from "../../trash/messages.ts";
import { usePlaybookMessages } from "../../playbooks/messages.ts";
import { PlaybookSelect } from "../../playbooks/playbook-select.tsx";

export function readPlanPlaybook(data: FormData) {
  const id = data.get("planPlaybook");
  return id ? { id: String(id) } : undefined;
}

export function PlanPlaybookField({ initial }: PlanPlaybookFieldProps) {
  const b = usePlaybookMessages();
  const books = useHistoricalPlaybookOptions(initial?.id);
  const active = useJournal((state) => state.playbooks);
  const deleted = useTrashMessages().deleted;
  const [value, setValue] = useState(initial?.id ?? "");
  const available = books.filter(
    (book) =>
      book.status !== PLAYBOOK_STATUS.RETIRED || book.id === initial?.id,
  );

  return (
    <PlaybookSelect
      label={b.link}
      name="planPlaybook"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      empty={!available.length}
    >
      <option value="">{b.none}</option>
      {available.map((book) => (
        <option key={book.id} value={book.id}>
          {book.title}
          {book.status === PLAYBOOK_STATUS.RETIRED && ` · ${b.retired}`}
          {!active.some(({ id }) => id === book.id) && " · " + deleted}
        </option>
      ))}
    </PlaybookSelect>
  );
}

export function PlanPlaybookLink({ reference }: PlanPlaybookLinkProps) {
  const book = useJournal((state) =>
    state.playbooks.find((item) => item.id === reference?.id),
  );
  const old = useJournal((state) =>
    deletedPlaybook(state.trash, reference?.id),
  );
  const deleted = useTrashMessages().deleted;
  if (!reference) return EMPTY_VALUE;
  if (!book)
    return old ? (
      <span>
        {old.title} · {deleted}
      </span>
    ) : (
      EMPTY_VALUE
    );
  return (
    <a className="record-link" href={playbookHref(book.id)}>
      {book.title}
    </a>
  );
}
