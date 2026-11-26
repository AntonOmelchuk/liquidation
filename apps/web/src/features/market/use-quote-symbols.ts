import { quoteSelectionSchema } from "@liquidation/domain/market/contracts";
import { useMemo } from "react";
import { usePreferences } from "../../app/preferences.ts";
import { DEFAULT_QUOTE_SYMBOLS } from "./constants.ts";

export function useQuoteSymbols() {
  const stored = usePreferences((state) => state.quoteSymbols);
  return useMemo(() => {
    const selection = quoteSelectionSchema.safeParse(stored);
    return selection.success ? selection.data : DEFAULT_QUOTE_SYMBOLS;
  }, [stored]);
}
