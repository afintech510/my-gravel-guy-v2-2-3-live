
import { ZipCodeData } from '../../services/productTypes';

/**
 * Formats raw database data into ZipCodeData object
 */
export const formatZipCodeData = (rawData: any): ZipCodeData => {
  return {
    zip: rawData.zip,
    lat: Number(rawData.lat) || 0,
    lng: Number(rawData.lng) || 0,
    city: rawData.city,
    state_id: rawData.state_id,
    state_name: rawData.state_name,
    population: Number(rawData.population) || 0,
    density: Number(rawData.density) || 0,
    county_fips: rawData.county_fips,
    county_name: rawData.county_name,
    county_names_all: rawData.county_names_all,
    county_fips_all: rawData.county_fips_all,
    timezone: rawData.timezone
  };
};
