
import React from 'react';
import TopBanner from './TopBanner';
import Navbar from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-50 w-full">
        <TopBanner />
        <Navbar />
      </div>
      <main>
        {children}
      </main>
    </div>
  );
};

export default Layout;
