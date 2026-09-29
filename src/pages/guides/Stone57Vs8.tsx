import { GuidePageShell } from '@/components/guides/GuidePageShell';
import { ComparisonTable } from '@/components/guides/ComparisonTable';
import { stone57Vs8 } from '@/content/guides';

export default function Stone57Vs8() {
  return (
    <GuidePageShell content={stone57Vs8}>
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-[#0F1115]">#57 vs #8 at a glance</h2>
        <ComparisonTable
          columns={['Size', 'Best use', 'Compaction']}
          rows={[
            { label: '#57 stone', cells: ['~3/4 in', 'Driveway top layer, base', 'Compacts tight, drains well'] },
            { label: '#8 stone', cells: ['3/8–1/2 in', 'Walkways, bedding, top-dressing', 'Shifts more under vehicle weight'] },
          ]}
        />
      </section>
    </GuidePageShell>
  );
}
