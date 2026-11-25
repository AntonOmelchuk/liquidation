import { riskFromSizing, riskSizingSchema } from "../trades/financials.ts";
import type { Position } from "../trades/types.ts";
import { toCents } from "../shared/money.ts";
import { accountBalance } from "./performance.ts";
import type { Account, AccountSource } from "./types.ts";

export function entryRiskSizing(
  account: Account,
  source: AccountSource,
  openedAt: string,
  percent: number,
  previous?: Position,
) {
  if (!Number.isFinite(Date.parse(openedAt))) return null;
  const saved = previous?.riskSizing;
  if (
    saved &&
    saved.accountId === account.id &&
    saved.percent === percent &&
    previous.openedAt === openedAt
  ) {
    return saved;
  }
  const result = riskSizingSchema.safeParse({
    accountId: account.id,
    balanceCents: toCents(accountBalance(account, source, openedAt)),
    percent,
  });
  return result.success && riskFromSizing(result.data) !== null
    ? result.data
    : null;
}
