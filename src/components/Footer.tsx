
import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, HelpCircle, BookOpen, Truck, Users, Mail, ShoppingCart, Calculator, NotebookPen, Star, Quote, MapPin, Map } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const FooterSection = ({ title, links }: { title: string, links: { label: string, href: string, icon: React.ReactNode }[] }) => (
  <div className="space-y-4">
    <h3 className="font-semibold text-lg">{title}</h3>
    <ul className="space-y-2">
      {links.map((link) => (
        <li key={link.href}>
          <Link 
            to={link.href}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            {link.icon}
            <span>{link.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const Footer = () => {
  const legalLinks = [
    { label: 'Privacy Policy', href: '/privacy', icon: <FileText className="h-4 w-4" /> },
    { label: 'Terms of Service', href: '/terms', icon: <FileText className="h-4 w-4" /> },
    { label: 'Refund Policy', href: '/refund', icon: <FileText className="h-4 w-4" /> },
  ];

  const helpLinks = [
    { label: 'FAQ', href: '/faq', icon: <HelpCircle className="h-4 w-4" /> },
    { label: 'Blog', href: '/blog', icon: <BookOpen className="h-4 w-4" /> },
    { label: 'Delivery', href: '/delivery', icon: <Truck className="h-4 w-4" /> },
    { label: 'About Us', href: '/about', icon: <Users className="h-4 w-4" /> },
    { label: 'Contact Us', href: '/contact', icon: <Mail className="h-4 w-4" /> },
  ];

  const navLinks = [
    { label: 'Shop', href: '/products', icon: <ShoppingCart className="h-4 w-4" /> },
    { label: 'Locations', href: '/locations', icon: <MapPin className="h-4 w-4" /> },
    { label: 'Calculator', href: '/calculator', icon: <Calculator className="h-4 w-4" /> },
    { label: 'Plan Project', href: '/quiz', icon: <NotebookPen className="h-4 w-4" /> },
    { label: 'Reviews', href: '/reviews', icon: <Star className="h-4 w-4" /> },
    { label: 'Request Quote', href: '/contact', icon: <Quote className="h-4 w-4" /> },
    { label: 'Delivery Map', href: '/delivery-map', icon: <Map className="h-4 w-4" /> },
  ];

  return (
    <footer className="bg-background border-t mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <FooterSection title="Navigation" links={navLinks} />
          <FooterSection title="Help" links={helpLinks} />
          <FooterSection title="Legal" links={legalLinks} />
        </div>
        <Separator className="my-8" />
        <div className="text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Gravel Delivery. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
