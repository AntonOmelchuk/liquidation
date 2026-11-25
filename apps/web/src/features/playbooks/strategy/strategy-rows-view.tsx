import { useStrategyMessages } from "./messages.ts";
import type { StrategyRowsViewProps } from "./types.ts";

export function StrategyRowsView({
  rows,
  extra,
  ordered,
}: StrategyRowsViewProps) {
  const s = useStrategyMessages();
  if (!rows.length) return <p>{s.empty}</p>;
  const list = rows.map(({ id, label, detail }, index) => (
    <li key={id}>
      <strong>{label}</strong>
      {detail && <p className="record-prose">{detail}</p>}
      {extra?.(index)}
    </li>
  ));
  return ordered ? (
    <ol className="strategy-read-list">{list}</ol>
  ) : (
    <ul className="strategy-read-list">{list}</ul>
  );
}
