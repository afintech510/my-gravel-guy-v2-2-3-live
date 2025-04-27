
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQuery } from '@tanstack/react-query';
import { DeliveryLocation, getDeliveryLocations } from '@/services/deliveryService';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZWFzdGVybmxtNTEiLCJhIjoiY205eXpwaXN5MW1kazJrbXc1emF2eHk2ZSJ9.DHFlpCAMAaVuL7jU4m9ugQ';

const DeliveryMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapInitialized, setMapInitialized] = useState(false);
  
  console.log("DeliveryMap component rendering");

  const { data: locations, isLoading, error } = useQuery({
    queryKey: ['deliveryLocations'],
    queryFn: getDeliveryLocations
  });

  useEffect(() => {
    console.log("Map container ref:", mapContainer.current);
    if (!mapContainer.current) return;
    
    try {
      console.log("Setting up Mapbox with token");
      mapboxgl.accessToken = MAPBOX_TOKEN;
      
      if (!map.current) {
        console.log("Initializing map...");
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12', 
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
      toast.error("Failed to initialize map");
    }

    return () => {
      // Cleanup
      if (map.current) {
        console.log("Cleaning up map instance");
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add markers when map is initialized and data is loaded
  useEffect(() => {
    console.log("Checking for markers", { mapInitialized, locationsAvailable: !!locations, locationCount: locations?.length });
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

  if (isLoading) {
    console.log("Map data is loading...");
    return <Skeleton className="w-full h-[600px] rounded-lg" />;
  }

  if (error) {
    console.error("Error in delivery map:", error);
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <p className="text-red-700">Error loading delivery locations</p>
      </div>
    );
  }

  console.log("Rendering map with", locations?.length, "locations");
  return (
    <div className="rounded-lg border shadow-sm overflow-hidden">
      <div className="p-2 bg-gray-50 border-b flex justify-between items-center">
        <div className="text-sm font-medium">
          Showing {locations?.length || 0} delivery locations
        </div>
      </div>
      <div ref={mapContainer} className="w-full h-[600px]" />
    </div>
  );
};

export default DeliveryMap;
