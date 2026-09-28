import { GuidePageShell } from '@/components/guides/GuidePageShell';
import { ComparisonTable } from '@/components/guides/ComparisonTable';
import { crusherRunVs57VsFlexBase } from '@/content/guides';

export default function CrusherRunVs57VsFlexBase() {
  return (
    <GuidePageShell content={crusherRunVs57VsFlexBase}>
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-[#0F1115]">Compaction, drainage, and use</h2>
        <ComparisonTable
          columns={['Compaction', 'Drainage', 'Best used as']}
          rows={[
            {
              label: 'Crusher Run',
              cells: ['85–95% of loose volume', 'Slower (stone dust content)', 'Compacted driveway base'],
            },
            {
              label: '#57 Stone',
              cells: ['70–80% of loose volume', 'Faster (clean, angular stone)', 'Driveway top layer'],
            },
            {
              label: 'Flex Base (TX)',
              cells: ['Similar to crusher run', 'Slower (fines content)', 'North Texas standard driveway base'],
            },
          ]}
        />
        <p className="text-sm text-[#0F1115]/70">
          Most driveways combine two of these: a compacted base (crusher run or flex base) topped with a thinner
          layer of #57 stone for the finished driving surface — see our depth and layers guide for the full build.
        </p>
      </section>
    </GuidePageShell>
  );
}
