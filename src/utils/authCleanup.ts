
/**
 * Comprehensive authentication cleanup utility
 * Clears all Supabase auth tokens and session data
 */
export const forceAuthCleanup = () => {
  // Clear all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Clear from sessionStorage if it exists
  if (typeof sessionStorage !== 'undefined') {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  }
  
  // Clear any other auth-related storage
  localStorage.removeItem('userZipCode');
  localStorage.removeItem('userZipCodeData');
  
  console.log('Auth cleanup completed');
};
