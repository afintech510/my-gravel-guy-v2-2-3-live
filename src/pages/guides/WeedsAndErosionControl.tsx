import { Link } from 'react-router-dom';
import { GuidePageShell } from '@/components/guides/GuidePageShell';
import { StepList } from '@/components/guides/StepList';
import { weedsAndErosionControl } from '@/content/guides';

export default function WeedsAndErosionControl() {
  return (
    <GuidePageShell content={weedsAndErosionControl}>
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-[#0F1115]">Fixing weeds and erosion, step by step</h2>
        <StepList steps={weedsAndErosionControl.howToSteps ?? []} />
        <p className="text-sm text-[#0F1115]/70">
          If pooling water or a flattened crown is the underlying cause, see our{' '}
          <Link to="/gravel-driveways/gravel-driveway-drainage" className="underline">
            drainage and slope guide
          </Link>
          .
        </p>
      </section>
    </GuidePageShell>
  );
}
