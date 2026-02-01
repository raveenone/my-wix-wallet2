'use client'

import { WalletError } from '@solana/wallet-adapter-base'
import {
  AnchorWallet,
  ConnectionProvider,
  useConnection,
  useWallet,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { ReactNode, useCallback, useMemo, useEffect, useState } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
import '@solana/wallet-adapter-react-ui/styles.css'
import { AnchorProvider } from '@coral-xyz/anchor'

// IMPORTS
import { 
    SolanaMobileWalletAdapter, 
    createDefaultAddressSelector, 
    createDefaultAuthorizationResultCache,
    createDefaultWalletNotFoundHandler
} from '@solana-mobile/wallet-adapter-mobile';

import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';

import dynamic from 'next/dynamic'

export const WalletButton = dynamic(async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton, {
  ssr: false,
})

export function SolanaProvider({ children }: { children: ReactNode }) {
  const { cluster } = useCluster()
  const endpoint = useMemo(() => cluster.endpoint, [cluster])
  
  // ERROR HANDLER: Helps debug "Does nothing" issues
  const onError = useCallback((error: WalletError) => {
    console.error("Wallet Error:", error);
    // Optional: Alert the user if it's a critical connection error
    if (error.name === 'WalletConnectionError') {
        alert("Connection failed. Please try again or open this site in your Wallet's built-in browser.");
    }
  }, [])
  
  const [currentUri, setCurrentUri] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);

  // 1. DETECT DEVICE TYPE
  useEffect(() => {
    if (typeof window !== 'undefined') {
        setCurrentUri(window.location.origin);
        
        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
        const mobileCheck = /android|ipad|iphone|ipod/i.test(userAgent);
        setIsMobile(mobileCheck);
    }
  }, []);

  // 2. CONFIGURE WALLETS
  const wallets = useMemo(() => {
    
    // CONFIG A: MOBILE DEVICES
    if (isMobile) {
        return [
            // 1. Mobile Wallet Adapter (First Priority for Android Chrome)
            new SolanaMobileWalletAdapter({
                addressSelector: createDefaultAddressSelector(),
                appIdentity: {
                    name: 'SSF Token Sale',
                    uri: currentUri, 
                    icon: `${currentUri}/favicon.ico`, 
                },
                authorizationResultCache: createDefaultAuthorizationResultCache(),
                cluster: 'mainnet-beta',
                onWalletNotFound: createDefaultWalletNotFoundHandler(),
            }),
            // 2. Standard Adapters (Backup & In-App Browser Support)
            // If user is in Solflare App Browser, these work better than MWA.
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
        ];
    }

    // CONFIG B: DESKTOP
    return [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
    ];

  }, [isMobile, currentUri]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      {/* DISABLE AUTO CONNECT ON MOBILE to prevent "Stuck" state */}
      <WalletProvider wallets={wallets} onError={onError} autoConnect={!isMobile}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export function useAnchorProvider() {
  const { connection } = useConnection()
  const wallet = useWallet()

  return new AnchorProvider(connection, wallet as AnchorWallet, { commitment: 'confirmed' })
}