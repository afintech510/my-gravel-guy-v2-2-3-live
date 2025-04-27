
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { DeliveryLocation, deliveryLocations } from '@/data/deliveryLocations';
import { toast } from '@/components/ui/sonner';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZWFzdGVybmxtNTEiLCJhIjoiY205eXpwaXN5MW1kazJrbXc1emF2eHk2ZSJ9.DHFlpCAMAaVuL7jU4m9ugQ';

const DeliveryMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapInitialized, setMapInitialized] = useState(false);
  
  console.log("DeliveryMap component rendering");

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
          toast("There was an error loading the map");
        });
      }
    } catch (err) {
      console.error("Error initializing map:", err);
      toast("Failed to initialize map");
    }

    return () => {
      if (map.current) {
        console.log("Cleaning up map instance");
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add markers when map is initialized - optimized for larger dataset
  useEffect(() => {
    console.log("Checking for markers", { mapInitialized, locationCount: deliveryLocations.length });
    if (!map.current || !mapInitialized) return;
    
    console.log(`Adding ${deliveryLocations.length} markers to map`);
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Create bounds to fit all markers
    const bounds = new mapboxgl.LngLatBounds();
    
    // Add markers for each location
    deliveryLocations.forEach((location: DeliveryLocation) => {
      if (!location.lat || !location.lng) {
        console.warn("Skip location with invalid coordinates:", location);
        return;
      }
      
      // Extend bounds with each valid location
      bounds.extend([location.lng, location.lat]);
      
      // Create popup but don't add it to marker until clicked (for performance)
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
    
    // Fit map to markers if we have valid bounds
    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, { 
        padding: 50, 
        maxZoom: 7,
        duration: 1500 // Smoother animation
      });
    }
    
  }, [mapInitialized]);

  return (
    <div className="rounded-lg border shadow-sm overflow-hidden">
      <div className="p-2 bg-gray-50 border-b flex justify-between items-center">
        <div className="text-sm font-medium">
          Showing {deliveryLocations.length} delivery locations
        </div>
      </div>
      <div ref={mapContainer} className="w-full h-[600px]" />
    </div>
  );
};

export default DeliveryMap;
