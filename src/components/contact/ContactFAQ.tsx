import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'Do you deliver everywhere?',
    answer: 'We source from local suppliers near your project. Coverage depends on material availability and access.',
  },
  {
    question: 'Are you a quarry or trucking company?',
    answer: "No — we're a sourcing and logistics partner that coordinates both.",
  },
  {
    question: 'Can you help estimate material quantities?',
    answer: "Yes. If you're unsure, we'll help you calculate what you need.",
  },
  {
    question: 'How fast do you respond?',
    answer: 'Typically same business day, often faster.',
  },
];

const ContactFAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-16">
      <div className="max-w-[800px] mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="font-montserrat font-extrabold text-2xl lg:text-3xl uppercase text-[#F5F7FA]">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-[#151A22] border border-[rgba(255,255,255,0.1)] rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-medium text-[#F5F7FA]">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-[#BADF24] transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-5 pb-5">
                  <p className="text-[#B7C0CC]">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContactFAQ;
