/**
 * Test file to verify dateUtils functions work correctly
 * These tests can be run manually to ensure timezone issues are resolved
 */

import { parseLocalDate, formatLocalDate, formatDateForDatabase, isDateOnly } from './dateUtils';

// Manual test function - uncomment and run if needed
export const testDateUtils = () => {
  console.log('=== Testing Date Utils ===');
  
  // Test DATE-only parsing
  const testDate = '2025-07-25';
  const parsed = parseLocalDate(testDate);
  console.log('Original date string:', testDate);
  console.log('Parsed local date:', parsed);
  console.log('Formatted for display:', formatLocalDate(testDate));
  console.log('Formatted for database:', formatDateForDatabase(parsed));
  
  // Test timezone consistency
  console.log('User timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
  console.log('Date shows as:', parsed?.toLocaleDateString());
  
  // Test date-only detection
  console.log('Is date-only format:', isDateOnly(testDate));
  console.log('Is NOT date-only format:', isDateOnly('2025-07-25T10:30:00'));
  
  console.log('=== Date Utils Test Complete ===');
};

// Uncomment to run test:
// testDateUtils();