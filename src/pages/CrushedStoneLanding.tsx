import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getProductBySlug, getProducts } from '@/services/products';
import { calculateFinalPrice } from '@/services/products/pricingUtils';
import { calculateProductExponentialPrice } from '@/services/products/exponentialPricing';
import { createEnhancedBackup, storeCheckoutBackup } from '@/utils/paymentUtils';
import { formatCoverageText } from '@/utils/coverageCalculator';
import { findZipCodeMatch } from '@/utils/zipCode';
import { LandingCheckoutForm, type LandingCheckoutFormData } from '@/components/landing/LandingCheckoutForm';
import PaymentMethodLogos from '@/components/payment/PaymentMethodLogos';
import LargeOrderContactForm from '@/components/landing/LargeOrderContactForm';
import { useCart } from '@/contexts/CartContext';
import { Product, ZipCodeData } from '@/services/productTypes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Loader2,
  Truck,
  Shield,
  CreditCard,
  AlertCircle,
  CheckCircle,
  ArrowDown,
  ChevronDown,
  MapPin,
  Pencil,
} from 'lucide-react';

// Known slugs for #57 Crushed Stone in the products table
const PRODUCT_SLUGS = ['57-crushed-stone', 'crushed-gravel-57', 'crushed-stone-57'];

async function loadCrushedStoneProduct(): Promise<Product | null> {
  // Try known slugs first
  for (const slug of PRODUCT_SLUGS) {
    try {
      return await getProductBySlug(slug);
    } catch {
      // slug not found, try next
    }
  }
  // Fallback: search all products
  const allProducts = await getProducts();
  return (
    allProducts.find(
      (p) =>
        p.name.toLowerCase().includes('57') &&
        p.name.toLowerCase().includes('crushed')
    ) || null
  );
}

