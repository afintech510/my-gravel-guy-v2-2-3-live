import React, { useState, useEffect } from 'react';

interface SpecStickyCTAProps {
  onScrollToForm: () => void;
}

const SpecStickyCTA: React.FC<SpecStickyCTAProps> = ({ onScrollToForm }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky CTA after scrolling past hero section (~400px)
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0F1115] border-t border-[rgba(255,255,255,0.10)] p-4 shadow-lg">
      <button
        onClick={onScrollToForm}
        className="w-full bg-[#BADF24] text-[#0F1115] py-4 rounded-lg font-bold text-lg hover:bg-[#a8cb1f] transition-all"
      >
        Price & Reserve
      </button>
    </div>
  );
};

export default SpecStickyCTA;
