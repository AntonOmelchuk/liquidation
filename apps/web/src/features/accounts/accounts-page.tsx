import { useState } from "react";
import { PAGE_HASHES } from "../../app/constants.ts";
import { JOURNAL_STATUS } from "../journal/data/constants.ts";
import { useJournal } from "../journal/data/store.ts";
import { JournalUnavailable } from "../journal/journal-unavailable.tsx";
import { AccountDetails } from "./account-details.tsx";
import { AccountEditor } from "./account-editor.tsx";
import { AccountsList } from "./accounts-list.tsx";
import { useAccountMessages } from "./messages.ts";
import type { AccountPageProps } from "./types.ts";
import "./accounts.css";

export default function AccountsPage({ id }: AccountPageProps) {
  const m = useAccountMessages();
  const ready = useJournal((state) => state.status === JOURNAL_STATUS.READY);
  const account = useJournal((state) =>
    state.accounts.find((account) => account.id === id),
  );
  const [draft, setDraft] = useState<{ name?: string }>();
  if (!ready || (id && !account))
    return (
      <JournalUnavailable
        backHref={PAGE_HASHES.accounts}
        backLabel={m.accounts}
        missing={m.noAccounts}
      />
    );
  if (account) return <AccountDetails key={account.id} account={account} />;
  return (
    <main>
      <header className="page-heading">
        <h1>{m.accounts}</h1>
        <button
          type="button"
          disabled={Boolean(draft)}
          onClick={() => setDraft({})}
        >
          ＋ {m.newAccount}
        </button>
      </header>
      <div className="layout">
        {draft && (
          <AccountEditor
            key={draft.name ?? "new"}
            initialName={draft.name}
            onClose={() => setDraft(undefined)}
          />
        )}
        <AccountsList onCreate={(name) => setDraft({ name })} />
      </div>
    </main>
  );
}
