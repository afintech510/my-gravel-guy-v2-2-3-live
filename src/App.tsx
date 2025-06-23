
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from '@/contexts/CartContext';
import { ZipCodeProvider } from '@/contexts/ZipCodeContext';
import { QuizProvider } from '@/contexts/QuizContext';
import { BlogProvider } from '@/contexts/BlogContext';
import Layout from './components/Layout';
import Index from "./pages/Index";
import Products from "./pages/Products";
import Calculator from "./pages/Calculator";
import CalculatorShop from "./pages/CalculatorShop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import ProductCalculator from "./pages/ProductCalculator";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import StripeTest from "./pages/StripeTest";
import Contact from "./pages/Contact";
import About from "./pages/About";
import DeliveryInfo from "./pages/DeliveryInfo";
import LocationsIndex from "./pages/LocationsIndex";
import LocationPage from "./pages/LocationPage";
import DeliveryMap from "./pages/DeliveryMap";
import BulkLandscapeMaterials from "./pages/BulkLandscapeMaterials";
import FAQ from "./pages/FAQ";
import Reviews from "./pages/Reviews";
import Quiz from "./pages/Quiz";
import Shop from "./pages/Shop";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BlogCategory from "./pages/BlogCategory";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import RouteTracker from "./components/analytics/RouteTracker";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import RefundPolicy from "./pages/legal/RefundPolicy";
import SMSConsent from "./pages/SMSConsent";
import GoogleShopping from "./pages/GoogleShopping";
import Sitemap from "./pages/Sitemap";
import SitemapXML from "./pages/SitemapXML";
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <CartProvider>
          <ZipCodeProvider>
            <QuizProvider>
              <BlogProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <ScrollToTop />
                  <RouteTracker />
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/calculator" element={<Calculator />} />
                      <Route path="/calculator-shop" element={<CalculatorShop />} />
                      <Route path="/product/:productName" element={<ProductDetail />} />
                      <Route path="/product-calculator/:productName" element={<ProductCalculator />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/success" element={<PaymentSuccess />} />
                      <Route path="/stripe-test" element={<StripeTest />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/delivery-info" element={<DeliveryInfo />} />
                      <Route path="/locations" element={<LocationsIndex />} />
                      <Route path="/locations/:region/:state/:city" element={<LocationPage />} />
                      <Route path="/delivery-map" element={<DeliveryMap />} />
                      <Route path="/bulk-landscape-materials" element={<BulkLandscapeMaterials />} />
                      <Route path="/faq" element={<FAQ />} />
                      <Route path="/reviews" element={<Reviews />} />
                      <Route path="/quiz" element={<Quiz />} />
                      <Route path="/shop" element={<Shop />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/blog/:slug" element={<BlogPost />} />
                      <Route path="/blog/category/:categorySlug" element={<BlogCategory />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                      <Route path="/terms-of-service" element={<TermsOfService />} />
                      <Route path="/refund-policy" element={<RefundPolicy />} />
                      <Route path="/sms-consent" element={<SMSConsent />} />
                      <Route path="/google-shopping" element={<GoogleShopping />} />
                      <Route path="/sitemap" element={<Sitemap />} />
                      <Route path="/sitemap.xml" element={<SitemapXML />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                </BrowserRouter>
              </BlogProvider>
            </QuizProvider>
          </ZipCodeProvider>
        </CartProvider>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
