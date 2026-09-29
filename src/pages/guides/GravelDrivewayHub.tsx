import { Link } from 'react-router-dom';
import { GuidePageShell } from '@/components/guides/GuidePageShell';
import { hub, GUIDE_GROUPS } from '@/content/guides';

export default function GravelDrivewayHub() {
  return (
    <GuidePageShell content={hub} schemaType="collection">
      <section>
        <h2 className="mb-4 text-xl font-extrabold text-[#0F1115]">Browse the guides</h2>
        <div className="space-y-8">
          {GUIDE_GROUPS.map(group => (
            <div key={group.name}>
              <p className="mb-3 text-sm font-bold uppercase tracking-wide text-[#0F1115]/50">{group.name}</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {group.spokes.map(spoke => (
                  <Link
                    key={spoke.path}
                    to={spoke.path}
                    className="rounded-xl border border-black/10 bg-white p-4 transition-colors hover:border-black/20"
                  >
                    <p className="font-bold text-[#0F1115]">{spoke.navLabel}</p>
                    <p className="mt-1 text-sm text-[#0F1115]/70">{spoke.h1}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-black/10 bg-white p-5">
        <p className="font-bold text-[#0F1115]">Gravel Driveway Cost Index</p>
        <p className="mt-1 text-sm text-[#0F1115]/70">
          Real delivered gravel pricing by metro and material, sourced from MyGravelGuy's own pricing engine and
          Eastern LM's Long Island delivery history.
        </p>
        <Link
          to="/gravel-driveways/cost-index"
          className="mt-3 inline-block text-sm font-bold text-[#0F1115] underline"
        >
          View the Cost Index
        </Link>
      </section>
    </GuidePageShell>
  );
}
