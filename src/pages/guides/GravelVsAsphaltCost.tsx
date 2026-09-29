import { Link } from 'react-router-dom';
import { GuidePageShell } from '@/components/guides/GuidePageShell';
import { ComparisonTable } from '@/components/guides/ComparisonTable';
import { gravelVsAsphaltCost } from '@/content/guides';

export default function GravelVsAsphaltCost() {
  return (
    <GuidePageShell content={gravelVsAsphaltCost}>
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-[#0F1115]">Cost, lifespan, and upkeep side by side</h2>
        <ComparisonTable
          columns={['Installed cost/sq ft', 'Typical lifespan', 'Maintenance']}
          rows={[
            {
              label: 'Gravel',
              cells: ['$1–$10', 'Indefinite with upkeep', 'Regrade + fresh material every 1–3 yrs'],
            },
            {
              label: 'Asphalt',
              cells: ['$7–$13', '15–20 yrs before resurfacing', 'Occasional sealcoating'],
            },
            {
              label: 'Concrete',
              cells: ['$8–$18', '30–40 yrs', 'Occasional sealing, rare cracks'],
            },
          ]}
        />
        <p className="text-sm text-[#0F1115]/70">
          See our <Link to="/gravel-driveways/cost" className="underline">full cost breakdown</Link> for a live
          delivered-price example, or our{' '}
          <Link to="/gravel-driveways/how-long-gravel-driveway-lasts" className="underline">
            lifespan guide
          </Link>{' '}
          for more on what shortens or extends a gravel driveway's life.
        </p>
      </section>
    </GuidePageShell>
  );
}
