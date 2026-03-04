
import { useLocation, Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Store } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const hasDispatchedPrerenderEvent = useRef(false);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    // Dispatch prerender-ready to prevent Puppeteer hang on 404 pages
    if (!hasDispatchedPrerenderEvent.current && typeof document !== 'undefined') {
      hasDispatchedPrerenderEvent.current = true;
      document.dispatchEvent(new Event('prerender-ready'));
    }
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <title>Page Not Found | My Gravel Guy</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="text-center max-w-md w-full bg-card rounded-lg shadow-md p-8">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-6">Oops! Page not found</p>
        <p className="text-muted-foreground mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link to="/">Return to Home</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/shop" className="flex items-center justify-center">
              <Store className="mr-2 h-4 w-4" />
              Shop
            </Link>
          </Button>
        </div>
      </div>
    </div>
    </>
  );
};

export default NotFound;
