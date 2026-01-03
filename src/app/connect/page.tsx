'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState } from 'react';

export default function ConnectButtonPage() {
  const { connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Force the body to be transparent so the iframe blends in
    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';
  }, []);

  if (!mounted) return null;

  const handleClick = () => {
    if (connected) {
      if (confirm("Disconnect wallet?")) {
        disconnect();
      }
    } else {
      setVisible(true);
    }
  };

  // Button Styling
  const buttonStyle = "px-6 py-2 rounded-full font-bold text-sm shadow-lg transition-all transform hover:scale-105 " + 
    (connected 
      ? "bg-[#14F195] text-black hover:bg-[#0fd180]" 
      : "bg-black text-white hover:bg-gray-800 border border-gray-600"
    );

  return (
    <div className="flex items-center justify-center w-full h-screen bg-transparent">
      
      {/* The Button */}
      <button onClick={handleClick} className={buttonStyle}>
        {connected ? "Connected" : "Connect Wallet"}
      </button>

      {/* 
         THE "NUCLEAR" CSS FIX 
         This style tag hides the layout elements specifically for this page.
      */}
      <style jsx global>{`
        /* Hide the specific class used by the template (DaisyUI) */
        .navbar {
          display: none !important;
        }
        
        /* Hide standard HTML tags just in case */
        header, footer {
          display: none !important;
        }

        /* Hide the top-level layout wrapper padding/margins */
        div[class*="flex-col"] > div[class*="navbar"] {
          display: none !important;
        }

        /* Ensure the background is totally clear */
        body, html, #__next, main {
          background-color: transparent !important;
          overflow: hidden !important; /* Remove scrollbars */
        }
      `}</style>
    </div>
  );
}