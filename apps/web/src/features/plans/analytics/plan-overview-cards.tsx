import { PLAN_STATUS } from "@liquidation/domain/plans/constants";
import { EMPTY_VALUE } from "../../../shared/constants.ts";
import { useLocale } from "../../../shared/messages.ts";
import { MetricBar } from "../../../shared/ui/metric-bar.tsx";
import { MetricCard, MetricGrid } from "../../../shared/ui/metric-card.tsx";
import { METRIC_TONE } from "../../../shared/ui/metric-constants.ts";
import { metricParts } from "../../../shared/ui/metric-parts.ts";
import {
  MetricDistribution,
  MetricGauge,
  MetricLegend,
} from "../../../shared/ui/metric-visuals.tsx";
import { usePlanMessages } from "../messages.ts";
import type { PlanOverviewCardsProps } from "./types.ts";

export function PlanOverviewCards({
  data,
  totalPlans,
  executed,
}: PlanOverviewCardsProps) {
  const { format } = useLocale();
  const p = usePlanMessages();
  const count = (value: number) => format.integer.format(value);
  const rate = (value: number | null) =>
    value === null ? EMPTY_VALUE : format.percentage.format(value);
  const awaiting = totalPlans - data.decided;
  const profitable = executed.filter(({ net }) => net > 0).length;
  const flat = executed.filter(({ net }) => net === 0).length;
  const coverage = metricParts(format.integer, [
    [METRIC_TONE.ACCENT, p.reviewed, data.decided],
    [METRIC_TONE.MUTED, p.awaitingDecision, awaiting],
  ]);
  const reviewed = metricParts(format.integer, [
    [METRIC_TONE.POSITIVE, p.confirmedPlans, data.worked],
    [
      METRIC_TONE.NEGATIVE,
      p[PLAN_STATUS.FAILED],
      data.statuses[PLAN_STATUS.FAILED],
    ],
  ]);
  const overall = [
    ...reviewed,
    ...metricParts(format.integer, [
      [METRIC_TONE.MUTED, p.awaitingDecision, awaiting],
    ]),
  ];
  const execution = metricParts(format.integer, [
    [METRIC_TONE.POSITIVE, p.profitablePlans, profitable],
    [METRIC_TONE.NEUTRAL, p.flatPlans, flat],
    [METRIC_TONE.NEGATIVE, p.losingPlans, executed.length - profitable - flat],
  ]);

  return (
    <MetricGrid>
      <MetricCard
        label={p.allPlans}
        value={count(totalPlans)}
        icon="LAYERS"
        tone={METRIC_TONE.NEUTRAL}
        detail={
          totalPlans > 0 && (
            <>
              <span>
                {p.reviewed} · {count(data.decided)}/{count(totalPlans)}
              </span>
              <MetricDistribution parts={coverage} />
            </>
          )
        }
      />
      <MetricCard
        label={p.planWinRate}
        value={rate(data.allPlanWinRate)}
        featured
        icon="TARGET"
        detail={
          totalPlans > 0 &&
          `${count(data.worked)}/${count(totalPlans)} · ${p.confirmedPlans}`
        }
      >
        <MetricGauge parts={overall} semicircle />
      </MetricCard>
      <MetricCard
        label={p.reviewedWinRate}
        value={rate(data.planWinRate)}
        icon="CHECKLIST"
        tone={METRIC_TONE.NEUTRAL}
        detail={data.decided > 0 && <MetricLegend parts={reviewed} />}
      >
        <MetricGauge parts={reviewed} />
      </MetricCard>
      <MetricCard
        label={p.executionWinRate}
        value={rate(executed.length ? profitable / executed.length : null)}
        icon="ACTIVITY"
        detail={executed.length > 0 && <MetricLegend parts={execution} />}
      >
        <MetricGauge parts={execution} semicircle />
      </MetricCard>
      <MetricCard
        label={p.missedWinRate}
        value={rate(data.missedWinRate)}
        icon="CLOCK"
        tone={data.assessedMisses ? METRIC_TONE.CAUTION : METRIC_TONE.NEUTRAL}
        detail={
          data.missedWinRate !== null && (
            <>
              <span>
                {p.assessed} · {count(data.assessedMisses)}
              </span>
              <MetricBar
                segments={[
                  { tone: METRIC_TONE.CAUTION, ratio: data.missedWinRate },
                ]}
              />
            </>
          )
        }
      />
    </MetricGrid>
  );
}
