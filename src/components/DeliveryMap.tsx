
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { toast } from '@/components/ui/sonner';
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from '@/integrations/supabase/client';
import { DeliveryLocation, convertToDeliveryLocation } from '@/types/location.types';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZWFzdGVybmxtNTEiLCJhIjoiY205eXpwaXN5MW1kazJrbXc1emF2eHk2ZSJ9.DHFlpCAMAaVuL7jU4m9ugQ';

const DeliveryMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  console.log("DeliveryMap component rendering");

  // Fetch locations from Supabase
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        console.log("Fetching delivery locations from Supabase");
        
        // First try delivery_locations table
        let { data, error } = await supabase
          .from('delivery_locations')
          .select('*');
          
        // If delivery_locations doesn't exist or is empty, try service_zip_codes
        if (error || !data || data.length === 0) {
          console.log("Trying service_zip_codes table instead");
          const { data: zipData, error: zipError } = await supabase
            .from('service_zip_codes')
            .select('*')
            .limit(50); // Limit for performance
            
          if (zipError) {
            console.error("Error fetching from service_zip_codes:", zipError);
            setError("Failed to load delivery locations");
            toast.error("Failed to load delivery locations");
            return;
          }
          
          // Convert zip code data to delivery locations
          const convertedLocations = zipData?.map(convertToDeliveryLocation) || [];
          setLocations(convertedLocations);
        } else {
          console.log(`Fetched ${data.length} delivery locations from Supabase`);
          setLocations(data as DeliveryLocation[]);
        }
      } catch (err) {
        console.error("Unexpected error fetching locations:", err);
        setError("An unexpected error occurred");
        toast.error("Failed to load delivery locations");
      } finally {
        // We'll keep loading true until the map initializes
        if (mapInitialized) {
          setLoading(false);
        }
      }
    };
    
    fetchLocations();
  }, []);

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
        });
        
        // Disable rotation via pinch using the correct property
        if (map.current.touchZoomRotate) {
          map.current.touchZoomRotate.disableRotation();
        }
        
        map.current.on('load', () => {
          setMapInitialized(true);
          setLoading(false);
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

  // Add markers when map is initialized and locations are loaded
  useEffect(() => {
    console.log("Checking for markers", { mapInitialized, locationsCount: locations.length });
    if (!map.current || !mapInitialized || locations.length === 0) return;
    
    console.log(`Adding ${locations.length} markers to map`);
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Create bounds to fit all markers
    const bounds = new mapboxgl.LngLatBounds();
    
    // Add markers for each location
    locations.forEach((location) => {
      // Skip locations without valid coordinates
      if (!location.lat || !location.lng || location.lat === 0 || location.lng === 0) {
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
    
  }, [mapInitialized, locations]);

  return (
    <div className="rounded-lg border shadow-sm overflow-hidden">
      <div className="p-2 bg-gray-50 border-b flex justify-between items-center">
        <div className="text-sm font-medium">
          {loading ? (
            <Skeleton className="h-5 w-64" />
          ) : error ? (
            <span className="text-red-500">Error loading locations</span>
          ) : (
            `Showing ${locations.length} delivery locations`
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
        {error && !loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="text-center p-6 max-w-md">
              <div className="bg-red-100 p-3 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                <span className="text-red-500 text-2xl">!</span>
              </div>
              <h3 className="text-lg font-medium mb-2">Failed to load delivery locations</h3>
              <p className="text-sm text-gray-600 mb-4">
                There was a problem fetching the delivery location data. Please try again later.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        <div ref={mapContainer} className="w-full h-[600px]" />
      </div>
    </div>
  );
};

export default DeliveryMap;
