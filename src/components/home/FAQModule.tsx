
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

// Import FAQ data from the FAQ page structure
const faqData = {
  "Ordering & Delivery": [
    {
      question: "How soon can I get the materials delivered?",
      answer: "We recommend placing orders at least 24-48 hours in advance. However, we can often accommodate same-day or next-day delivery requests depending on availability."
    },
    {
      question: "How does the process work?",
      answer: "Simply browse our products, select the material and quantity you need, enter your delivery address, and proceed to checkout. We'll handle sourcing from local suppliers and coordinating delivery."
    },
    {
      question: "Do you deliver to my location?",
      answer: "We deliver to most locations across the United States. Enter your ZIP code on our website to check if we service your area."
    }
  ],
  "Products & Materials": [
    {
      question: "How do I calculate how much material I need?",
      answer: "Use our calculator tool to estimate the amount of material needed for your project. Simply enter your project dimensions and we'll help you calculate the quantity."
    },
    {
      question: "Will the material arrive in a Hello Gravel dump truck?",
      answer: "Materials are delivered by our network of trusted local suppliers using their own delivery vehicles, which may vary by location."
    },
    {
      question: "Can you help me figure out what material I need for my project?",
      answer: "Absolutely! Each product has specific uses and characteristics. Check our product descriptions or contact us for personalized guidance on selecting the right materials."
    }
  ],
  "Pricing & Service": [
    {
      question: "Can I find the same material cheaper somewhere else?",
      answer: "We work with local suppliers to provide competitive pricing. Our prices include both materials and delivery, offering transparent, all-inclusive pricing."
    },
    {
      question: "What if I need more than 40 tons?",
      answer: "We can handle large orders! Contact our sales team for custom quotes on bulk quantities and special pricing for large projects."
    },
    {
      question: "What is the minimum order size?",
      answer: "Minimum order requirements vary by material and location. Most materials have a minimum order to make delivery economical - check individual product pages for details."
    }
  ]
};

const FAQModule = () => {
  // Get a selection of FAQs for the home page (first question from each category)
  const homepageFAQs = [
    {
      question: "How soon can I get the materials delivered?",
      answer: "We recommend placing orders at least 24-48 hours in advance. However, we can often accommodate same-day or next-day delivery requests depending on availability."
    },
    {
      question: "How does the process work?",
      answer: "Simply browse our products, select the material and quantity you need, enter your delivery address, and proceed to checkout. We'll handle sourcing from local suppliers and coordinating delivery."
    },
    {
      question: "How do I calculate how much material I need?",
      answer: "Use our calculator tool to estimate the amount of material needed for your project. Simply enter your project dimensions and we'll help you calculate the quantity."
    },
    {
      question: "Do you deliver to my location?",
      answer: "We deliver to most locations across the United States. Enter your ZIP code on our website to check if we service your area."
    },
    {
      question: "Will the material arrive in a Hello Gravel dump truck?",
      answer: "Materials are delivered by our network of trusted local suppliers using their own delivery vehicles, which may vary by location."
    },
    {
      question: "Can I find the same material cheaper somewhere else?",
      answer: "We work with local suppliers to provide competitive pricing. Our prices include both materials and delivery, offering transparent, all-inclusive pricing."
    },
    {
      question: "What if I need more than 40 tons?",
      answer: "We can handle large orders! Contact our sales team for custom quotes on bulk quantities and special pricing for large projects."
    },
    {
      question: "What is the minimum order size?",
      answer: "Minimum order requirements vary by material and location. Most materials have a minimum order to make delivery economical - check individual product pages for details."
    }
  ];

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get answers to common questions about our delivery services, products, and ordering process.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="space-y-4">
            <Accordion type="single" collapsible className="space-y-2">
              {homepageFAQs.slice(0, 4).map((faq, index) => (
                <AccordionItem key={index} value={`faq-left-${index}`} className="bg-white rounded-lg border shadow-sm">
                  <AccordionTrigger className="text-left px-6 py-4 hover:no-underline">
                    <span className="font-medium text-gray-900">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-gray-600">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          
          <div className="space-y-4">
            <Accordion type="single" collapsible className="space-y-2">
              {homepageFAQs.slice(4, 8).map((faq, index) => (
                <AccordionItem key={index} value={`faq-right-${index}`} className="bg-white rounded-lg border shadow-sm">
                  <AccordionTrigger className="text-left px-6 py-4 hover:no-underline">
                    <span className="font-medium text-gray-900">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-gray-600">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-gray-600 mb-6">
            Still have questions? View our complete FAQ section or contact our support team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild variant="default" size="lg">
              <Link to="/faq">View All FAQs</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/contact">Contact Support</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQModule;
