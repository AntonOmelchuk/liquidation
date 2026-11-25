import type {
  Account,
  AccountLimit,
  AccountMovement,
  AccountPerformance,
  AccountRules,
  AccountRuleProgress,
} from "@liquidation/domain/accounts/types";
import type { TradeLinks } from "@liquidation/domain/trades/types";
import type { ACCOUNT_LIMIT_FIELDS, ACCOUNT_SAVE_ERROR } from "./constants.ts";

export type AccountEditorProps = {
  account?: Account;
  initialName?: string;
  onClose: () => void;
};
export type MovementEditorProps = {
  account: Account;
  movement?: AccountMovement;
  onClose: () => void;
};
export type AccountRulesFieldsProps = { initial?: AccountRules };
export type LimitFieldProps = {
  name: (typeof ACCOUNT_LIMIT_FIELDS)[number];
  initial?: AccountLimit;
};
export type AccountRulesPanelProps = {
  account: Account;
  progress: AccountRuleProgress;
};
export type AccountSummaryProps = {
  account: Account;
  performance: AccountPerformance;
};
export type AccountSaveError =
  (typeof ACCOUNT_SAVE_ERROR)[keyof typeof ACCOUNT_SAVE_ERROR];
export type AccountFieldProps = {
  initial?: TradeLinks;
  onChange?: (accountId: string) => void;
};
export type AccountPageProps = { id?: string };
export type AccountsListProps = { onCreate: (name?: string) => void };
export type AccountDetailsProps = { account: Account };
