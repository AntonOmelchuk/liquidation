import type { TRASH_RESULT } from "./constants.ts";
import type { TrashKind } from "@liquidation/domain/journal/trash/types";

export type DeleteRecordProps = {
  kind: TrashKind;
  recordKey: string;
  revision?: number;
  afterDelete?: () => void;
  disabled?: boolean;
  iconOnly?: boolean;
  recordLabel?: string;
};

export type TrashResult = (typeof TRASH_RESULT)[keyof typeof TRASH_RESULT];
