import type { z } from "zod";
import type {
  accountCommandSchema,
  accountInputSchema,
  accountRulesSchema,
  accountSchema,
  movementInputSchema,
  movementSchema,
} from "./account.ts";
import type { Position, Trade } from "../trades/types.ts";
import type { accountPerformance, accountRuleProgress } from "./performance.ts";

export type Account = z.infer<typeof accountSchema>;
export type AccountInput = z.infer<typeof accountInputSchema>;
export type AccountRules = z.infer<typeof accountRulesSchema>;
export type AccountMovement = z.infer<typeof movementSchema>;
export type MovementInput = z.infer<typeof movementInputSchema>;
export type AccountCommand = z.infer<typeof accountCommandSchema>;
export type AccountLimit = NonNullable<AccountRules["dailyLimit"]>;
export type AccountSource = {
  trades: readonly Trade[];
  positions: readonly Position[];
  movements: readonly AccountMovement[];
};
export type AccountPerformance = ReturnType<typeof accountPerformance>;
export type AccountRuleProgress = NonNullable<
  ReturnType<typeof accountRuleProgress>
>;
export type AccountLedgerPoint = {
  timestamp: number;
  balance: number;
  performance: number;
};
