
import { ZipCodeData } from '../../services/productTypes';

/**
 * Returns a list of demo ZIP codes for testing
 */
export function getDemoZipCodes(): ZipCodeData[] {
  return [
    {
      zip: "12345",
      lat: 40.7128,
      lng: -74.0060,
      city: "Demo City",
      state_id: "NY",
      state_name: "New York",
      population: 100000,
      density: 10000,
      county_fips: "36061",
      county_name: "Demo County",
      county_names_all: "Demo County",
      county_fips_all: "36061",
      timezone: "America/New_York"
    },
    {
      zip: "67890",
      lat: 34.0522,
      lng: -118.2437,
      city: "Test Town",
      state_id: "CA",
      state_name: "California",
      population: 50000,
      density: 5000,
      county_fips: "06037",
      county_name: "Test County",
      county_names_all: "Test County",
      county_fips_all: "06037",
      timezone: "America/Los_Angeles"
    }
  ];
}

/**
 * Returns a single demo ZIP code
 */
export function getDemoZipCode(): ZipCodeData {
  return getDemoZipCodes()[0];
}
