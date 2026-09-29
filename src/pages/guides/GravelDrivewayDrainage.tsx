import { Link } from 'react-router-dom';
import { GuidePageShell } from '@/components/guides/GuidePageShell';
import { StepList } from '@/components/guides/StepList';
import { gravelDrivewayDrainage } from '@/content/guides';

export default function GravelDrivewayDrainage() {
  return (
    <GuidePageShell content={gravelDrivewayDrainage}>
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-[#0F1115]">Fixing drainage, step by step</h2>
        <StepList steps={gravelDrivewayDrainage.howToSteps ?? []} />
        <p className="text-sm text-[#0F1115]/70">
          Weeds and erosion often show up together with drainage problems — see our{' '}
          <Link to="/gravel-driveways/weeds-and-erosion-control" className="underline">
            weeds and erosion control guide
          </Link>{' '}
          if bare or washed-out patches are also an issue.
        </p>
      </section>
    </GuidePageShell>
  );
}
