'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState, useRef } from 'react';

export default function ConnectButtonPage() {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [mounted, setMounted] = useState(false);
  
  // Safety Lock: Ignore "Disconnected" state for the first 2 seconds
  const canReportDisconnect = useRef(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';

    // 1. START SAFETY TIMER (2 Seconds)
    // We will NOT report a "Disconnected" status until this timer finishes.
    // This prevents the app from wiping the Wix session while it is still loading/auto-connecting.
    const timer = setTimeout(() => {
      canReportDisconnect.current = true;
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const walletAddress = publicKey ? publicKey.toString() : null;

    if (connected) {
      // A. IF CONNECTED: Always report immediately (Good news travels fast)
      window.parent.postMessage({
        type: 'WALLET_STATUS_CHANGE',
        isConnected: true,
        address: walletAddress
      }, "*");
      
    } else {
      // B. IF DISCONNECTED: Only report if the Safety Timer has finished
      if (canReportDisconnect.current) {
        window.parent.postMessage({
          type: 'WALLET_STATUS_CHANGE',
          isConnected: false,
          address: null
        }, "*");
      }
    }
  }, [connected, publicKey, mounted]);

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
        body, html, #__next, main { background-color: transparent !important; overflow: hidden !important;  }
      `}</style>
    </div>
  );
}