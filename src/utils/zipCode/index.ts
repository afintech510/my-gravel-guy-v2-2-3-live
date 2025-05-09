
// Re-export all functions from the individual modules
export { formatZipCodeData } from './formatter';
export { saveLocationSearch } from './searchLogger';
export { 
  findZipCodeMatch, 
  findZipCodeSuggestions, 
  checkZipCodeTableExists 
} from './finder';
export { 
  getDemoZipCodes,
  getDemoZipCode 
} from './demoData';
