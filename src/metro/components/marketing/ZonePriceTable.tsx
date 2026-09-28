import { formatMoney } from '../shared/priceHelpers';

export interface ZonePriceRow {
  label: string;
  unit: 'ton' | 'yd';
  pricePerUnit: number;
  total: number;
  zoneName: string;
}

export function ZonePriceTable({ title, rows, quantity }: { title: string; rows: ZonePriceRow[]; quantity: number }) {
  if (rows.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
      <div className="border-b border-black/10 bg-[#F2F1EA] px-4 py-3">
        <p className="text-sm font-bold text-[#0F1115]">{title}</p>
        <p className="text-xs text-[#0F1115]/60">Delivered price shown for {quantity} units, cheapest zone</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[#0F1115]/50">
            <th className="px-4 py-2 font-medium">Product</th>
            <th className="px-4 py-2 font-medium">Zone</th>
            <th className="px-4 py-2 font-medium">Per {rows[0]?.unit}</th>
            <th className="px-4 py-2 font-medium">Total ({quantity})</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={`${row.label}-${row.zoneName}`} className="border-t border-black/5">
              <td className="px-4 py-3 font-semibold text-[#0F1115]">{row.label}</td>
              <td className="px-4 py-3 text-[#0F1115]/70">{row.zoneName}</td>
              <td className="px-4 py-3 text-[#0F1115]/70">{formatMoney(row.pricePerUnit)}</td>
              <td className="px-4 py-3 font-semibold text-[#0F1115]">{formatMoney(row.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
