
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/utils/analytics';

/**
 * Component that tracks page views when routes change
 * To be used within the React Router context
 */
const RouteTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    trackPageView(location.pathname);
  }, [location]);

  return null; // This component doesn't render anything
};

export default RouteTracker;
