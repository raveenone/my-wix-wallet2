'use client';

import PresaleWidget from '@/components/presale/presale-widget';
import { useEffect } from 'react';

export default function BuyPage() {
  
  // Hide Navbar/Footer for Wix Embed
  useEffect(() => {
    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-transparent py-10">
      <PresaleWidget />
      <style jsx global>{`
        .navbar, header, footer { display: none !important; }
        body, html { background-color: transparent !important; }
      `}</style>
    </div>
  );
}