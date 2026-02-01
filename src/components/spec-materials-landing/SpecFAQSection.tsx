import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const SpecFAQSection: React.FC = () => {
  const faqs = [
    {
      question: 'Can you meet DOT/municipal specs?',
      answer:
        'We source from suppliers commonly used on DOT/municipal work where available, and we\'ll match to your project spec. Send your item and we\'ll confirm.',
    },
    {
      question: 'Do you provide tickets/scale slips?',
      answer:
        'Yes, every load includes delivery tickets and scale slips for documentation.',
    },
    {
      question: 'Can you deliver to multiple sites across states?',
      answer:
        'Yes, we coordinate multi-site deliveries through our nationwide supplier network.',
    },
    {
      question: "What's the minimum tonnage?",
      answer: '20 tons minimum per delivery.',
    },
    {
      question: 'What if the local spec name differs?',
      answer:
        'Regional naming varies (e.g., ABC vs. 304 vs. Item 4). We match to your spec—just tell us what you\'re calling it.',
    },
    {
      question: 'Do you offer after-hours/early AM delivery?',
      answer:
        'Some markets offer early morning or weekend delivery. Select expedite options for availability.',
    },
    {
      question: 'How does expedite work?',
      answer:
        'Request expedite for same/next-day. We\'ll respond within the same business day to confirm availability.',
    },
  ];

  return (
    <section id="faq" className="bg-[#151A22] py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#F5F7FA] mb-4">
            Frequently Asked <span className="text-[#BADF24]">Questions</span>
          </h2>
          <p className="text-lg text-[#B7C0CC]">
            Common questions from project managers and procurement teams.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-[#0F1115] border border-[rgba(255,255,255,0.10)] rounded-xl px-6 data-[state=open]:border-[#BADF24]/30"
            >
              <AccordionTrigger className="text-[#F5F7FA] hover:text-[#BADF24] hover:no-underline py-5 text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-[#B7C0CC] pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default SpecFAQSection;
