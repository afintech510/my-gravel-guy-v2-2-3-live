
import React from 'react';
import TopBanner from './TopBanner';
import Navbar from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navbar />
      <main>
        {children}
      </main>
    </div>
  );
};

export default Layout;
