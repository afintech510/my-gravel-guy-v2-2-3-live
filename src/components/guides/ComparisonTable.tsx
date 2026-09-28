export interface ComparisonRow {
  label: string;
  cells: string[];
}

/** Generic comparison/data table used for material comparisons and cost tables. */
export function ComparisonTable({
  caption,
  columns,
  rows,
}: {
  caption?: string;
  columns: string[];
  rows: ComparisonRow[];
}) {
  if (rows.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
      {caption && (
        <div className="border-b border-black/10 bg-[#F2F1EA] px-4 py-3">
          <p className="text-sm font-bold text-[#0F1115]">{caption}</p>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[#0F1115]/50">
              <th className="px-4 py-2 font-medium" scope="col" />
              {columns.map(col => (
                <th key={col} className="px-4 py-2 font-medium" scope="col">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.label} className="border-t border-black/5">
                <th className="px-4 py-3 text-left font-semibold text-[#0F1115]" scope="row">
                  {row.label}
                </th>
                {row.cells.map((cell, i) => (
                  <td key={i} className="px-4 py-3 text-[#0F1115]/70">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
