import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export const FAQSection = () => {
  const faqs = [
    {
      question: "Is my $199 deposit refundable?",
      answer: "Yes, absolutely. If you don't like the negotiated price or the confirmed material photos, your deposit is fully refunded within 24 hours."
    },
    {
      question: "Do you deliver nationwide?",
      answer: "Yes — we work with verified local suppliers across all 50 states to ensure fast, reliable delivery to your location."
    },
    {
      question: "How do I get the lowest price?",
      answer: "Pay cash to unlock the lowest wholesale rate. We also offer card payment for convenience, though cash pricing is always our best rate."
    },
    {
      question: "Can you install the gravel?",
      answer: "Yes — we offer professional spreading, grading, and installation services. Get a 15% discount when you bundle installation with your material order."
    },
    {
      question: "How long does delivery take?",
      answer: "Most deliveries are completed within 2-5 business days after your order is confirmed, depending on your location and material availability."
    },
    {
      question: "What if I need to change my order?",
      answer: "You can modify your order anytime before we begin sourcing materials. After sourcing begins, changes may incur additional fees."
    }
  ];

  return (
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about our process
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-background rounded-lg border shadow-sm"
              >
                <AccordionTrigger className="px-6 py-4 text-left font-semibold text-foreground hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};