
import { ZipCodeData } from '../../services/productTypes';

/**
 * Returns demo ZIP codes for testing when database is empty
 */
export const getDemoZipCodes = (): ZipCodeData[] => {
  return [
    {
      zip: '90210',
      city: 'Beverly Hills',
      state_id: 'CA',
      state_name: 'California',
      lat: 34.0901,
      lng: -118.4065,
      timezone: 'America/Los_Angeles',
      population: 20000,
      density: 1000,
      county_fips: '123',
      county_name: 'Los Angeles',
      county_names_all: 'Los Angeles',
      county_fips_all: '123',
    },
    {
      zip: '10001',
      city: 'New York',
      state_id: 'NY',
      state_name: 'New York',
      lat: 40.7128,
      lng: -74.006,
      timezone: 'America/New_York',
      population: 8000000,
      density: 10000,
      county_fips: '456',
      county_name: 'New York',
      county_names_all: 'New York',
      county_fips_all: '456',
    }
  ];
};

/**
 * Gets a single demo ZIP code for testing when database is empty
 */
export const getDemoZipCode = (): ZipCodeData => {
  return {
    zip: '90210',
    city: 'Beverly Hills',
    state_id: 'CA',
    state_name: 'California',
    lat: 34.0901,
    lng: -118.4065,
    timezone: 'America/Los_Angeles',
    population: 20000,
    density: 1000,
    county_fips: '123',
    county_name: 'Los Angeles',
    county_names_all: 'Los Angeles',
    county_fips_all: '123',
  };
};
