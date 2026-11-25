import type { HOLD_TIME } from "@liquidation/domain/analytics/constants";
import type {
  ReviewBucket,
  ReviewEvidence,
  ReviewGroup,
  ReviewMetrics,
  ReviewReport,
  ReviewSimulation,
} from "@liquidation/domain/review/types";
import {
  REVIEW_GROUP,
  REVIEW_SMALL_SAMPLE,
} from "@liquidation/domain/review/constants";
import { EMPTY_VALUE, LOCALES } from "../../../shared/constants.ts";
import type { useStatisticsMessages } from "../../statistics/messages.ts";
import type {
  ReportTables,
  ReviewPresentation,
  ReviewTable,
} from "../types.ts";

export function reviewValues({ format }: ReviewPresentation) {
  return {
    amount: (value: number | null) =>
      value === null ? EMPTY_VALUE : format.money.format(value),
    percent: (value: number | null) =>
      value === null ? EMPTY_VALUE : format.percentage.format(value),
    count: (value: number) => format.integer.format(value),
  };
}

export function reviewBucketTitle(
  group: ReviewGroup,
  bucket: ReviewBucket,
  { language, t }: ReviewPresentation,
  durations: ReturnType<typeof useStatisticsMessages>["durations"],
) {
  switch (group) {
    case REVIEW_GROUP.WEEKDAYS:
      return new Intl.DateTimeFormat(LOCALES[language], {
        weekday: "long",
        timeZone: "UTC",
      }).format(new Date(Date.UTC(2024, 0, Number(bucket.title))));
    case REVIEW_GROUP.HOURS:
      return `${bucket.title.padStart(2, "0")}:00`;
    case REVIEW_GROUP.MONTHS:
      return new Intl.DateTimeFormat(LOCALES[language], {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${bucket.title}-01T12:00:00Z`));
    case REVIEW_GROUP.DURATIONS:
      return durations[
        bucket.key as (typeof HOLD_TIME)[keyof typeof HOLD_TIME]
      ];
    default:
      return [bucket.title, bucket.side ? t[bucket.side] : ""]
        .filter(Boolean)
        .join(" · ");
  }
}

export function reportTables(
  report: ReviewReport,
  presentation: ReviewPresentation,
  durations: ReturnType<typeof useStatisticsMessages>["durations"],
): ReportTables {
  const { messages: m, t } = presentation;
  const { amount, percent, count } = reviewValues(presentation);
  const stats = report.totals;

  const facts = {
    [t.count]: count(stats.count),
    [m.winLossFlat]: [stats.wins, stats.losses, stats.flat]
      .map(count)
      .join(" / "),
    [t.win]: percent(stats.winRate),
    [t.pnl]: amount(stats.net),
    [m.actualRR]: amount(stats.payoff),
    [t.profitFactor]: amount(stats.profitFactor),
    [m.expectancy]: amount(stats.expectancy),
    [m.expectancyR]: amount(stats.expectancyR),
    [t.result]: amount(stats.totalR),
    [m.measuredRisk]: count(stats.countWithRisk),
    [m.averageWin]: amount(stats.averageWin),
    [m.averageLoss]: amount(stats.averageLoss),
    [m.largestWin]: amount(stats.largestWin),
    [m.largestLoss]: amount(stats.largestLoss),
    [m.maxDrawdown]: amount(stats.maxDrawdown),
    [m.lowest]: amount(stats.lowestPnl),
    [m.longestWin]: count(stats.longestWin),
    [m.longestLoss]: count(stats.longestLoss),
    [m.avgHold]: amount(stats.duration.mean),
    [m.medHold]: amount(stats.duration.median),
    [m.winHold]: `${amount(stats.winningDuration.mean)} / ${amount(stats.winningDuration.median)}`,
    [m.lossHold]: `${amount(stats.losingDuration.mean)} / ${amount(stats.losingDuration.median)}`,
    [m.nearBreakEven]: count(stats.nearBreakEven),
  };

  function groupTable(
    label: string,
    column: string,
    buckets: readonly ReviewBucket[],
    title: (bucket: ReviewBucket) => string,
  ): ReviewTable {
    return {
      label,
      columns: [
        column,
        t.count,
        t.win,
        t.pnl,
        t.profitFactor,
        m.actualRR,
        t.result,
        m.sample,
      ],
      rows: buckets.map((bucket) => ({
        key: bucket.key,
        cells: [
          title(bucket),
          count(bucket.metrics.count),
          percent(bucket.metrics.winRate),
          amount(bucket.metrics.net),
          amount(bucket.metrics.profitFactor),
          amount(bucket.metrics.payoff),
          amount(bucket.metrics.totalR),
          bucket.metrics.count < REVIEW_SMALL_SAMPLE ? m.small : EMPTY_VALUE,
        ],
      })),
    };
  }

  const groups = Object.fromEntries(
    Object.values(REVIEW_GROUP).map((group) => [
      group,
      groupTable(
        m.groups[group],
        m.groups[group],
        report.groups[group],
        (bucket) => reviewBucketTitle(group, bucket, presentation, durations),
      ),
    ]),
  ) as ReportTables["groups"];

  return {
    metrics: {
      label: m.metrics,
      columns: [m.metric, m.value],
      rows: Object.entries(facts).map(([key, value]) => ({
        key,
        cells: [key, value],
      })),
    },
    accounts: groupTable(
      m.byAccount,
      m.account,
      report.accounts,
      (bucket) => bucket.title || m.unassigned,
    ),
    groups,
  };
}

export function comparisonTable(
  result: ReviewSimulation,
  presentation: ReviewPresentation,
): ReviewTable {
  const { messages: m, t } = presentation;
  const { amount, percent, count } = reviewValues(presentation);
  const metrics: [string, (report: ReviewMetrics) => string][] = [
    [t.count, (stats) => count(stats.count)],
    [t.win, (stats) => percent(stats.winRate)],
    [t.pnl, (stats) => amount(stats.net)],
    [t.result, (stats) => amount(stats.totalR)],
    [m.measuredRisk, (stats) => count(stats.countWithRisk)],
    [t.profitFactor, (stats) => amount(stats.profitFactor)],
    [m.maxDrawdown, (stats) => amount(stats.maxDrawdown)],
    [m.longestLoss, (stats) => count(stats.longestLoss)],
  ];
  return {
    label: m.compared,
    columns: [m.metric, m.actual, m.simulated],
    rows: metrics.map(([name, display]) => ({
      key: name,
      cells: [name, display(result.before), display(result.after)],
    })),
  };
}

export function findingText(
  { group, bucket }: ReviewEvidence,
  presentation: ReviewPresentation,
  durations: ReturnType<typeof useStatisticsMessages>["durations"],
) {
  const { messages: m, t } = presentation;
  const { amount, percent, count } = reviewValues(presentation);
  const { metrics } = bucket;
  return {
    title: reviewBucketTitle(group, bucket, presentation, durations),
    summary: [
      m.groups[group],
      `${t.count} ${count(metrics.count)}`,
      `${t.pnl} ${amount(metrics.net)}`,
      `${t.win} ${percent(metrics.winRate)}`,
      metrics.count < REVIEW_SMALL_SAMPLE ? m.small : "",
    ]
      .filter(Boolean)
      .join(" · "),
  };
}
