
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { CartProvider } from "./contexts/CartContext";
import { ZipCodeProvider } from "./contexts/ZipCodeContext";
import { BlogProvider } from "./contexts/BlogContext";
import ScrollToTop from "./components/ScrollToTop";
import RouteTracker from "./components/analytics/RouteTracker";
import TopBanner from "./components/TopBanner";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Index from "./pages/Index";
import Products from "./pages/Products";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import LocationPage from "./pages/LocationPage";
import LocationsIndex from "./pages/LocationsIndex";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import Quiz from "./pages/Quiz";
import Calculator from "./pages/Calculator";
import CalculatorShop from "./pages/CalculatorShop";
import ProductCalculator from "./pages/ProductCalculator";
import FAQ from "./pages/FAQ";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import RefundPolicy from "./pages/legal/RefundPolicy";
import DeliveryMap from "./pages/DeliveryMap";
import DeliveryInfo from "./pages/DeliveryInfo";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BlogCategory from "./pages/BlogCategory";
import StripeTest from "./pages/StripeTest";
import Reviews from "./pages/Reviews";
import Dashboard from "./pages/Dashboard";
import { Link } from "react-router-dom";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <ZipCodeProvider>
          <CartProvider>
            <BlogProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <ScrollToTop />
                  <RouteTracker />
                  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
                    <div className="sticky top-0 z-40 w-full">
                      <div className="relative">
                        <TopBanner />
                        <Navbar />
                        {/* Logo floating above banner and navbar */}
                       
                      </div>
                    </div>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/shop" element={<Shop />} />
                      <Route path="/products/:slug" element={<ProductDetail />} />
                      <Route path="/locations" element={<LocationsIndex />} />
                      <Route path="/locations/:slug" element={<LocationPage />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
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
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    <Footer />
                  </div>
                </BrowserRouter>
              </TooltipProvider>
            </BlogProvider>
          </CartProvider>
        </ZipCodeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
