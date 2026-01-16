import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import HeroSection from "@/components/contractors-landing/HeroSection";
import ProblemSection from "@/components/contractors-landing/ProblemSection";
import SolutionSection from "@/components/contractors-landing/SolutionSection";
import MaterialsSection from "@/components/contractors-landing/MaterialsSection";
import BuiltForSection from "@/components/contractors-landing/BuiltForSection";
import CompareSection from "@/components/contractors-landing/CompareSection";
import CredibilitySection from "@/components/contractors-landing/CredibilitySection";
import FinalCTASection from "@/components/contractors-landing/FinalCTASection";
import QuoteModal from "@/components/contractors-landing/QuoteModal";

const ContractorsAggregateLanding: React.FC = () => {
  const navigate = useNavigate();
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  const openQuoteModal = () => {
    setQuoteModalOpen(true);
  };

  const goToShop = () => {
    navigate('/shop');
  };

  return (
    <>
      <Helmet>
        <title>Aggregate Delivery for Contractors | MyGravelGuy</title>
        <meta
          name="description"
          content="One vendor for gravel, sand, base, and fill—sourced and delivered anywhere in the U.S. Fast turnarounds for construction professionals."
        />
      </Helmet>
      <div className="min-h-screen bg-[#0F1115]">
        <HeroSection onOrderInstantly={goToShop} onGetQuote={openQuoteModal} />
        <ProblemSection />
        <SolutionSection onGetQuote={openQuoteModal} />
        <MaterialsSection />
        <BuiltForSection />
        <CompareSection onGetQuote={openQuoteModal} onOrderInstantly={goToShop} />
        <CredibilitySection />
        <FinalCTASection onGetQuote={openQuoteModal} onOrderInstantly={goToShop} />
      </div>
      <QuoteModal open={quoteModalOpen} onOpenChange={setQuoteModalOpen} />
    </>
  );
};

export default ContractorsAggregateLanding;
