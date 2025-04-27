
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQuery } from '@tanstack/react-query';
import { DeliveryLocation, getDeliveryLocations } from '@/services/deliveryService';
import { Skeleton } from '@/components/ui/skeleton';

// Temporary access token input for development
const MapboxTokenInput = ({ onTokenSubmit }: { onTokenSubmit: (token: string) => void }) => {
  const [token, setToken] = useState('');
  
  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <p className="text-sm text-muted-foreground mb-2">
        Please enter your Mapbox public token. You can find this in your Mapbox account dashboard.
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md"
          placeholder="Enter Mapbox token..."
        />
        <button
          onClick={() => onTokenSubmit(token)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Submit
        </button>
      </div>
    </div>
  );
};

const DeliveryMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  const { data: locations, isLoading, error } = useQuery({
    queryKey: ['deliveryLocations'],
    queryFn: getDeliveryLocations
  });

  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || !locations?.length) return;

    mapboxgl.accessToken = mapboxToken;
    
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-98.5795, 39.8283], // Center of USA
        zoom: 3
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      );
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each location
    locations.forEach((location: DeliveryLocation) => {
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <h3 class="font-semibold">${location.product_name}</h3>
          <p>${location.city}, ${location.state}</p>
        </div>
      `);

      const marker = new mapboxgl.Marker()
        .setLngLat([location.lng, location.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, [locations, mapboxToken]);

  if (!mapboxToken) {
    return <MapboxTokenInput onTokenSubmit={setMapboxToken} />;
  }

  if (isLoading) {
    return <Skeleton className="w-full h-[600px] rounded-lg" />;
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <p className="text-red-700">Error loading delivery locations</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border shadow-sm overflow-hidden">
      <div ref={mapContainer} className="w-full h-[600px]" />
    </div>
  );
};

export default DeliveryMap;
