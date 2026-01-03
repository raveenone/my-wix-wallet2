'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState, useRef } from 'react';

export default function ConnectButtonPage() {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [mounted, setMounted] = useState(false);

  // 1. SEND MESSAGE TO WIX WHEN STATUS CHANGES
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (mounted) {
      // 1. STOP if this is the very first load
      if (isFirstRun.current) {
        isFirstRun.current = false;
        return; 
      }

      // 2. Only send message if something actually happened
      // (Optionally: You can limit this to ONLY send if connected === true)
      if (connected) {
         window.parent.postMessage({
            type: 'WALLET_STATUS_CHANGE',
            isConnected: connected,
            address: publicKey ? publicKey.toString() : null
         }, "*");
      }
    }
  }, [connected, publicKey, mounted]);

  useEffect(() => {
    setMounted(true);
    // Force transparency & hide navbars
    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';
  }, []);

  if (!mounted) return null;

  // Button Logic & Styling
  const handleClick = () => {
    if (connected) {
      if (confirm("Disconnect wallet?")) disconnect();
    } else {
      setVisible(true);
    }
  };

  const buttonStyle = "px-6 py-2 rounded-full font-bold text-sm shadow-lg transition-all transform hover:scale-105 " + 
    (connected 
      ? "bg-[#14F195] text-black hover:bg-[#0fd180]" 
      : "bg-black text-white hover:bg-gray-800 border border-gray-600"
    );

  return (
    <div className="flex items-center justify-center w-full h-screen bg-transparent">
      <button onClick={handleClick} className={buttonStyle}>
        {connected ? "Connected" : "Connect Wallet"}
      </button>
      <style jsx global>{`
        .navbar, header, footer { display: none !important; }
        div[class*="flex-col"] > div[class*="navbar"] { display: none !important; }
        body, html, #__next, main { background-color: transparent !important; overflow: hidden !important; }
      `}</style>
    </div>
  );
}