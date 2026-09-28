import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export interface FaqItem {
  question: string;
  answer: string;
}

export function FaqSection({ title = 'Frequently asked questions', faqs }: { title?: string; faqs: FaqItem[] }) {
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto max-w-3xl px-4">
        <h2 className="mb-8 text-center text-2xl font-extrabold text-[#0F1115] md:text-3xl">{title}</h2>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={faq.question} value={`faq-${i}`} className="border-black/10">
              <AccordionTrigger className="text-left font-semibold text-[#0F1115]">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-[#0F1115]/70">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/** JSON-LD payload for a FAQ list — render inside a page's <Helmet><script> block. */
export const faqJsonLd = (faqs: FaqItem[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(item => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
});
