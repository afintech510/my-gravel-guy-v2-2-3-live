import { GuidePageShell } from '@/components/guides/GuidePageShell';
import { ComparisonTable } from '@/components/guides/ComparisonTable';
import { DrivewayCostTable } from '@/components/guides/DrivewayCostTable';
import { dallasFortWorth } from '@/content/guides';

export default function DallasFortWorthGuide() {
  return (
    <GuidePageShell content={dallasFortWorth}>
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-[#0F1115]">What DFW yards stock</h2>
        <ComparisonTable
          columns={['Material', 'Why it works for DFW clay']}
          rows={[
            { label: 'Base layer', cells: ['Flex base', 'TxDOT-spec crushed limestone that compacts into a stable, clay-resistant foundation'] },
            { label: 'Top layer', cells: ['#57 crushed limestone', 'Angular, drains well, and stands up to North Texas heat and clay movement'] },
          ]}
        />
        <p className="text-sm text-[#0F1115]/70">
          Expansive clay soil across DFW shrinks in summer and swells after rain, which can crack a driveway's base
          if it isn't compacted deeply enough or given somewhere for water to drain — see our depth and layers guide
          for the full layered build.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-[#0F1115]">Live DFW delivered pricing</h2>
        <DrivewayCostTable metroSlugs={['dallas-fort-worth']} />
      </section>
    </GuidePageShell>
  );
}
