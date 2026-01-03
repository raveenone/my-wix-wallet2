'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState, useRef } from 'react';

export default function ConnectButtonPage() {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [mounted, setMounted] = useState(false);
  
  // Track previous state to detect CHANGES (True->False or False->True)
  const prevConnected = useRef(connected);
  
  // Safety lock: Don't send messages during the first 1 second (Auto-connect window)
  const isReadyToSend = useRef(false);

  useEffect(() => {
    setMounted(true);
    // Force transparency
    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';

    // 1. START SAFETY TIMER
    // We ignore any state changes for the first 800ms to allow Auto-Connect to finish quietly.
    const timer = setTimeout(() => {
      isReadyToSend.current = true;
      
      // OPTIONAL: If we are already connected after the timer, 
      // we can send a "Silent Sync" to update the header without closing.
      // (Requires updating Wix code to handle 'SYNC_ONLY' if you wanted that, 
      // but for now, we just keep the popup open so the user can interact).
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // 2. MONITOR STATUS CHANGES
  useEffect(() => {
    if (!mounted) return;

    // Only proceed if the "Safety Lock" is released
    if (isReadyToSend.current) {
      
      // Check if status actually CHANGED
      const hasChanged = prevConnected.current !== connected;

      if (hasChanged) {
        const walletAddress = publicKey ? publicKey.toString() : null;

        // SEND MESSAGE
        window.parent.postMessage({
          type: 'WALLET_STATUS_CHANGE',
          isConnected: connected,
          address: walletAddress
        }, "*");
      }
    }

    // Update reference for next render
    prevConnected.current = connected;

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
        body, html, #__next, main { background-color: transparent !important; overflow: hidden !important; }
      `}</style>
    </div>
  );
}