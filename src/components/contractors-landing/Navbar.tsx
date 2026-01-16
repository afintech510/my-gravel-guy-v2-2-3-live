import React, { useState, useEffect } from 'react';

interface NavbarProps {
  onGetQuote: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onGetQuote }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-[#0F1115]/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-2xl font-bold text-[#F5F7FA]">
              My<span className="text-[#BADF24]">Gravel</span>Guy
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection('materials')}
              className="text-[#B7C0CC] hover:text-[#BADF24] transition-colors font-medium"
            >
              Materials
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-[#B7C0CC] hover:text-[#BADF24] transition-colors font-medium"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('compare')}
              className="text-[#B7C0CC] hover:text-[#BADF24] transition-colors font-medium"
            >
              Compare Options
            </button>
            <button
              onClick={onGetQuote}
              className="bg-[#BADF24] text-[#0F1115] px-5 py-2.5 rounded-lg font-semibold hover:bg-[#a8cb1f] transition-colors"
            >
              Get a Quote
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-[#F5F7FA] p-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0F1115]/95 backdrop-blur-md border-t border-[rgba(255,255,255,0.10)] py-4">
            <div className="flex flex-col space-y-3 px-4">
              <button
                onClick={() => scrollToSection('materials')}
                className="text-[#B7C0CC] hover:text-[#BADF24] transition-colors font-medium text-left py-2"
              >
                Materials
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-[#B7C0CC] hover:text-[#BADF24] transition-colors font-medium text-left py-2"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('compare')}
                className="text-[#B7C0CC] hover:text-[#BADF24] transition-colors font-medium text-left py-2"
              >
                Compare Options
              </button>
              <button
                onClick={onGetQuote}
                className="block w-full bg-[#BADF24] text-[#0F1115] px-5 py-2.5 rounded-lg font-semibold hover:bg-[#a8cb1f] transition-colors text-center"
              >
                Get a Quote
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