const CrushedStoneLanding = () => {
  const { toast } = useToast();
  const { addToCart } = useCart();

  // Product & pricing state
  const [product, setProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [quantity, setQuantity] = useState(10);
  const [zipCode, setZipCode] = useState('');
  const [zipLocation, setZipLocation] = useState<{ city: string; state: string } | null>(null);
  const [isEditingZip, setIsEditingZip] = useState(true);
  const [pricePerTon, setPricePerTon] = useState<number | null>(null);
  const [totalPrice, setTotalPrice] = useState<number | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  // Checkout state
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Refs
  const pricingSectionRef = useRef<HTMLDivElement>(null);
  const checkoutSectionRef = useRef<HTMLDivElement>(null);

  // Load product on mount
  useEffect(() => {
    loadCrushedStoneProduct()
      .then((p) => {
        setProduct(p);
        setProductLoading(false);
      })
      .catch(() => setProductLoading(false));
  }, []);

  // Dynamic pricing
  useEffect(() => {
    if (!product || quantity < 3) return;

    const updatePrice = async () => {
      setPricingLoading(true);
      try {
        if (zipCode.length >= 5) {
          const pricing = await calculateFinalPrice(product, quantity, zipCode);
          setPricePerTon(pricing.pricePerTon);
          setTotalPrice(pricing.finalPrice);
        } else {
          const result = calculateProductExponentialPrice(product, quantity);
          setPricePerTon(result.pricePerTon);
          setTotalPrice(result.totalPrice);
        }
      } catch {
        // Fallback to base price
        setPricePerTon(product.price);
        setTotalPrice(product.price * quantity);
      }
      setPricingLoading(false);
    };

    updatePrice();
  }, [product, quantity, zipCode]);

  // Look up city/state when ZIP is 5 digits
  const zipInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (zipCode.length === 5) {
      findZipCodeMatch(zipCode).then((data) => {
        if (data) {
          setZipLocation({ city: data.city, state: data.state_id });
          setIsEditingZip(false);
        } else {
          setZipLocation(null);
        }
      });
    } else {
      setZipLocation(null);
    }
  }, [zipCode]);

  // Scroll helpers
  const scrollToPricing = () => {
    pricingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToCheckout = () => {
    setShowCheckoutForm(true);
    setTimeout(() => {
      checkoutSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Send internal notification email
  const sendNotification = async (
    orderId: string,
    formData: LandingCheckoutFormData
  ) => {
    try {
      await supabase.functions.invoke('send-email', {
        body: {
          to: 'order.support@mygravelguy.com',
          subject: `#57 Stone Landing Checkout - ${orderId}`,
          html: `
            <h2>Landing Page Checkout: #57 Crushed Stone</h2>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Product:</strong> ${product?.name || '#57 Crushed Stone'}</p>
            <p><strong>Quantity:</strong> ${quantity} tons</p>
            <p><strong>Total:</strong> $${totalPrice?.toLocaleString() || 'N/A'}</p>
            <hr/>
            <h3>Customer</h3>
            <p>${formData.name} | ${formData.email} | ${formData.phone}</p>
            <h3>Delivery</h3>
            <p>${formData.street}<br/>${formData.city}, ${formData.state} ${formData.zip}</p>
            <p>Date: ${formData.deliveryDate.toLocaleDateString()}</p>
            <p>Time: ${formData.deliveryTimePreference}</p>
            ${formData.deliveryInstructions ? `<p>Instructions: ${formData.deliveryInstructions}</p>` : ''}
          `,
          type: 'internal_notification',
        },
      });
    } catch {
      // Don't block checkout for email failure
    }
  };

  // Checkout handler — calls create-auth-hold for authorization-only payment
  const handleCheckout = async (formData: LandingCheckoutFormData) => {
    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      if (!product || !totalPrice || !pricePerTon) {
        throw new Error('Product or pricing not loaded');
      }

      const orderId = `LANDING57-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Build description with delivery details for the Stripe checkout page
      const descParts: string[] = [];
      descParts.push(`Contact: ${formData.name}`);
      descParts.push(
        `Deliver to: ${formData.street}, ${formData.city}, ${formData.state} ${formData.zip}`
      );
      const delivDate = formData.deliveryDate instanceof Date ? formData.deliveryDate : new Date(formData.deliveryDate);
      descParts.push(`Date: ${delivDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`);
      if (formData.deliveryTimePreference && formData.deliveryTimePreference !== 'anytime') {
        descParts.push(`Time: ${formData.deliveryTimePreference === 'morning' ? 'Morning' : 'Afternoon'}`);
      }

      // Format item for Stripe (same structure as Checkout.tsx)
      const stripeItem = {
        id: product.id,
        name: product.name,
        description: descParts.join(' | ').substring(0, 500),
        price: pricePerTon,
        quantity: quantity,
        image: product.images?.[0] || product.image || '',
        metadata: {
          contactName: formData.name,
          contactPhone: formData.phone,
          contactEmail: formData.email,
          deliveryAddress: JSON.stringify({
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
          }),
          deliveryDate: formData.deliveryDate.toISOString(),
          deliveryTimePreference: formData.deliveryTimePreference,
          deliveryInstructions: formData.deliveryInstructions || '',
          landingPageOrder: 'true',
          productSlug: product.slug,
        },
      };

      // Create backup for fallback verification
      const cartItems = [
        {
          id: product.id,
          name: product.name,
          category: product.category,
          price: pricePerTon,
          tons: quantity,
          quantity: quantity,
          image: product.images?.[0] || product.image || '',
          short_description: product.short_description,
          deliveryDate: formData.deliveryDate,
          deliveryAddress: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
          },
          contactInfo: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          },
          deliveryTimePreference: formData.deliveryTimePreference,
          deliveryInstructions: formData.deliveryInstructions,
        },
      ];

      const orderBackup = createEnhancedBackup(orderId, cartItems, {
        email: formData.email,
        name: formData.name,
      });
      storeCheckoutBackup(orderBackup);

      // Send internal notification
      await sendNotification(orderId, formData);

      // Get auth session (optional — guest checkout supported)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const requestOptions: any = {
        body: JSON.stringify({
          items: [stripeItem],
          orderId,
          depositOption: false,
          cancelUrl: '/57-crushed-stone',
        }),
      };

      if (session?.access_token) {
        requestOptions.headers = {
          Authorization: `Bearer ${session.access_token}`,
        };
      }

      const { data, error } = await supabase.functions.invoke(
        'create-auth-hold',
        requestOptions
      );

      if (error) throw new Error(`Authorization hold error: ${error.message}`);
      if (!data?.url) throw new Error('No checkout URL received');

      // Add item to cart so it's there if user cancels at Stripe
      addToCart({
        ...product,
        price: pricePerTon,
        tons: quantity,
        deliveryDate: formData.deliveryDate,
        deliveryAddress: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
        },
        contactInfo: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
      });

      // Redirect to Stripe hosted checkout
      window.location.href = data.url;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setCheckoutError(msg);
      localStorage.removeItem('checkout-in-progress');
      toast({
        variant: 'destructive',
        title: 'Checkout Error',
        description: msg,
      });
      setIsCheckingOut(false);
    }
  };

  // Loading state
  if (productLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Product not found
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
            <p className="text-muted-foreground">
              Unable to load #57 Crushed Stone. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const productImage =
    product.images?.[0] || product.image || '/placeholder.svg';

  return (
    <>
      <Helmet>
        <title>#57 Crushed Stone Delivery | MyGravelGuy</title>
        <meta
          name="description"
          content="Order #57 crushed stone delivered to your site. Volume discounts, free delivery, and your card is only authorized — never charged until we confirm your order."
        />
        <link rel="canonical" href="https://mygravelguy.com/57-crushed-stone" />
        <meta property="og:title" content="#57 Crushed Stone Delivery | MyGravelGuy" />
        <meta
          property="og:description"
          content="Order #57 crushed stone with free delivery. Pay only after order confirmation."
        />
        <meta property="og:type" content="product" />
        <meta property="og:url" content="https://mygravelguy.com/57-crushed-stone" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* ─── HERO ─── */}
        <section className="bg-gradient-to-b from-primary/10 to-background py-16 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              #57 Crushed Stone
              <span className="block text-primary text-2xl md:text-3xl mt-2">
                Delivered to Your Site
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The most popular aggregate for driveways, drainage, and base material.
              Get instant pricing, free delivery, and your card is only authorized &mdash;
              never charged until we confirm your order.
            </p>

            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                <span>Free Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>Authorization Only</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Volume Discounts</span>
              </div>
            </div>

            <Button size="lg" onClick={scrollToPricing} className="mt-4">
              Get Your Price
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* ─── PRODUCT + PRICING ─── */}
        <section ref={pricingSectionRef} className="py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Product Image */}
              <div>
                <img
                  src={productImage}
                  alt={product.name}
                  className="w-full rounded-lg shadow-md object-cover aspect-[4/3]"
                  loading="lazy"
                />
                {product.short_description && (
                  <p className="mt-4 text-muted-foreground text-sm">
                    {product.short_description}
                  </p>
                )}
              </div>

              {/* Right: Pricing Calculator */}
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <h2 className="text-2xl font-bold">Configure Your Order</h2>

                    {/* Quantity Slider */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">
                          Quantity: {quantity} tons
                        </Label>
                        {product.tonYardRatio && (
                          <span className="text-sm text-muted-foreground italic">
                            {formatCoverageText(quantity, product.tonYardRatio)}
                          </span>
                        )}
                      </div>
                      <Slider
                        value={[quantity]}
                        onValueChange={(v) => setQuantity(v[0])}
                        min={3}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>3 tons (min)</span>
                        <span>100 tons</span>
                      </div>
                    </div>

                    {/* ZIP Code */}
                    <div className="space-y-2">
                      <Label htmlFor="landing-zip" className="font-medium">
                        Delivery ZIP Code
                      </Label>
                      {zipLocation && !isEditingZip ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingZip(true);
                            setTimeout(() => zipInputRef.current?.focus(), 50);
                          }}
                          className="w-full flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-md text-left hover:bg-primary/10 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="font-medium">
                              {zipLocation.city}, {zipLocation.state} {zipCode}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-primary">
                            <Pencil className="h-3 w-3" />
                            <span>Change</span>
                          </div>
                        </button>
                      ) : (
                        <Input
                          ref={zipInputRef}
                          id="landing-zip"
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                          placeholder="Enter ZIP for exact pricing"
                          className="text-lg"
                          maxLength={5}
                        />
                      )}
                    </div>

                    {/* Price Display */}
                    {pricePerTon !== null && totalPrice !== null && (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                        {pricingLoading ? (
                          <div className="flex items-center justify-center py-2">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <span className="ml-2 text-sm text-muted-foreground">
                              Calculating...
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-baseline">
                              <span className="text-sm text-muted-foreground">
                                Price per ton
                              </span>
                              <span className="text-lg font-semibold">
                                ${pricePerTon.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-baseline border-t pt-2">
                              <span className="font-medium">Total</span>
                              <span className="text-2xl font-bold text-primary">
                                ${totalPrice.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between items-baseline text-sm text-muted-foreground">
                              <span>Delivery</span>
                              <span className="font-medium text-primary">FREE</span>
                            </div>
                            {!zipCode && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Enter your ZIP code for exact pricing with area adjustments.
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* CTA */}
                    <Button
                      size="lg"
                      className="w-full"
                      disabled={!pricePerTon || pricingLoading}
                      onClick={scrollToCheckout}
                    >
                      Continue to Checkout
                      <ArrowDown className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* ─── LARGE ORDER INQUIRY ─── */}
        {product && (
          <section className="py-8 px-4">
            <div className="max-w-2xl mx-auto">
              <Card className="border-primary/30">
                <CardContent className="p-6 space-y-4">
                  <div className="text-center space-y-1">
                    <h3 className="text-xl font-semibold">Need more than 100 tons?</h3>
                    <p className="text-sm text-muted-foreground">
                      Get a custom quote for large commercial orders. We'll respond within 2 hours.
                    </p>
                  </div>
                  <LargeOrderContactForm productName={product.name} zipCode={zipCode} />
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* ─── CHECKOUT FORM ─── */}
        {showCheckoutForm && (
          <section ref={checkoutSectionRef} className="py-12 px-4 bg-muted/30">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="lg:col-span-2">
                  {checkoutError && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-destructive">Checkout Error</p>
                        <p className="text-sm text-destructive/80">{checkoutError}</p>
                      </div>
                    </div>
                  )}

                  <LandingCheckoutForm
                    onSubmit={handleCheckout}
                    onCancel={() => {
                      setShowCheckoutForm(false);
                      scrollToPricing();
                    }}
                    isSubmitting={isCheckingOut}
                    initialData={{ zip: zipCode }}
                  />
                </div>

                {/* Order Summary Sidebar */}
                <div className="lg:col-span-1">
                  <div className="sticky top-24 space-y-4">
                    <Card>
                      <CardContent className="p-6 space-y-4">
                        <h3 className="text-lg font-semibold">Order Summary</h3>

                        <div className="flex items-center gap-3">
                          <img
                            src={productImage}
                            alt={product.name}
                            className="w-16 h-16 rounded object-cover"
                            loading="lazy"
                          />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {quantity} tons
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t">
                          <div className="flex justify-between text-sm">
                            <span>
                              {quantity} tons @ ${pricePerTon?.toFixed(2)}/ton
                            </span>
                            <span>${totalPrice?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Delivery</span>
                            <span className="text-primary font-medium">FREE</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Tax</span>
                            <span className="text-primary font-medium">Included</span>
                          </div>
                          <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                            <span>Authorization Hold</span>
                            <span>${totalPrice?.toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Authorization Notice */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium mb-1">Authorization Notice</p>
                          <p className="text-muted-foreground">
                            We will place an authorization hold on your card for the order
                            amount. You will NOT be charged until we confirm your materials
                            and delivery details. The final charge will only occur after
                            your approval.
                          </p>
                        </div>
                      </div>
                    </div>

                    <PaymentMethodLogos />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ─── TRUST & BENEFITS ─── */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">
              Why #57 Crushed Stone?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Driveways & Parking</h3>
                  <p className="text-sm text-muted-foreground">
                    The standard choice for gravel driveways and parking areas.
                    Excellent compaction and drainage.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Drainage Solutions</h3>
                  <p className="text-sm text-muted-foreground">
                    Ideal for French drains, retaining wall backfill, and all
                    drainage applications with excellent water flow.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Base Material</h3>
                  <p className="text-sm text-muted-foreground">
                    Perfect sub-base for patios, walkways, and construction projects.
                    Consistent 3/4" to 1" stone size.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="what-is-57">
                <AccordionTrigger>What is #57 crushed stone?</AccordionTrigger>
                <AccordionContent>
                  #57 stone is a crushed aggregate ranging from 3/4" to 1" in size.
                  It's one of the most versatile and commonly used aggregates for
                  driveways, drainage, base material, and landscaping projects.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="auth-hold">
                <AccordionTrigger>What is an authorization hold?</AccordionTrigger>
                <AccordionContent>
                  An authorization hold verifies your card and reserves the funds,
                  but does NOT charge you. We only capture the payment after we
                  confirm your materials and delivery details with you. If the order
                  is cancelled, the hold is released and you are never charged.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="when-charged">
                <AccordionTrigger>When will I be charged?</AccordionTrigger>
                <AccordionContent>
                  You will only be charged after we confirm your order details,
                  including material availability and delivery scheduling. We'll
                  contact you before capturing the payment. If anything changes, the
                  authorization hold is simply released.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="how-much">
                <AccordionTrigger>How much #57 stone do I need?</AccordionTrigger>
                <AccordionContent>
                  A common rule of thumb: 1 ton of #57 stone covers approximately
                  80-100 square feet at 2 inches deep. For a standard driveway (10'
                  x 50'), you'd need roughly 5-7 tons. Use our quantity slider above
                  to see pricing for your project size.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="delivery">
                <AccordionTrigger>Is delivery really free?</AccordionTrigger>
                <AccordionContent>
                  Yes — delivery is included at no extra cost for all orders. We
                  deliver directly to your site with dump truck delivery. Just
                  provide your address and preferred delivery date when ordering.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="minimum">
                <AccordionTrigger>What is the minimum order?</AccordionTrigger>
                <AccordionContent>
                  Our minimum order is 3 tons. This ensures efficient delivery and
                  the best per-ton pricing for you. Volume discounts are applied
                  automatically as your order size increases.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* ─── BOTTOM CTA ─── */}
        <section className="py-12 px-4">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <h2 className="text-2xl font-bold">Ready to Order?</h2>
            <p className="text-muted-foreground">
              Get your #57 crushed stone delivered with no upfront charge. Your card
              is only authorized until we confirm your order.
            </p>
            <Button size="lg" onClick={scrollToPricing}>
              Get Your Price
              <CreditCard className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>
      </div>
    </>
  );
};

export default CrushedStoneLanding;
