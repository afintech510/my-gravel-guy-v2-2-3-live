import { GuidePageShell } from '@/components/guides/GuidePageShell';
import { ComparisonTable } from '@/components/guides/ComparisonTable';
import { bestGravel } from '@/content/guides';

export default function BestGravel() {
  return (
    <GuidePageShell content={bestGravel}>
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-[#0F1115]">Material comparison</h2>
        <ComparisonTable
          columns={['Compaction', 'Drainage', 'Best used as']}
          rows={[
            {
              label: '#57 Crushed Limestone',
              cells: ['70–80% of loose volume', 'Drains well', 'Driveway top layer'],
            },
            {
              label: 'Crusher Run',
              cells: ['85–95% of loose volume', 'Drains slower', 'Compacted base layer'],
            },
            {
              label: 'Flex Base (TX)',
              cells: ['Similar to crusher run', 'Drains slower', 'Compacted base layer (North Texas standard)'],
            },
            {
              label: 'Pea Gravel',
              cells: ['Poor — stays loose', 'Drains well', 'Walkways, patios (not driveways)'],
            },
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-[#0F1115]">Recommendations by soil type</h2>
        <ComparisonTable
          columns={['Recommendation']}
          rows={[
            {
              label: 'North Texas clay soil (DFW)',
              cells: ['Flex base compacted base layer, #57 crushed limestone top layer — both resist clay swell and shrink.'],
            },
            {
              label: 'Long Island sandy soil',
              cells: [
                'Compacted RCA (recycled concrete aggregate) base with 3/4" bluestone or washed gravel on top — sandy soil already drains well, so the base is mainly for load-bearing stability.',
              ],
            },
          ]}
        />
      </section>
    </GuidePageShell>
  );
}
