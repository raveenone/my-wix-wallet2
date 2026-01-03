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
    
    // ---------------------------------------------------------
    // 1. MAKE BACKGROUND TRANSPARENT
    // ---------------------------------------------------------
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';

    // ---------------------------------------------------------
    // 2. HIDE THE HEADER / NAVBAR
    // ---------------------------------------------------------
    // The template usually gives the header a class of 'navbar'
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      (navbar as HTMLElement).style.display = 'none';
    }
    
    // Also hide the footer just in case
    const footer = document.querySelector('footer');
    if (footer) {
      (footer as HTMLElement).style.display = 'none';
    }

    return () => {
      // Optional cleanup if you navigated away (unlikely in iframe)
      document.documentElement.style.background = '';
      document.body.style.background = '';
      if (navbar) (navbar as HTMLElement).style.display = '';
    };
  }, []);

  if (!mounted) return null;

  // Button Logic
  const handleClick = () => {
    if (connected) {
      if (confirm("Disconnect wallet?")) {
        disconnect();
      }
    } else {
      setVisible(true);
    }
  };

  // Button Styling (Matches the black/green theme)
  const buttonStyle = "px-6 py-2 rounded-full font-bold text-sm shadow-lg transition-all transform hover:scale-105 " + 
    (connected 
      ? "bg-[#14F195] text-black hover:bg-[#0fd180]" 
      : "bg-black text-white hover:bg-gray-800 border border-gray-600"
    );

  return (
    <div className="flex items-center justify-center h-screen w-screen bg-transparent overflow-hidden">
      <button onClick={handleClick} className={buttonStyle}>
        {connected ? "Connected" : "Connect Wallet"}
      </button>
    </div>
  );
}