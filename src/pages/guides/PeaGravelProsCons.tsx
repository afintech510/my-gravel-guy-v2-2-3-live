import { Link } from 'react-router-dom';
import { GuidePageShell } from '@/components/guides/GuidePageShell';
import { ComparisonTable } from '@/components/guides/ComparisonTable';
import { peaGravelProsCons } from '@/content/guides';

export default function PeaGravelProsCons() {
  return (
    <GuidePageShell content={peaGravelProsCons}>
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-[#0F1115]">Pros and cons</h2>
        <ComparisonTable
          columns={['Pros', 'Cons']}
          rows={[
            {
              label: 'Pea gravel',
              cells: [
                'Attractive, rounded, comfortable underfoot',
                "Shifts and migrates under vehicle traffic, doesn't interlock",
              ],
            },
          ]}
        />
        <p className="text-sm text-[#0F1115]/70">
          For a driveway that sees regular vehicle traffic, see our{' '}
          <Link to="/gravel-driveways/best-gravel" className="underline">
            best gravel for a driveway guide
          </Link>{' '}
          for angular alternatives that interlock better.
        </p>
      </section>
    </GuidePageShell>
  );
}
