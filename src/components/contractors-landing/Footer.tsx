import React from 'react';

interface FooterProps {
  onGetQuote: () => void;
}

const Footer: React.FC<FooterProps> = ({ onGetQuote }) => {
  return (
    <footer className="bg-[#0F1115] border-t border-[rgba(255,255,255,0.10)] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <span className="text-2xl font-bold text-[#F5F7FA]">My<span className="text-[#BADF24]">Gravel</span>Guy</span>
            <p className="text-[#B7C0CC] mt-4 max-w-md">Aggregate delivery for construction pros. One vendor for gravel, sand, base, and fill—sourced and delivered anywhere in the U.S.</p>
          </div>
          <div>
            <h4 className="text-[#F5F7FA] font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {['Materials', 'How It Works', 'Compare Options'].map((link, i) => (
                <li key={i}><button className="text-[#B7C0CC] hover:text-[#BADF24] transition-colors text-sm">{link}</button></li>
              ))}
              <li><button onClick={onGetQuote} className="bg-[#BADF24] text-[#0F1115] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#a8cb1f] transition-colors">Get a Quote</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[#F5F7FA] font-semibold mb-4">Materials</h4>
            <ul className="space-y-3">
              {['#57 Stone', 'Road Base', 'Mason Sand', 'Fill Dirt'].map((material, i) => (
                <li key={i}><span className="text-[#B7C0CC] text-sm">{material}</span></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-[rgba(255,255,255,0.10)] text-center">
          <p className="text-[#B7C0CC] text-sm">© {new Date().getFullYear()} MyGravelGuy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
