import { Link } from 'react-router-dom';
import { GuidePageShell } from '@/components/guides/GuidePageShell';
import { howLongGravelDrivewayLasts } from '@/content/guides';

export default function HowLongGravelDrivewayLasts() {
  return (
    <GuidePageShell content={howLongGravelDrivewayLasts}>
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-[#0F1115]">What actually determines lifespan</h2>
        <p className="text-sm text-[#0F1115]/70">
          Unlike asphalt or concrete, a gravel driveway doesn't have a fixed service life — it depends almost
          entirely on base quality, drainage, and maintenance. See our{' '}
          <Link to="/gravel-driveways/maintenance" className="underline">
            maintenance guide
          </Link>{' '}
          for the upkeep routine, and our{' '}
          <Link to="/gravel-driveways/gravel-driveway-drainage" className="underline">
            drainage guide
          </Link>{' '}
          if pooling or erosion is cutting your driveway's life short.
        </p>
      </section>
    </GuidePageShell>
  );
}
