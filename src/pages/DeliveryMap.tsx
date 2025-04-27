
import DeliveryMap from '@/components/DeliveryMap';

const DeliveryMapPage = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Recent Delivery Locations</h1>
      <DeliveryMap />
    </div>
  );
};

export default DeliveryMapPage;
