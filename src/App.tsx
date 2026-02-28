import React, { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "./contexts/CartContext";
import { ZipCodeProvider } from "./contexts/ZipCodeContext";
import { BlogProvider } from "./contexts/BlogContext";
import { useFlashingTitle } from "./hooks/useFlashingTitle";
import { recoverSession } from "./utils/authCleanup";
import ScrollToTop from "./components/ScrollToTop";
import RouteTracker from "./components/analytics/RouteTracker";
import TopBanner from "./components/TopBanner";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Eager-load the homepage for instant first paint
import Index from "./pages/Index";

// Lazy-load all other pages for code splitting
const Products = React.lazy(() => import("./pages/Products"));
const Shop = React.lazy(() => import("./pages/Shop"));
const BulkLandscapeMaterials = React.lazy(() => import("./pages/BulkLandscapeMaterials"));
const ProductDetail = React.lazy(() => import("./pages/ProductDetail"));
const LocationPage = React.lazy(() => import("./pages/LocationPage"));
const LocationsIndex = React.lazy(() => import("./pages/LocationsIndex"));
const About = React.lazy(() => import("./pages/About"));
const Contact = React.lazy(() => import("./pages/Contact"));
const Cart = React.lazy(() => import("./pages/Cart"));
const Checkout = React.lazy(() => import("./pages/Checkout"));
const Chat = React.lazy(() => import("./pages/Chat"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const PaymentSuccess = React.lazy(() => import("./pages/PaymentSuccess"));
const Quiz = React.lazy(() => import("./pages/Quiz"));
const Calculator = React.lazy(() => import("./pages/Calculator"));
const CalculatorShop = React.lazy(() => import("./pages/CalculatorShop"));
const ProductCalculator = React.lazy(() => import("./pages/ProductCalculator"));
const FAQ = React.lazy(() => import("./pages/FAQ"));
const PrivacyPolicy = React.lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfService = React.lazy(() => import("./pages/legal/TermsOfService"));
const RefundPolicy = React.lazy(() => import("./pages/legal/RefundPolicy"));
const DeliveryMap = React.lazy(() => import("./pages/DeliveryMap"));
const DeliveryInfo = React.lazy(() => import("./pages/DeliveryInfo"));
const Blog = React.lazy(() => import("./pages/Blog"));
const BlogPost = React.lazy(() => import("./pages/BlogPost"));
const BlogCategory = React.lazy(() => import("./pages/BlogCategory"));
const StripeTest = React.lazy(() => import("./pages/StripeTest"));
const Reviews = React.lazy(() => import("./pages/Reviews"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const DashboardOrders = React.lazy(() => import("./pages/DashboardOrders"));
const DashboardOrdersNew = React.lazy(() => import("./pages/DashboardOrdersNew"));
const DashboardQuotes = React.lazy(() => import("./pages/DashboardQuotes"));
const DashboardSuppliers = React.lazy(() => import("./pages/DashboardSuppliers"));
const DashboardExpenses = React.lazy(() => import("./pages/DashboardExpenses"));
const DashboardAnalyze = React.lazy(() => import("./pages/DashboardAnalyze"));
const DashboardSupplierQuotes = React.lazy(() => import("./pages/DashboardSupplierQuotes"));
const OrderEdit = React.lazy(() => import("./pages/OrderEdit"));
const MessagingConsole = React.lazy(() => import("./pages/MessagingConsole"));
const Sitemap = React.lazy(() => import("./pages/Sitemap"));
const SitemapXML = React.lazy(() => import("./pages/SitemapXML"));
const SMSConsent = React.lazy(() => import("./pages/SMSConsent"));
const GoogleShopping = React.lazy(() => import("./pages/GoogleShopping"));
const AddToCart = React.lazy(() => import("./pages/AddToCart"));
const QuoteCheckout = React.lazy(() => import("./pages/QuoteCheckout"));
const LandingPage = React.lazy(() => import("./pages/LandingPage"));
const Contractors = React.lazy(() => import("./pages/Contractors"));
const ContractorsAggregateLanding = React.lazy(() => import("./pages/ContractorsAggregateLanding"));
const MarketMaterialPage = React.lazy(() => import("./pages/MarketMaterialPage"));
const ContractorsSpecMaterials = React.lazy(() => import("./pages/ContractorsSpecMaterials"));
const CrushedStoneLanding = React.lazy(() => import("./pages/CrushedStoneLanding"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Loading fallback for lazy-loaded routes
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="animate-pulse text-muted-foreground">Loading...</div>
  </div>
);

function AppContent() {
  const location = useLocation();
  const isDashboardPage = location.pathname.startsWith('/dashboard');

  // Enable flashing title globally across all pages
  useFlashingTitle({
    flashText: '🚛 FREE Delivery Nationwide',
    interval: 2000,
    enabled: true
  });

  React.useEffect(() => {
    const initializeAuth = async () => {
      try {
        await recoverSession();
      } catch (error) {
        console.error('App initialization auth error:', error);
      }
    };

    initializeAuth();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-40 w-full">
        <div className="relative">
          <TopBanner />
          <Navbar />
        </div>
      </div>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/products" element={<Products />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/bulk-landscape-materials" element={<BulkLandscapeMaterials />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/locations" element={<LocationsIndex />} />
          <Route path="/locations/:slug" element={<LocationPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/calculator-shop" element={<CalculatorShop />} />
          <Route path="/product-calculator" element={<ProductCalculator />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/refund" element={<RefundPolicy />} />
          <Route path="/delivery-map" element={<DeliveryMap />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/delivery" element={<DeliveryInfo />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/blog/category/:slug" element={<BlogCategory />} />
          <Route path="/stripe-test" element={<StripeTest />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/orders" element={<DashboardOrders />} />
          <Route path="/dashboard/orders/new" element={<DashboardOrdersNew />} />
          <Route path="/dashboard/orders/edit/:orderId" element={<OrderEdit />} />
          <Route path="/dashboard/quotes" element={<DashboardQuotes />} />
          <Route path="/dashboard/suppliers" element={<DashboardSuppliers />} />
          <Route path="/dashboard/expenses" element={<DashboardExpenses />} />
          <Route path="/dashboard/analyze" element={<DashboardAnalyze />} />
          <Route path="/dashboard/supplier-quotes" element={<DashboardSupplierQuotes />} />
          <Route path="/dashboard/comm" element={<MessagingConsole />} />
          <Route path="/google-shopping" element={<GoogleShopping />} />
          <Route path="/sitemap" element={<Sitemap />} />
          <Route path="/sitemap.xml" element={<SitemapXML />} />
          <Route path="/sms-consent" element={<SMSConsent />} />
          <Route path="/add-to-cart" element={<AddToCart />} />
          <Route path="/quote-checkout/:quoteId" element={<QuoteCheckout />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/contractors" element={<Contractors />} />
          <Route path="/contractors-aggregate-delivery-service" element={<ContractorsAggregateLanding />} />
          <Route path="/contractors-spec-materials" element={<ContractorsSpecMaterials />} />
          <Route path="/57-crushed-stone" element={<CrushedStoneLanding />} />
          <Route path="/markets/:marketSlug/materials/:materialSlug" element={<MarketMaterialPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      {!isDashboardPage && <Footer />}
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" storageKey="mgg-theme" enableSystem disableTransitionOnChange>
          <ZipCodeProvider>
            <CartProvider>
              <BlogProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <ScrollToTop />
                    <RouteTracker />
                    <AppContent />
                  </BrowserRouter>
                </TooltipProvider>
              </BlogProvider>
            </CartProvider>
          </ZipCodeProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
