
/**
 * Comprehensive authentication cleanup utility
 * Clears all Supabase auth tokens and session data
 */
export const forceAuthCleanup = () => {
  console.log('Starting comprehensive auth cleanup...');
  
  // Clear all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      console.log('Removing localStorage key:', key);
      localStorage.removeItem(key);
    }
  });
  
  // Clear from sessionStorage if it exists
  if (typeof sessionStorage !== 'undefined') {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        console.log('Removing sessionStorage key:', key);
        sessionStorage.removeItem(key);
      }
    });
  }
  
  // Clear any other auth-related storage
  localStorage.removeItem('userZipCode');
  localStorage.removeItem('userZipCodeData');
  
  // Clear any potential stale session data
  const authKeys = [
    'supabase.auth.token',
    'supabase.auth.refresh_token',
    'supabase.auth.session',
    'supabase.auth.user'
  ];
  
  authKeys.forEach(key => {
    localStorage.removeItem(key);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(key);
    }
  });
  
  console.log('Auth cleanup completed');
};

/**
 * Session recovery utility
 * Attempts to recover a valid session or clears invalid data
 */
export const recoverSession = async () => {
  try {
    console.log('Attempting session recovery...');
    
    // Import supabase client
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Try to get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session recovery error:', error);
      forceAuthCleanup();
      return null;
    }
    
    if (session) {
      console.log('Session recovered successfully');
      return session;
    }
    
    console.log('No valid session to recover');
    return null;
  } catch (error) {
    console.error('Session recovery failed:', error);
    forceAuthCleanup();
    return null;
  }
};
