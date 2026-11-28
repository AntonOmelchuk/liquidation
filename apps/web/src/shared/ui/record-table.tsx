import type { ReactNode } from "react";
import { EMPTY_VALUE } from "../constants.ts";
import type { RecordTableProps } from "./types.ts";
import "./record-table.css";

export function RecordTable({ label, children }: RecordTableProps) {
  return (
    <div
      className="table record-table"
      role="region"
      aria-label={label}
      tabIndex={0}
    >
      <table aria-label={label}>{children}</table>
    </div>
  );
}

export function TableExcerpt({ text }: { text?: string }) {
  const value = text?.replace(/\s+/g, " ").trim();
  return (
    <span className="record-table-excerpt" title={value}>
      {value || EMPTY_VALUE}
    </span>
  );
}

export function TableActions({ children }: { children: ReactNode }) {
  return (
    <td className="record-table-actions">
      <div>{children}</div>
    </td>
  );
}
