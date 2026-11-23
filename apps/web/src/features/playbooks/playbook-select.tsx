import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { NEW_PLAYBOOK_HREF } from "../../app/constants.ts";

import { useLocale } from "../../shared/messages.ts";
import { SelectField } from "../../shared/ui/select-field.tsx";
import { useJournal } from "../journal/data/store.ts";
import { usePlaybookMessages } from "./messages.ts";

export function PlaybookSelect({
  empty,
  ...props
}: ComponentProps<typeof SelectField> & { empty: boolean }) {
  const b = usePlaybookMessages();
  const { t } = useLocale();
  const refreshPlaybooks = useJournal((state) => state.refreshPlaybooks);
  const openedCreation = useRef(false);
  const [failed, setFailed] = useState(false);
  const reload = useCallback(async () => {
    try {
      await refreshPlaybooks();
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [refreshPlaybooks]);

  useEffect(() => {
    if (!empty) return;
    const onFocus = () => {
      if (openedCreation.current) void reload();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [empty, reload]);

  return (
    <div className="playbook-choice">
      <SelectField {...props} disabled={empty || props.disabled} />
      {empty && (
        <div className="playbook-choice-actions">
          <a
            className="record-link"
            href={NEW_PLAYBOOK_HREF}
            target="_blank"
            rel="noopener"
            onClick={() => {
              openedCreation.current = true;
            }}
          >
            {b.createInNewTab}
          </a>
          <button
            type="button"
            className="secondary"
            onClick={() => void reload()}
          >
            {b.reloadOptions}
          </button>
          {failed && (
            <p role="alert" className="error">
              {t.loadError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
