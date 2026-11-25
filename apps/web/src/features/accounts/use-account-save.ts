import { accountCommandSchema } from "@liquidation/domain/accounts/account";
import { HTTP_STATUS } from "@liquidation/domain/journal/constants";
import { useRef, useState } from "react";
import { JournalRequestError } from "../journal/data/api.ts";
import { useJournal } from "../journal/data/store.ts";
import { ACCOUNT_SAVE_ERROR } from "./constants.ts";
import type { AccountSaveError } from "./types.ts";

export function useAccountSave() {
  const update = useJournal((state) => state.updateAccount);
  const pending = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<AccountSaveError>();
  async function save(value: unknown) {
    if (pending.current) return false;
    const parsed = accountCommandSchema.safeParse(value);
    if (!parsed.success) {
      setError(ACCOUNT_SAVE_ERROR.INVALID);
      return false;
    }
    pending.current = true;
    setSaving(true);
    setError(undefined);
    try {
      await update(parsed.data);
      return true;
    } catch (failure) {
      setError(
        failure instanceof JournalRequestError &&
          failure.status === HTTP_STATUS.CONFLICT
          ? ACCOUNT_SAVE_ERROR.CONFLICT
          : ACCOUNT_SAVE_ERROR.SAVE,
      );
      return false;
    } finally {
      setSaving(false);
      pending.current = false;
    }
  }
  return { saving, error, save };
}
