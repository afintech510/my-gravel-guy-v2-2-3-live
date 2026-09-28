import { Link } from 'react-router-dom';
import { GuidePageShell } from '@/components/guides/GuidePageShell';
import { hub, GUIDE_SPOKES } from '@/content/guides';

export default function GravelDrivewayHub() {
  return (
    <GuidePageShell content={hub} schemaType="collection">
      <section>
        <h2 className="mb-4 text-xl font-extrabold text-[#0F1115]">Browse the guides</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {GUIDE_SPOKES.map(spoke => (
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
      </section>
    </GuidePageShell>
  );
}
