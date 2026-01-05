import React from 'react';
import { useStore } from '../store';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { lang } = useStore();

  return (
    <div className={`min-h-screen flex flex-col ${lang === 'ar' ? 'font-cairo' : 'font-sans'}`}>
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};