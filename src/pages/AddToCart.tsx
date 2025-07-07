import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useZipCode } from '../contexts/ZipCodeContext';
import { getProductById, getProductBySlug } from '../services/products';
import { calculateFinalPrice } from '../services/products/pricingUtils';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const AddToCart = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { setZipCode } = useZipCode();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const processAddToCart = async () => {
      try {
        setLoading(true);
        setError(null);

        // Extract parameters
        const productParam = searchParams.get('product');
        const tonsParam = searchParams.get('tons');
        const zipCodeParam = searchParams.get('zipCode');
        const redirectParam = searchParams.get('redirect');

        if (!productParam) {
          throw new Error('Product parameter is required');
        }

        // Parse tons with minimum of 3
        const tons = Math.max(3, parseInt(tonsParam || '3'));

        // Fetch product - try by ID first, then by slug
        let product;
        try {
          // Check if productParam is a number (ID)
          const productId = parseInt(productParam);
          if (!isNaN(productId)) {
            product = await getProductById(productId);
          }
        } catch (e) {
          // If ID lookup fails, try slug
          console.log('ID lookup failed, trying slug');
        }

        if (!product) {
          try {
            product = await getProductBySlug(productParam);
          } catch (e) {
            throw new Error(`Product not found: ${productParam}`);
          }
        }

        if (!product) {
          throw new Error(`Product not found: ${productParam}`);
        }

        // Set zip code if provided
        if (zipCodeParam) {
          setZipCode(zipCodeParam);
        }

        // Calculate final price if zip code is provided
        let finalPrice = product.price;
        if (zipCodeParam) {
          try {
            const priceDetails = await calculateFinalPrice(product, tons, zipCodeParam);
            finalPrice = priceDetails.pricePerTon;
          } catch (e) {
            console.warn('Failed to calculate zip-based pricing, using base price');
          }
        }

        // Add to cart
        addToCart({
          ...product,
          price: finalPrice,
          tons,
          contactInfo: zipCodeParam ? { 
            zipCode: zipCodeParam,
            name: '',
            email: '',
            phone: ''
          } : undefined
        });

        setSuccess(true);
        
        toast({
          title: "Product Added to Cart",
          description: `${tons} tons of ${product.name} added successfully!`,
        });

        // Redirect after a short delay
        setTimeout(() => {
          const redirectUrl = redirectParam || '/cart';
          navigate(redirectUrl);
        }, 2000);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add product to cart';
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    processAddToCart();
  }, [searchParams, addToCart, setZipCode, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Adding to Cart</h2>
            <p className="text-muted-foreground">Please wait while we add your product...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
            >
              Go to Homepage
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-semibold mb-2">Success!</h2>
            <p className="text-muted-foreground mb-4">Product added to cart successfully!</p>
            <p className="text-sm text-muted-foreground">Redirecting you now...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default AddToCart;