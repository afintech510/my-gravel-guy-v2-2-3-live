import { Link } from 'react-router-dom';
import { GuidePageShell } from '@/components/guides/GuidePageShell';
import { decomposedGraniteDriveways } from '@/content/guides';

export default function DecomposedGraniteDriveways() {
  return (
    <GuidePageShell content={decomposedGraniteDriveways}>
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-[#0F1115]">How DG compares to crushed stone</h2>
        <p className="text-sm text-[#0F1115]/70">
          Decomposed granite compacts into a smoother, more solid-feeling surface than angular crushed stone like
          #57, but that same fine, sand-like structure is what makes unstabilized DG more prone to washing out. See
          our{' '}
          <Link to="/gravel-driveways/best-gravel" className="underline">
            best gravel guide
          </Link>{' '}
          for angular alternatives, or our{' '}
          <Link to="/gravel-driveways/dallas-fort-worth" className="underline">
            DFW guide
          </Link>{' '}
          for materials suited to North Texas clay soil.
        </p>
      </section>
    </GuidePageShell>
  );
}
