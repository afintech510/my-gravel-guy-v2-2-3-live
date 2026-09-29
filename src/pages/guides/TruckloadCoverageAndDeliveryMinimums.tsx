import { Link } from 'react-router-dom';
import { GuidePageShell } from '@/components/guides/GuidePageShell';
import { ComparisonTable } from '@/components/guides/ComparisonTable';
import { truckloadCoverageAndDeliveryMinimums } from '@/content/guides';

export default function TruckloadCoverageAndDeliveryMinimums() {
  return (
    <GuidePageShell content={truckloadCoverageAndDeliveryMinimums}>
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-[#0F1115]">MyGravelGuy's truck fleet</h2>
        <ComparisonTable
          columns={['Capacity']}
          rows={[
            { label: 'Small dump', cells: ['~7 tons'] },
            { label: 'Tandem/medium dump', cells: ['~14–15 tons'] },
            { label: 'Large / tri-axle', cells: ['~24–28 tons'] },
          ]}
        />
        <p className="text-sm text-[#0F1115]/70">
          Use our{' '}
          <Link to="/gravel-driveways/how-much-gravel" className="underline">
            calculator
          </Link>{' '}
          to find your driveway's tonnage, then order on our{' '}
          <Link to="/dallas-fort-worth/gravel-delivery" className="underline">
            DFW
          </Link>{' '}
          or{' '}
          <Link to="/long-island/gravel-delivery" className="underline">
            Long Island
          </Link>{' '}
          order page for a live, truckload-planned delivered price.
        </p>
      </section>
    </GuidePageShell>
  );
}
