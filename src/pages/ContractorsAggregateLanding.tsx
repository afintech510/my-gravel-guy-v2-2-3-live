import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/contractors-landing/Navbar';
import HeroSection from '@/components/contractors-landing/HeroSection';
import ProblemSection from '@/components/contractors-landing/ProblemSection';
import SolutionSection from '@/components/contractors-landing/SolutionSection';
import MaterialsSection from '@/components/contractors-landing/MaterialsSection';
import BuiltForSection from '@/components/contractors-landing/BuiltForSection';
import CompareSection from '@/components/contractors-landing/CompareSection';
import CredibilitySection from '@/components/contractors-landing/CredibilitySection';
import FinalCTASection from '@/components/contractors-landing/FinalCTASection';
import Footer from '@/components/contractors-landing/Footer';

const ContractorsAggregateLanding: React.FC = () => {
  const scrollToQuote = () => {
    const quoteSection = document.getElementById('quote');
    if (quoteSection) {
      quoteSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openOrderModal = () => {
    // For now, scroll to quote form
    scrollToQuote();
  };

  return (
    <>
      <Helmet>
        <title>Aggregate Delivery for Contractors | MyGravelGuy</title>
        <meta name="description" content="One vendor for gravel, sand, base, and fill—sourced and delivered anywhere in the U.S. Fast turnarounds for construction professionals." />
      </Helmet>
      <div className="min-h-screen bg-[#0F1115]">
        <Navbar onGetQuote={scrollToQuote} />
        <HeroSection onOrderInstantly={openOrderModal} />
        <ProblemSection />
        <SolutionSection onGetQuote={scrollToQuote} />
        <MaterialsSection />
        <BuiltForSection />
        <CompareSection onGetQuote={scrollToQuote} onOrderInstantly={openOrderModal} />
        <CredibilitySection />
        <FinalCTASection onGetQuote={scrollToQuote} onOrderInstantly={openOrderModal} />
        <Footer onGetQuote={scrollToQuote} />
      </div>
    </>
  );
};

export default ContractorsAggregateLanding;
