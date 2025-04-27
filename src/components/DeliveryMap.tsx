
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { fetchSheetData } from '@/utils/googleSheets';
import { toast } from '@/components/ui/sonner';
import { Skeleton } from "@/components/ui/skeleton";

// We'll use the same sheet ID that's working for products
const SHEET_ID = "1f-9eFHdoSETcV79k1lkEFTNSZ9ZXCDJqPbRWquiZByI";
const SHEET_NAME = "Locations"; // Make sure this matches your sheet name
const MAPBOX_TOKEN = 'pk.eyJ1IjoiZWFzdGVybmxtNTEiLCJhIjoiY205eXpwaXN5MW1kazJrbXc1emF2eHk2ZSJ9.DHFlpCAMAaVuL7jU4m9ugQ';

export interface DeliveryLocation {
  city: string;
  state: string;
  product_name?: string;
  lat: number;
  lng: number;
  region?: string;
  slug?: string;
  title?: string;
  description?: string;
}

const DeliveryMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  console.log("DeliveryMap component rendering");

  // Fetch location data from Google Sheets
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        console.log("Fetching locations from sheet:", SHEET_ID, SHEET_NAME);
        const data = await fetchSheetData(SHEET_ID, SHEET_NAME);
        
        if (!Array.isArray(data) || data.length === 0) {
          console.error("No location data found or invalid data format");
          setError("No location data found");
          setLoading(false);
          return;
        }
        
        // Transform the data to ensure lat/lng are numbers
        const processedLocations: DeliveryLocation[] = data.map((row: any) => ({
          city: row.city || "Unknown City",
          state: row.state || "Unknown State",
          product_name: row.product_name || "Gravel Delivery",
          lat: parseFloat(row.lat) || 0,
          lng: parseFloat(row.lng) || 0,
          region: row.region || "",
          slug: row.slug || `${row.city?.toLowerCase().replace(/\s+/g, '-')}-${row.state?.toLowerCase()}`,
          title: row.title || `Gravel Delivery in ${row.city || 'Unknown City'}, ${row.state || 'Unknown State'}`,
          description: row.description || `Fast and reliable gravel delivery services in ${row.city || 'Unknown City'}.`
        }));
        
        console.log("Fetched locations:", processedLocations.length);
        setLocations(processedLocations);
      } catch (err) {
        console.error("Error fetching locations:", err);
        setError("Failed to load delivery locations");
        toast("Failed to load delivery locations");
      } finally {
        setLoading(false);
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
    locations.forEach((location: DeliveryLocation) => {
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
    
  }, [mapInitialized, locations]);

  return (
    <div className="rounded-lg border shadow-sm overflow-hidden">
      <div className="p-2 bg-gray-50 border-b flex justify-between items-center">
        <div className="text-sm font-medium">
          {loading ? (
            <Skeleton className="h-5 w-64" />
          ) : error ? (
            <div className="text-red-500">Error loading locations</div>
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
        <div ref={mapContainer} className="w-full h-[600px]" />
      </div>
    </div>
  );
};

export default DeliveryMap;
