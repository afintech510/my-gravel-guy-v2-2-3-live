
/**
 * Fetches data from a published Google Sheet in CSV format
 * @param sheetId - The ID of the Google Sheet
 * @param sheetName - The name or gid of the specific sheet to fetch
 * @returns Parsed CSV data as an array of objects
 */
export async function fetchSheetData(sheetId: string, sheetName: string | number) {
  // Use the CSV export URL which is more reliable for programmatic access
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  
  console.log('Fetching sheet data from URL:', url);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    console.log('Raw CSV response length:', csvText.length);
    if (csvText.length < 10) {
      console.error('Empty or very short CSV response:', csvText);
      throw new Error('Empty or invalid CSV response');
    }
    
    const parsed = parseCSV(csvText);
    console.log('Parsed CSV data (first 2 rows):', parsed.slice(0, 2));
    
    return parsed;
  } catch (error) {
    console.error("Error fetching Google Sheet data:", {
      url,
      sheetId,
      sheetName,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Simple CSV parser that converts CSV text to array of objects
 * using the first row as header/keys
 */
function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.split('\n');
  if (lines.length < 2) {
    console.error('Not enough lines in CSV:', lines);
    return [];
  }
  
  try {
    const headers = parseCSVLine(lines[0]);
    
    return lines.slice(1).map((line, index) => {
      if (!line.trim()) {
        console.log(`Skipping empty line at index ${index + 1}`);
        return {} as Record<string, string>;
      }
      
      const values = parseCSVLine(line);
      const obj: Record<string, string> = {};
      
      headers.forEach((header, i) => {
        obj[header.trim()] = values[i] ? values[i].trim() : '';
      });
      
      return obj;
    }).filter(obj => Object.keys(obj).length > 0);
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return [];
  }
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  // Handle empty lines
  if (!line || !line.trim()) {
    return [];
  }
  
  const result: string[] = [];
  let startPos = 0;
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes;
    } else if (line[i] === ',' && !inQuotes) {
      let value = line.substring(startPos, i);
      // Remove surrounding quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      result.push(value.trim());
      startPos = i + 1;
    }
  }
  
  // Add the last value
  let value = line.substring(startPos);
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.substring(1, value.length - 1);
  }
  result.push(value.trim());
  
  return result;
}
