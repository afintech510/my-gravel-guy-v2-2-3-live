import { Link } from 'react-router-dom';
import { GuidePageShell } from '@/components/guides/GuidePageShell';
import { diyVsHireGravelDelivery } from '@/content/guides';

export default function DiyVsHireGravelDelivery() {
  return (
    <GuidePageShell content={diyVsHireGravelDelivery}>
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-[#0F1115]">Deciding which path fits your project</h2>
        <p className="text-sm text-[#0F1115]/70">
          Walk through our{' '}
          <Link to="/gravel-driveways/installation-steps" className="underline">
            step-by-step installation guide
          </Link>{' '}
          to gauge the DIY workload, or our{' '}
          <Link to="/gravel-driveways/gravel-driveway-drainage" className="underline">
            drainage guide
          </Link>{' '}
          if your site is sloped, since that's where hiring help matters most.
        </p>
      </section>
    </GuidePageShell>
  );
}
