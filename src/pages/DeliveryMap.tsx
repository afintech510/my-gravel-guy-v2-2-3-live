
import DeliveryMap from '@/components/DeliveryMap';
import { Helmet } from 'react-helmet';

const DeliveryMapPage = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>Recent Delivery Locations | My Gravel Guy</title>
      </Helmet>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Recent Delivery Locations</h1>
        <p className="text-gray-600">
          View our recent successful deliveries across the United States. Each marker represents
          a location where we've delivered gravel, sand, or dirt.
        </p>
      </div>
      <DeliveryMap />
    </div>
  );
};

export default DeliveryMapPage;
