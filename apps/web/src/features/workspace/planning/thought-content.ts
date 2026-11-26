import type {
  DailyThought,
  Preparation,
} from "@liquidation/domain/workspace/types";

export function thoughtContent(
  preparation?: Preparation,
  legacy?: DailyThought,
) {
  return {
    outlook: [...new Set([legacy?.text, preparation?.outlook])]
      .filter(Boolean)
      .join("\n\n"),
    news: preparation?.news ?? "",
    watch: preparation?.watch ?? "",
    screenshotIds: [
      ...new Set([
        ...(legacy?.screenshotIds ?? []),
        ...(preparation?.screenshotIds ?? []),
      ]),
    ],
  };
}
