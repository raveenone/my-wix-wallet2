'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState } from 'react';

export default function ConnectButtonPage() {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';
  }, []);

  // ---------------------------------------------------------
  // THE ROBUST SYNC LOGIC
  // ---------------------------------------------------------
  useEffect(() => {
    if (!mounted) return;

    // Give Auto-Connect a split second to initialize
    const syncTimer = setTimeout(() => {
      
      const walletAddress = publicKey ? publicKey.toString() : null;

      // Always shout the current status to the parent (Wix)
      // We don't care if it's the first run or the 100th run.
      // The Iframe is the "Boss" of the connection state.
      window.parent.postMessage({
        type: 'WALLET_STATUS_CHANGE',
        isConnected: connected,
        address: walletAddress
      }, "*");

    }, 500); // 500ms delay to let AutoConnect finish

    return () => clearTimeout(syncTimer);
  }, [connected, publicKey, mounted]);

  if (!mounted) return null;

  const handleClick = () => {
    if (connected) {
      if (confirm("Disconnect wallet?")) {
        disconnect();
        // Force an immediate update message on disconnect
        window.parent.postMessage({
           type: 'WALLET_STATUS_CHANGE',
           isConnected: false,
           address: null
        }, "*");
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
      <button onClick={handleClick} className={buttonStyle}>
        {connected ? "Connected" : "Connect Wallet"}
      </button>
      
      {/* Ensure Modal is visible (Z-Index fix) */}
      <style jsx global>{`
        .navbar, header, footer { display: none !important; }
        body, html, #__next, main { background-color: transparent !important; }
        
        /* Fix for Wallet Modal Z-Index inside iframe */
        .wallet-adapter-modal-wrapper { z-index: 9999 !important; }
      `}</style>
    </div>
  );
}