import { PLAYBOOK_STATUS } from "@liquidation/domain/playbooks/constants";
import type { PlaybookReference } from "@liquidation/domain/playbooks/types";
import { useState } from "react";
import type { PlanPlaybookFieldProps, PlanPlaybookLinkProps } from "./types.ts";

import { playbookHref } from "../../../app/page.ts";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { useJournal } from "../../journal/data/store.ts";
import { usePlaybookMessages } from "../../playbooks/messages.ts";
import { PlaybookSelect } from "../../playbooks/playbook-select.tsx";

function optionValue({ id, version }: PlaybookReference) {
  return `${id}:${version}`;
}

export function readPlanPlaybook(data: FormData) {
  const value = data.get("planPlaybook");
  if (!value) return undefined;
  const [id, version] = String(value).split(":");
  return { id, version: Number(version) };
}

export function PlanPlaybookField({ initial }: PlanPlaybookFieldProps) {
  const b = usePlaybookMessages();
  const books = useJournal((state) => state.playbooks);
  const [value, setValue] = useState(initial ? optionValue(initial) : "");
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
      {available.flatMap((book) =>
        book.versions.toReversed().map(({ number }) => (
          <option
            key={optionValue({ id: book.id, version: number })}
            value={optionValue({ id: book.id, version: number })}
          >
            {book.title} · v{number}
            {book.status === PLAYBOOK_STATUS.RETIRED && ` · ${b.retired}`}
          </option>
        )),
      )}
    </PlaybookSelect>
  );
}

export function PlanPlaybookLink({ reference }: PlanPlaybookLinkProps) {
  const book = useJournal((state) =>
    state.playbooks.find((item) => item.id === reference?.id),
  );
  if (!book || !reference) return EMPTY_VALUE;
  return (
    <a className="record-link" href={playbookHref(book.id)}>
      {book.title} <span className="subdued">v{reference.version}</span>
    </a>
  );
}
