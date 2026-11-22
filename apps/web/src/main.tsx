import { StrictMode, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { createRoot } from "react-dom/client";
import {
  netCents,
  summarize,
  tradeInput,
} from "../../../packages/domain/trade.ts";
import type { Trade } from "../../../packages/domain/trade.ts";
import { InstrumentIcons, InstrumentPicker } from "./instrument-picker.tsx";
import "./style.css";

const money = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const percentage = new Intl.NumberFormat(undefined, {
  style: "percent",
  maximumFractionDigits: 1,
});
const date = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function PerformanceChart({ trades }: { trades: readonly Trade[] }) {
  if (!trades.length) {
    return (
      <div className="chart-empty">
        <strong>No performance data yet</strong>
        <p>Your cumulative P&amp;L will appear after you record a trade.</p>
      </div>
    );
  }

  let balance = 0;
  let low = 0;
  let high = 0;
  const values = [0];
  for (const trade of trades.toSorted(
    (a, b) => Date.parse(a.closedAt) - Date.parse(b.closedAt),
  )) {
    balance += netCents(trade);
    values.push(balance);
    low = Math.min(low, balance);
    high = Math.max(high, balance);
  }
  const range = high - low || 100;
  const y = (value: number) => 10 + ((high - value) / range) * 180;
  const path = values
    .map(
      (value, index) =>
        `${index === 0 ? "M" : "L"}${(index / (values.length - 1)) * 900},${y(value)}`,
    )
    .join(" ");
  return (
    <div className="chart">
      <div className="chart-scale" aria-hidden="true">
        <span>{money.format(high / 100)}</span>
        <span>{money.format(low / 100)}</span>
      </div>
      <svg
        viewBox="0 0 900 200"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Cumulative net P&L ends at ${money.format(balance / 100)}`}
      >
        <defs>
          <linearGradient id="chart-fill" x2="0" y2="1">
            <stop stopColor="currentColor" stopOpacity=".24" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${path} L900,200 L0,200 Z`} fill="url(#chart-fill)" />
        <line
          x1="0"
          x2="900"
          y1={y(0)}
          y2={y(0)}
          className="baseline"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

function App() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [symbol, setSymbol] = useState("");
  const [formError, setFormError] = useState("");
  const [trades, setTrades] = useState<Trade[] | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const metrics = summarize(trades ?? []);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/trades", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<Trade[]>;
      })
      .then(setTrades)
      .catch(() => {
        if (!controller.signal.aborted)
          setError("Could not load the local journal.");
      });
    return () => controller.abort();
  }, [attempt]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const openedAt = new Date(String(data.get("openedAt")));
    const closedAt = new Date(String(data.get("closedAt")));
    const result = tradeInput.safeParse({
      symbol: data.get("symbol"),
      direction: data.get("direction"),
      openedAt: Number.isNaN(openedAt.getTime()) ? "" : openedAt.toISOString(),
      closedAt: Number.isNaN(closedAt.getTime()) ? "" : closedAt.toISOString(),
      profit: Number(data.get("profit")),
      commission: Number(data.get("commission")),
      swap: Number(data.get("swap")),
      risk: data.get("risk") ? Number(data.get("risk")) : null,
      notes: data.get("notes"),
    });
    if (!result.success) {
      setFormError(result.error.issues.map((issue) => issue.message).join(" "));
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const response = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      if (!response.ok) throw new Error();
      const trade: Trade = await response.json();
      setTrades((current) => [trade, ...(current ?? [])]);
      form.reset();
      setSymbol("");
      dialog.current?.close();
    } catch {
      setFormError(
        "Could not save the trade. Your entries are still in the form.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="topbar">
        <a className="brand" href="#" aria-label="Liquidation home">
          <span aria-hidden="true">◈</span> Liquidation
        </a>
        <span className="local">
          <i aria-hidden="true" /> Local journal
        </span>
      </header>
      <main>
        <div className="page-heading">
          <h1>Trading journal</h1>
          <button
            disabled={!trades}
            onClick={() => dialog.current?.showModal()}
          >
            <span aria-hidden="true">＋</span> Record trade
          </button>
        </div>
        <section className="metrics" aria-label="Journal statistics">
          <article>
            <span>Closed trades</span>
            <strong>{trades ? metrics.count : "—"}</strong>
          </article>
          <article>
            <span>Net P&amp;L</span>
            <strong>{trades ? money.format(metrics.net) : "—"}</strong>
          </article>
          <article>
            <span>Win rate</span>
            <strong>
              {metrics.winRate === null
                ? "—"
                : percentage.format(metrics.winRate)}
            </strong>
          </article>
        </section>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {!trades && error && (
          <button
            onClick={() => {
              setError("");
              setAttempt((current) => current + 1);
            }}
          >
            Retry
          </button>
        )}
        <div className="layout">
          <section className="panel">
            <div className="panel-heading">
              <h2>Cumulative net P&amp;L</h2>
              <span>All time</span>
            </div>
            {trades ? (
              <PerformanceChart trades={trades} />
            ) : (
              <p>{error ? "Journal unavailable." : "Loading journal…"}</p>
            )}
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>Closed positions</h2>
              {trades && <span>{trades.length} recorded</span>}
            </div>
            {trades?.length ? (
              <div className="table">
                <table>
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Side</th>
                      <th>Closed</th>
                      <th>Net P&amp;L</th>
                      <th>Result in R</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => {
                      const net = netCents(trade) / 100;
                      return (
                        <tr key={trade.id}>
                          <th scope="row">
                            <span className="instrument-label">
                              <InstrumentIcons symbol={trade.symbol} />
                              {trade.symbol}
                            </span>
                            {trade.notes && <small>{trade.notes}</small>}
                          </th>
                          <td>{trade.direction}</td>
                          <td>{date.format(new Date(trade.closedAt))}</td>
                          <td
                            className={
                              net > 0
                                ? "positive"
                                : net < 0
                                  ? "negative"
                                  : undefined
                            }
                          >
                            {money.format(net)}
                          </td>
                          <td>
                            {trade.risk === null
                              ? "—"
                              : money.format(net / trade.risk)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>
                {trades
                  ? "No trades recorded yet."
                  : error
                    ? "Journal unavailable."
                    : "Loading journal…"}
              </p>
            )}
          </section>
          <dialog
            ref={dialog}
            aria-labelledby="record-title"
            onCancel={(event) => {
              if (saving) event.preventDefault();
            }}
          >
            <div className="panel-heading">
              <h2 id="record-title">Record a closed trade</h2>
              <button
                type="button"
                className="secondary"
                disabled={saving}
                onClick={() => dialog.current?.close()}
              >
                Close
              </button>
            </div>
            {formError && (
              <p className="error" role="alert">
                {formError}
              </p>
            )}
            <form onSubmit={save}>
              <fieldset disabled={saving || !trades}>
                <InstrumentPicker value={symbol} onChange={setSymbol} />
                <label>
                  Side
                  <select name="direction">
                    <option value="long">Long</option>
                    <option value="short">Short</option>
                  </select>
                </label>
                <label>
                  Opened
                  <input type="datetime-local" name="openedAt" required />
                </label>
                <label>
                  Closed
                  <input type="datetime-local" name="closedAt" required />
                </label>
                <label>
                  Gross P&amp;L
                  <input type="number" step="0.01" name="profit" required />
                </label>
                <label>
                  Commission
                  <input
                    type="number"
                    step="0.01"
                    name="commission"
                    defaultValue="0"
                  />
                </label>
                <label>
                  Swap
                  <input
                    type="number"
                    step="0.01"
                    name="swap"
                    defaultValue="0"
                  />
                </label>
                <label>
                  Initial risk
                  <input type="number" step="0.01" min="0.01" name="risk" />
                </label>
                <label className="wide">
                  Notes
                  <textarea name="notes" rows={3} maxLength={4000} />
                </label>
                <button className="wide" type="submit">
                  {saving ? "Saving…" : "Save trade"}
                </button>
              </fieldset>
            </form>
          </dialog>
        </div>
      </main>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
