
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQuery } from '@tanstack/react-query';
import { DeliveryLocation, getDeliveryLocations } from '@/services/deliveryService';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

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
  const [mapboxToken, setMapboxToken] = useState<string | null>(
    localStorage.getItem('mapbox_token')
  );
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapInitialized, setMapInitialized] = useState(false);

  const { data: locations, isLoading, error } = useQuery({
    queryKey: ['deliveryLocations'],
    queryFn: getDeliveryLocations
  });

  const handleTokenSubmit = (token: string) => {
    localStorage.setItem('mapbox_token', token);
    setMapboxToken(token);
    toast.success("Mapbox token saved");
  };

  useEffect(() => {
    if (!mapboxToken || !mapContainer.current) return;
    
    try {
      mapboxgl.accessToken = mapboxToken;
      
      if (!map.current) {
        console.log("Initializing map...");
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12', // Try different style
          center: [-98.5795, 39.8283], // Center of USA
          zoom: 3
        });
        
        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
        map.current.on('load', () => {
          setMapInitialized(true);
          console.log("Map loaded successfully");
        });
        
        map.current.on('error', (e) => {
          console.error("Map error:", e);
          toast.error("There was an error loading the map");
        });
      }
    } catch (err) {
      console.error("Error initializing map:", err);
      toast.error("Failed to initialize map. Please check your Mapbox token.");
    }

    return () => {
      // Cleanup
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken]);

  // Add markers when map is initialized and data is loaded
  useEffect(() => {
    if (!map.current || !mapInitialized || !locations || locations.length === 0) return;
    
    console.log(`Adding ${locations.length} markers to map`);
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Add markers for each location
    locations.forEach((location: DeliveryLocation) => {
      if (!location.lat || !location.lng) {
        console.warn("Skip location with invalid coordinates:", location);
        return;
      }
      
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <h3 class="font-semibold">${location.product_name || 'Unknown Product'}</h3>
          <p>${location.city || 'Unknown City'}, ${location.state || 'Unknown State'}</p>
        </div>
      `);

      const marker = new mapboxgl.Marker({ color: '#3FB1CE' })
        .setLngLat([location.lng, location.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
    
    // Fit map to markers if there are any
    if (locations.length > 0 && markersRef.current.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      
      // Extend bounds with each marker
      markersRef.current.forEach(marker => {
        bounds.extend(marker.getLngLat());
      });
      
      // Fit the map to the bounds with padding
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 10 });
    }
    
  }, [locations, mapInitialized]);

  if (!mapboxToken) {
    return <MapboxTokenInput onTokenSubmit={handleTokenSubmit} />;
  }

  if (isLoading) {
    return <Skeleton className="w-full h-[600px] rounded-lg" />;
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <p className="text-red-700">Error loading delivery locations</p>
        <button 
          className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm"
          onClick={() => setMapboxToken(null)}
        >
          Reset Mapbox Token
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border shadow-sm overflow-hidden">
      <div className="p-2 bg-gray-50 border-b flex justify-between items-center">
        <div className="text-sm font-medium">
          Showing {locations?.length || 0} delivery locations
        </div>
        <button 
          className="text-xs text-gray-500 underline"
          onClick={() => setMapboxToken(null)}
        >
          Change Mapbox token
        </button>
      </div>
      <div ref={mapContainer} className="w-full h-[600px]" />
    </div>
  );
};

export default DeliveryMap;
