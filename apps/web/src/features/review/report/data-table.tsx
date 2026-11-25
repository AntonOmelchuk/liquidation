import type { ReviewTable } from "../types.ts";

export function ReviewDataTable({ label, columns, rows }: ReviewTable) {
  return (
    <div
      className="table review-table"
      role="region"
      tabIndex={0}
      aria-label={label}
    >
      <table aria-label={label}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th scope="col" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ key, cells }) => (
            <tr key={key}>
              <th scope="row">{cells[0]}</th>
              {columns.slice(1).map((column, index) => (
                <td key={column}>{cells[index + 1]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
