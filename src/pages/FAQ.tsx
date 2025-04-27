
import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Search } from "lucide-react";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const faqData = {
  "Ordering & Delivery": [
    {
      question: "How do I place an order?",
      answer: "Simply browse our products, select the material and quantity you need, enter your delivery address, and proceed to checkout. We'll handle the rest!"
    },
    {
      question: "Do you deliver on weekends?",
      answer: "Yes, we offer weekend delivery services in most areas. Delivery times may vary based on your location and material availability."
    },
    {
      question: "What's your delivery area?",
      answer: "We deliver to most locations across the United States. Enter your ZIP code on our website to check if we service your area."
    },
    {
      question: "How much notice do you need for delivery?",
      answer: "We recommend placing orders at least 24-48 hours in advance. However, we can often accommodate same-day or next-day delivery requests."
    }
  ],
  "Products & Materials": [
    {
      question: "What type of materials do you offer?",
      answer: "We offer a wide range of materials including various types of gravel, sand, dirt, and base materials. Each product is carefully sourced and quality-checked."
    },
    {
      question: "How much material do I need?",
      answer: "Use our calculator tool to estimate the amount of material needed for your project. Simply enter your project dimensions and we'll help you calculate the quantity."
    },
    {
      question: "What's the difference between your products?",
      answer: "Each product has specific uses and characteristics. For example, crushed gravel is ideal for driveways, while river rock is perfect for landscaping. Check our product descriptions or contact us for guidance."
    },
    {
      question: "Can I mix different materials in one order?",
      answer: "Yes, you can combine different materials in a single order as long as they meet our minimum quantity requirements per material."
    }
  ],
  "Pricing & Payment": [
    {
      question: "How is pricing calculated?",
      answer: "Our pricing includes the cost of materials and delivery. The final price depends on the type and quantity of materials, delivery distance, and any special handling requirements."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, and digital payment methods through our secure payment system."
    },
    {
      question: "Do you offer quantity discounts?",
      answer: "Yes, we offer competitive pricing for bulk orders. Contact our sales team for custom quotes on large quantities."
    },
    {
      question: "What's your cancellation policy?",
      answer: "Orders can be cancelled or modified up to 24 hours before the scheduled delivery time. Please contact our customer service for assistance."
    }
  ]
};

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filterFAQs = () => {
    if (!searchQuery) return faqData;

    const filtered: typeof faqData = {}; // Initialize with empty object but with the correct type
    
    // Now add the properties that match the search
    Object.entries(faqData).forEach(([category, items]) => {
      const filteredItems = items.filter(
        item =>
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filteredItems.length > 0) {
        filtered[category] = filteredItems;
      }
    });
    return filtered;
  };

  const filteredFAQs = filterFAQs();

  return (
    <>
      <Helmet>
        <title>FAQ - Gravel Delivery Services</title>
        <meta name="description" content="Find answers to frequently asked questions about our gravel, sand, and dirt delivery services." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/faq">FAQ</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Hero Section */}
        <div className="bg-muted py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Find answers to common questions about our delivery services, products, and ordering process.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* FAQ Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto space-y-8">
            {Object.entries(filteredFAQs).map(([category, items]) => (
              <div key={category} className="space-y-4">
                <h2 className="text-2xl font-semibold mb-4">{category}</h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {items.map((item, index) => (
                    <AccordionItem key={index} value={`${category}-${index}`}>
                      <AccordionTrigger className="text-left">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="text-center mt-16 py-8 border-t">
            <h3 className="text-xl font-semibold mb-4">Still have questions?</h3>
            <p className="text-muted-foreground mb-6">
              We're here to help. Contact our support team for assistance.
            </p>
            <Button asChild>
              <a href="/contact">Contact Support</a>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FAQ;
