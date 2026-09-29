import { Link } from 'react-router-dom';
import { GuidePageShell } from '@/components/guides/GuidePageShell';
import { StepList } from '@/components/guides/StepList';
import { installationSteps } from '@/content/guides';

export default function InstallationSteps() {
  return (
    <GuidePageShell content={installationSteps}>
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-[#0F1115]">Installation steps</h2>
        <StepList steps={installationSteps.howToSteps ?? []} />
        <p className="text-sm text-[#0F1115]/70">
          See our{' '}
          <Link to="/gravel-driveways/depth-and-layers" className="underline">
            depth and layers guide
          </Link>{' '}
          for how much material each step needs, or our{' '}
          <Link to="/gravel-driveways/diy-vs-hire-gravel-delivery" className="underline">
            DIY vs. hire guide
          </Link>{' '}
          to decide whether to tackle this yourself.
        </p>
      </section>
    </GuidePageShell>
  );
}
