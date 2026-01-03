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
    // FORCE TRANSPARENCY FOR THIS PAGE ONLY
    // ---------------------------------------------------------
    // This overrides the global 'body' background color 
    // just for this specific iframe.
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';
    
    // Optional cleanup: if you ever navigated away, this would reset it
    return () => {
      document.documentElement.style.background = '';
      document.body.style.background = '';
    };
  }, []);

  // Prevent hydration errors
  if (!mounted) return null;

  // Button Styling
  // You can adjust 'bg-black' or 'text-white' here to match your Wix Header
  const buttonStyle = "px-5 py-2 rounded-full font-bold text-sm transition-all duration-200 shadow-md " + 
    (connected 
      ? "bg-[#14F195] hover:bg-[#0fd180] text-black" // Connected (Green)
      : "bg-red hover:bg-gray-800 text-white"      // Disconnected (Black)
    );

  const handleClick = () => {
    if (connected) {
      if (confirm("Disconnect wallet?")) {
        disconnect();
      }
    } else {
      setVisible(true);
    }
  };

  return (
    // The outer container is also transparent
    <div className="flex items-center justify-center min-h-screen bg-transparent">
      <button 
        onClick={handleClick}
        className={buttonStyle}
      >
        {connected ? "Connected" : "Connect Wallet"}
      </button>
    </div>
  );
}