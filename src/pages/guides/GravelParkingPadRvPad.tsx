import { Link } from 'react-router-dom';
import { GuidePageShell } from '@/components/guides/GuidePageShell';
import { gravelParkingPadRvPad } from '@/content/guides';

export default function GravelParkingPadRvPad() {
  return (
    <GuidePageShell content={gravelParkingPadRvPad}>
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-[#0F1115]">Sizing your pad</h2>
        <p className="text-sm text-[#0F1115]/70">
          Use our{' '}
          <Link to="/gravel-driveways/how-much-gravel" className="underline">
            calculator
          </Link>{' '}
          with your pad's actual dimensions and the deeper depth recommended here to get an accurate tonnage and
          live delivered price.
        </p>
      </section>
    </GuidePageShell>
  );
}
