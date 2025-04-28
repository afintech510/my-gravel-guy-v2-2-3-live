
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { toast } from '@/components/ui/sonner';
import { Skeleton } from "@/components/ui/skeleton";
import { deliveryLocations } from '@/data/locations';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZWFzdGVybmxtNTEiLCJhIjoiY205eXpwaXN5MW1kazJrbXc1emF2eHk2ZSJ9.DHFlpCAMAaVuL7jU4m9ugQ';

const DeliveryMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  
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
          zoom: 3,
          dragRotate: false, // Disable rotation
          touchPitch: false, // Disable pitch on mobile
          dragPan: false, // Disable single finger/mouse drag
          touchZoomRotate: true // Enable two finger interactions
        });
        
        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl({
          showCompass: false, // Hide rotation control
          visualizePitch: false
        }), 'top-right');

        // Enable two-finger pan
        map.current.dragPan.enable();
        map.current.touchZoomRotate.enable({
          around: 'center',
          pinchRotate: false // Disable rotation via pinch
        });
        
        map.current.on('load', () => {
          setMapInitialized(true);
          setLoading(false);
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
      setLoading(false);
    }

    return () => {
      if (map.current) {
        console.log("Cleaning up map instance");
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add markers when map is initialized
  useEffect(() => {
    console.log("Checking for markers", { mapInitialized });
    if (!map.current || !mapInitialized) return;
    
    console.log(`Adding ${deliveryLocations.length} markers to map`);
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Create bounds to fit all markers
    const bounds = new mapboxgl.LngLatBounds();
    
    // Add markers for each location
    deliveryLocations.forEach((location) => {
      if (!location.lat || !location.lng) {
        console.warn("Skip location with invalid coordinates:", location);
        return;
      }
      
      // Extend bounds with each valid location
      bounds.extend([location.lng, location.lat]);
      
      // Create popup but don't add it to marker until clicked (for performance)
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <h3 class="font-semibold">${location.product_name || 'Gravel Delivery'}</h3>
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
          {loading ? (
            <Skeleton className="h-5 w-64" />
          ) : (
            `Showing ${deliveryLocations.length} delivery locations`
          )}
        </div>
      </div>
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="text-center">
              <Skeleton className="h-40 w-40 rounded-full mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Loading map data...</p>
            </div>
          </div>
        )}
        <div ref={mapContainer} className="w-full h-[600px]" />
      </div>
    </div>
  );
};

export default DeliveryMap;

