import { REVIEW_EXCLUSION_LIMIT } from "@liquidation/domain/review/constants";
import { netCents } from "@liquidation/domain/trades/trade";
import type { ReviewSimulation } from "@liquidation/domain/review/types";
import type {
  ReviewDownload,
  ReviewPresentation,
  ReviewTable,
} from "../types.ts";
import { reviewValues } from "./presentation.ts";

function escaped(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\[/g, "&#91;")
    .replace(/\]/g, "&#93;")
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .replace(/[\r\n]+/g, " ")
    .trim();
}

function tableMarkdown(table: ReviewTable) {
  const row = (cells: readonly string[]) =>
    `| ${cells.map(escaped).join(" | ")} |`;
  return [
    row(table.columns),
    row(table.columns.map(() => "---")),
    ...table.rows.map(({ cells }) => row(cells)),
  ].join("\n");
}

export function reviewMarkdown(
  data: ReviewDownload,
  presentation: ReviewPresentation,
  simulation: ReviewSimulation | null,
) {
  const { messages: m, t, format } = presentation;
  const { amount, count } = reviewValues(presentation);
  const { report, tables, findings, questions, comparison } = data;
  const sections = [
    `# ${m.title}\n\n${m.dateScope} · ${report.query.from} – ${report.query.through} · ${report.query.timeZone}`,
    `## ${m.overview}\n\n${m.open} · ${count(report.openPositions)}\n\n${tableMarkdown(tables.accounts)}`,
    `## ${m.metrics}\n\n${tableMarkdown(tables.metrics)}\n\n${m.drawdownHint}\n\n${m.breakEvenHint}`,
    ...Object.values(tables.groups).map(
      (table) => `## ${table.label}\n\n${tableMarkdown(table)}`,
    ),
    `## ${m.observations}\n\n${findings
      .map(
        ({ title, summary, hypothesis }) =>
          `- **${escaped(title)}** · ${escaped(summary)}${hypothesis ? ` · ${escaped(hypothesis)}` : ""}`,
      )
      .join("\n")}\n\n${m.smallHint}`,
    `## ${m.followUps}\n\n${questions.map(({ label }) => `- ${escaped(label)}`).join("\n")}`,
  ];
  if (comparison && simulation) {
    const exclusions = simulation.excluded;
    sections.push(
      `## ${m.compared}\n\n${escaped(comparison.label)}\n\n${tableMarkdown(comparison.table)}\n\n${m.excluded} · ${count(exclusions.length)}`,
    );
    if (exclusions.length > 0 && exclusions.length <= REVIEW_EXCLUSION_LIMIT) {
      const entries = exclusions.map(
        (trade) =>
          `- ${escaped(trade.symbol)} · ${t[trade.direction]} · ${format.date.format(new Date(trade.openedAt))} · ${amount(netCents(trade) / 100)}`,
      );
      sections.push(entries.join("\n"));
    }
    sections.push(m.hindsight);
  }
  return sections.join("\n\n") + "\n";
}

export function downloadReview(
  data: ReviewDownload,
  presentation: ReviewPresentation,
  simulation: ReviewSimulation | null,
) {
  const markdown = reviewMarkdown(data, presentation, simulation);
  const link = document.createElement("a");
  const url = URL.createObjectURL(
    new Blob([markdown], { type: "text/markdown;charset=utf-8" }),
  );
  link.href = url;
  link.download = `liquidation-review-${data.report.query.from}-${data.report.query.through}.md`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
