
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Home, 
  Store, 
  Calculator, 
  MapPin, 
  ShoppingCart, 
  BookOpen, 
  HelpCircle, 
  Mail, 
  Star,
  Truck,
  FileText,
  Users,
  Quote,
  Map,
  NotebookPen
} from 'lucide-react';

const SitemapSection = ({ 
  title, 
  links, 
  icon: Icon 
}: { 
  title: string; 
  links: { label: string; href: string; description?: string }[]; 
  icon: React.ComponentType<any>;
}) => (
  <div className="bg-white rounded-lg shadow-sm border p-6">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-primary/10 rounded-lg">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h2 className="text-xl font-semibold">{title}</h2>
    </div>
    <ul className="space-y-2">
      {links.map((link) => (
        <li key={link.href}>
          <Link 
            to={link.href}
            className="block p-2 rounded-md hover:bg-gray-50 transition-colors group"
          >
            <div className="font-medium text-gray-900 group-hover:text-primary">
              {link.label}
            </div>
            {link.description && (
              <div className="text-sm text-gray-600 mt-1">
                {link.description}
              </div>
            )}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const Sitemap = () => {
  const mainPages = [
    { label: 'Home', href: '/', description: 'Welcome to My Gravel Guy' },
    { label: 'About Us', href: '/about', description: 'Learn about our company and mission' },
    { label: 'Contact & Quote', href: '/contact', description: 'Get in touch or request a quote' },
  ];

  const shopPages = [
    { label: 'Shop All Products', href: '/shop', description: 'Browse our complete product catalog' },
    { label: 'Products Overview', href: '/products', description: 'View all available materials' },
    { label: 'Bulk Landscape Materials', href: '/bulk-landscape-materials', description: 'Shop bulk materials for large projects' },
  ];

  const toolsPages = [
    { label: 'Product Calculator', href: '/product-calculator', description: 'Calculate materials needed for your project' },
    { label: 'Material Calculator', href: '/calculator', description: 'Advanced material calculation tool' },
    { label: 'Calculator Shop', href: '/calculator-shop', description: 'Shop while calculating your needs' },
    { label: 'Project Planning Quiz', href: '/quiz', description: 'Get personalized material recommendations' },
  ];

  const locationPages = [
    { label: 'All Locations', href: '/locations', description: 'Find service areas and locations' },
    { label: 'Delivery Map', href: '/delivery-map', description: 'View recent deliveries and service areas' },
    { label: 'Delivery Information', href: '/delivery', description: 'Learn about our delivery process' },
  ];

  const cartPages = [
    { label: 'Shopping Cart', href: '/cart', description: 'Review your selected items' },
    { label: 'Checkout', href: '/checkout', description: 'Complete your order' },
    { label: 'Payment Success', href: '/payment-success', description: 'Order confirmation page' },
  ];

  const infoPages = [
    { label: 'FAQ', href: '/faq', description: 'Frequently asked questions' },
    { label: 'Customer Reviews', href: '/reviews', description: 'See what our customers say' },
    { label: 'Blog', href: '/blog', description: 'Tips, guides, and industry insights' },
  ];

  const legalPages = [
    { label: 'Privacy Policy', href: '/privacy', description: 'How we protect your privacy' },
    { label: 'Terms of Service', href: '/terms', description: 'Terms and conditions' },
    { label: 'Refund Policy', href: '/refund', description: 'Our refund and return policy' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Sitemap | My Gravel Guy</title>
        <meta name="description" content="Find all pages and resources available on My Gravel Guy. Navigate easily through our products, tools, locations, and information pages." />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Site Map</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find everything you need on My Gravel Guy. Browse all our pages, tools, and resources organized by category.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <SitemapSection
            title="Main Pages"
            links={mainPages}
            icon={Home}
          />
          
          <SitemapSection
            title="Shop & Products"
            links={shopPages}
            icon={Store}
          />
          
          <SitemapSection
            title="Tools & Calculators"
            links={toolsPages}
            icon={Calculator}
          />
          
          <SitemapSection
            title="Locations & Delivery"
            links={locationPages}
            icon={MapPin}
          />
          
          <SitemapSection
            title="Shopping Cart"
            links={cartPages}
            icon={ShoppingCart}
          />
          
          <SitemapSection
            title="Information & Help"
            links={infoPages}
            icon={HelpCircle}
          />
          
          <SitemapSection
            title="Legal & Policies"
            links={legalPages}
            icon={FileText}
          />
        </div>

        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h2 className="text-2xl font-semibold mb-4">Need Help?</h2>
            <p className="text-gray-600 mb-6">
              Can't find what you're looking for? We're here to help!
            </p>
            <div className="flex justify-center gap-4">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Mail className="h-4 w-4" />
                Contact Us
              </Link>
              <Link
                to="/faq"
                className="inline-flex items-center gap-2 border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
                View FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sitemap;
