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

// 1. IMPORT MOBILE ADAPTER (Standard Android/Mobile Protocol)
import { 
    SolanaMobileWalletAdapter, 
    createDefaultAddressSelector, 
    createDefaultAuthorizationResultCache,
    createDefaultWalletNotFoundHandler
} from '@solana-mobile/wallet-adapter-mobile';

import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';

import dynamic from 'next/dynamic'

// ---------------------------------------------------------
// IMPORTANT: YOUR VERCEL URL
// ---------------------------------------------------------
const REAL_VERCEL_URL = 'https://my-wix-wallet2.vercel.app'; 

export const WalletButton = dynamic(async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton, {
  ssr: false,
})

export function SolanaProvider({ children }: { children: ReactNode }) {
  const { cluster } = useCluster()
  const endpoint = useMemo(() => cluster.endpoint, [cluster])
  
  const onError = useCallback((error: WalletError) => {
    console.error("Wallet Error:", error);
  }, [])
  
  const [isMobile, setIsMobile] = useState(false);

  // DETECT DEVICE
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
        const mobileCheck = /android|ipad|iphone|ipod/i.test(userAgent);
        setIsMobile(mobileCheck);
    }
  }, []);

  const wallets = useMemo(() => {
    
    // -----------------------------------------------------------
    // CONFIGURATION A: MOBILE
    // -----------------------------------------------------------
    if (isMobile) {
        return [
            // 1. Mobile Wallet Adapter (The "Connect" button for Android/Mobile)
            new SolanaMobileWalletAdapter({
                addressSelector: createDefaultAddressSelector(),
                appIdentity: {
                    name: 'SSF Token Sale',
                    uri: REAL_VERCEL_URL, // Critical for Wix Iframe support
                    icon: `${REAL_VERCEL_URL}/favicon.ico`,
                },
                authorizationResultCache: createDefaultAuthorizationResultCache(),
                cluster: 'mainnet-beta',
                onWalletNotFound: createDefaultWalletNotFoundHandler(),
            }),
            
            // 2. Standard Adapters (For In-App Browsers)
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
        ];
    }

    // -----------------------------------------------------------
    // CONFIGURATION B: DESKTOP
    // -----------------------------------------------------------
    return [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
    ];

  }, [isMobile]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      {/* AutoConnect OFF on mobile to prevent "Stuck" button state */}
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