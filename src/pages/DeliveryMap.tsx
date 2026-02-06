
import React from 'react';
import DeliveryMap from '@/components/DeliveryMap';
import { Helmet } from 'react-helmet-async';

const DeliveryMapPage = () => {
  console.log("Rendering DeliveryMapPage");
  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>Recent Delivery Locations | My Gravel Guy</title>
      </Helmet>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Recent Delivery Locations</h1>
        <p className="text-muted-foreground">
          View our recent successful deliveries across the United States. Each marker represents
          a location where we've delivered gravel, sand, or dirt.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Data sourced from our delivery database in real-time.
        </p>
      </div>
      <DeliveryMap />
    </div>
  );
};

export default DeliveryMapPage;
