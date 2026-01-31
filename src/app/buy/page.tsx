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
    // Outer container: Removed 'min-h-screen' to prevent forcing huge height
    <div className="flex items-start justify-center w-full bg-transparent overflow-visible">
      
      {/* 
         THE SCALING WRAPPER 
         scale-[0.8] = 80% size
         origin-top  = Sticks to the top (doesn't float down)
         my-[-20px]  = Pulls it up slightly if needed
      */}
      <div className="scale-[0.86] origin-top w-full flex justify-center">
        <PresaleWidget />
      </div>

      <style jsx global>{`
        .navbar, header, footer { display: none !important; }
        body, html { 
            background-color: transparent !important; 
            overflow: visible !important; /* Allow content to fit */
        }
      `}</style>
    </div>
  );
}