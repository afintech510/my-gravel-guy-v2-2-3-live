
import { fetchSheetData } from "../utils/googleSheets";

export interface DeliveryLocation {
  product_name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

const SHEET_ID = "1f-9eFHdoSETcV79k1lkEFTNSZ9ZXCDJqPbRWquiZByI";
const SHEET_NAME = "SuccessfulDeliveries";
const MAX_LOCATIONS = 200;

export async function getDeliveryLocations(): Promise<DeliveryLocation[]> {
  try {
    const data = await fetchSheetData(SHEET_ID, SHEET_NAME);
    return data
      .slice(0, MAX_LOCATIONS)
      .map(row => ({
        product_name: row.product_name || 'Unknown Product',
        city: row.city || 'Unknown City',
        state: row.state || 'Unknown State',
        lat: parseFloat(row.lat) || 0,
        lng: parseFloat(row.lng) || 0
      }));
  } catch (error) {
    console.error('Error fetching delivery locations:', error);
    throw error;
  }
}
