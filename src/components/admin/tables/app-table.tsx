import { Card } from "@/components/ui/card";

type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
};

type AppTableProps<T> = {
  caption?: string;
  columns: Column<T>[];
  rows: T[];
};

export function AppTable<T>({ caption, columns, rows }: AppTableProps<T>) {
  return (
    <Card className="overflow-hidden rounded-[28px] p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr className="border-b border-[var(--card-border)] bg-[var(--surface-strong)] text-left">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-[var(--card-border)]/60 last:border-b-0">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-sm align-top">
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
