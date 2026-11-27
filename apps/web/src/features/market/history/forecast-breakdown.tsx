import { RELEASE_REACTION_MINUTES } from "@liquidation/domain/market/constants";
import { useId } from "react";
import { EMPTY_VALUE, LOCALES } from "../../../shared/constants.ts";
import { numericTone } from "../../../shared/format.ts";
import { useLocale } from "../../../shared/messages.ts";
import { useMarketMessages } from "../messages.ts";
import { useNewsReactionMessages } from "./messages.ts";
import type { ForecastBreakdownProps } from "./types.ts";

export function ForecastBreakdown({
  groups,
  active,
  onSelect,
  detailId,
}: ForecastBreakdownProps) {
  const m = useNewsReactionMessages();
  const market = useMarketMessages();
  const { language, format } = useLocale();
  const heading = useId();
  const median = new Intl.NumberFormat(LOCALES[language], {
    style: "percent",
    signDisplay: "exceptZero",
    maximumFractionDigits: 3,
  });
  const occurrence = (value: number, count: number) =>
    format.integer.format(value) +
    " (" +
    format.percentage.format(value / count) +
    ")";

  return (
    <section className="news-forecast" aria-labelledby={heading}>
      <h4 id={heading}>{m.forecastBreakdown}</h4>
      <div
        className="table news-reactions-table"
        role="region"
        tabIndex={0}
        aria-labelledby={heading}
      >
        <table>
          <thead>
            <tr>
              <th scope="col">{m.forecastResult}</th>
              <th scope="col">{m.releases}</th>
              {RELEASE_REACTION_MINUTES.map((minutes) => (
                <th scope="col" key={minutes}>
                  {market.afterRelease(minutes)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map(({ result, count, windows }) => (
              <tr key={result} data-selected={active === result || undefined}>
                <th scope="row">
                  <button
                    type="button"
                    disabled={!count}
                    className="news-series-button"
                    aria-controls={detailId}
                    aria-pressed={active === result}
                    onClick={() =>
                      onSelect(active === result ? undefined : result)
                    }
                  >
                    {m.comparisons[result]}
                  </button>
                </th>
                <td>{format.integer.format(count)}</td>
                {windows.map(
                  (
                    { count: measured, up, down, flat, signedMedianMove },
                    index,
                  ) => (
                    <td key={RELEASE_REACTION_MINUTES[index]}>
                      {measured && signedMedianMove !== null ? (
                        <>
                          <div
                            className="news-forecast-directions"
                            title={m.movements}
                          >
                            <span className="positive">
                              ↑ {occurrence(up, measured)}
                            </span>
                            <span className="negative">
                              ↓ {occurrence(down, measured)}
                            </span>
                            <span>= {occurrence(flat, measured)}</span>
                          </div>
                          <small>
                            {m.sample(format.integer.format(measured))} ·{" "}
                            {m.signedMedian}{" "}
                            <span className={numericTone(signedMedianMove)}>
                              {median.format(signedMedianMove)}
                            </span>
                          </small>
                        </>
                      ) : (
                        EMPTY_VALUE
                      )}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="news-reactions-hint">{m.forecastGuide}</p>
    </section>
  );
}
