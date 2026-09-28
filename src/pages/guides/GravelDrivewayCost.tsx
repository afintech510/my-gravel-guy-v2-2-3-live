import { GuidePageShell } from '@/components/guides/GuidePageShell';
import { ComparisonTable } from '@/components/guides/ComparisonTable';
import { DrivewayCostTable } from '@/components/guides/DrivewayCostTable';
import { cost } from '@/content/guides';

export default function GravelDrivewayCost() {
  return (
    <GuidePageShell content={cost}>
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-[#0F1115]">Typical cost ranges</h2>
        <ComparisonTable
          columns={['Typical range']}
          rows={[
            { label: 'Material only (spread, not compacted)', cells: ['$1–$3 per sq ft'] },
            { label: 'Installed (material, delivery, base prep, compaction)', cells: ['$1–$10 per sq ft'] },
            { label: 'Average residential driveway, total project', cells: ['$500–$3,500'] },
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-[#0F1115]">Live delivered-price example</h2>
        <p className="text-sm text-[#0F1115]/70">
          The table below shows what a common 12 by 50 ft single-car driveway costs delivered, computed live from
          our pricing engine for both metros we currently serve.
        </p>
        <DrivewayCostTable />
      </section>
    </GuidePageShell>
  );
}
