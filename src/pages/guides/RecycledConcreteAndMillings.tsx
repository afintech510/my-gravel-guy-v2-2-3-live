import { Link } from 'react-router-dom';
import { GuidePageShell } from '@/components/guides/GuidePageShell';
import { recycledConcreteAndMillings } from '@/content/guides';

export default function RecycledConcreteAndMillings() {
  return (
    <GuidePageShell content={recycledConcreteAndMillings}>
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-[#0F1115]">Recycled options compared to virgin stone</h2>
        <p className="text-sm text-[#0F1115]/70">
          Recycled concrete aggregate (RCA) is a real, stocked driveway-base material in our Long Island catalog —
          see current pricing on our{' '}
          <Link to="/long-island/gravel-delivery" className="underline">
            Long Island order page
          </Link>
          . For the standard crushed-stone build, see our{' '}
          <Link to="/gravel-driveways/crusher-run-vs-57-vs-flex-base" className="underline">
            crusher run vs #57 vs flex base comparison
          </Link>
          .
        </p>
      </section>
    </GuidePageShell>
  );
}
