import { GuidePageShell } from '@/components/guides/GuidePageShell';
import { ComparisonTable } from '@/components/guides/ComparisonTable';
import { depthAndLayers } from '@/content/guides';

export default function DepthAndLayers() {
  return (
    <GuidePageShell content={depthAndLayers}>
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-[#0F1115]">Layer-by-layer depth guide</h2>
        <ComparisonTable
          columns={['Typical depth', 'Material', 'Purpose']}
          rows={[
            {
              label: 'Base layer',
              cells: ['4–6 in', 'Crusher run or flex base', 'Load-bearing compacted foundation'],
            },
            {
              label: 'Middle layer (optional)',
              cells: ['2–4 in', 'Medium crushed stone', 'Extra stability on soft or clay soil'],
            },
            {
              label: 'Top layer',
              cells: ['2–3 in', '#57 stone or similar', 'Finished, driveable surface'],
            },
          ]}
        />
        <p className="text-sm text-[#0F1115]/70">
          A two-layer build (base + top) totals 6 to 9 inches and suits firm, well-drained soil. A full three-layer
          build totals up to 13 inches and is common on soft or clay-heavy soil, including much of North Texas.
        </p>
      </section>
    </GuidePageShell>
  );
}
