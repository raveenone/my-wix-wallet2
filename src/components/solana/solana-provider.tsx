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

// 1. IMPORT ALL ADAPTERS
import { 
    SolanaMobileWalletAdapter, 
    createDefaultAddressSelector, 
    createDefaultAuthorizationResultCache,
    createDefaultWalletNotFoundHandler
} from '@solana-mobile/wallet-adapter-mobile';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletConnectWalletAdapter } from '@solana/wallet-adapter-walletconnect';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';

import dynamic from 'next/dynamic'

// ---------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------
// 1. YOUR VERCEL URL (No trailing slash)
const REAL_VERCEL_URL = 'https://my-wix-wallet2.vercel.app'; 

// 2. YOUR PROJECT ID (From Reown/WalletConnect Cloud)
const PROJECT_ID = '06989729509399f142944d7a50716e5f'; 

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

  const isEmbedded = typeof window !== 'undefined'
  ? window.self !== window.top
  : false;

const isFullscreen =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('mode') === 'fullscreen';

  // DETECT DEVICE
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
        const mobileCheck = /android|ipad|iphone|ipod/i.test(userAgent);
        setIsMobile(mobileCheck);
    }
  }, []);

  /*const wallets = useMemo(() => {
    
    // -----------------------------------------------------------
    // MOBILE CONFIGURATION (Hybrid)
    // -----------------------------------------------------------
    if (isMobile) {
        return [
            // A. Native Mobile Adapter (Android Intents)
            new SolanaMobileWalletAdapter({
                addressSelector: createDefaultAddressSelector(),
                appIdentity: {
                    name: 'SSF Token Sale',
                    uri: REAL_VERCEL_URL, // Wix Iframe Fix
                    icon: `${REAL_VERCEL_URL}/favicon.ico`,
                },
                authorizationResultCache: createDefaultAuthorizationResultCache(),
                cluster: 'mainnet-beta',
                onWalletNotFound: createDefaultWalletNotFoundHandler(),
            }),

            // B. WalletConnect (The "Safety Net" with Project ID)
            new WalletConnectWalletAdapter({
                network: WalletAdapterNetwork.Mainnet,
                options: {
                    projectId: PROJECT_ID, 
                    metadata: {
                        name: 'SSF Token Sale',
                        description: 'Buy SSF Tokens',
                        url: REAL_VERCEL_URL,
                        icons: [`${REAL_VERCEL_URL}/favicon.ico`]
                    },
                },
            }),

            // C. Standard Adapters (In-App Browser Support)
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
        ];
    }

    // -----------------------------------------------------------
    // DESKTOP CONFIGURATION
    // -----------------------------------------------------------
    return [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
    ];

  }, [isMobile]);*/

  const wallets = useMemo(() => {

    // -----------------------------------------------------------
    // DESKTOP (Iframe-safe)
    // -----------------------------------------------------------
    if (!isMobile) {
      return [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
      ];
    }

    // -----------------------------------------------------------
    // MOBILE + IFRAME → NO WALLETS (UI only)
    // -----------------------------------------------------------
    if (isMobile && isEmbedded && !isFullscreen) {
      return [];
    }

    // -----------------------------------------------------------
    // MOBILE + FULLSCREEN → ENABLE MOBILE WALLETS
    // -----------------------------------------------------------
    if (isMobile && isFullscreen) {
      return [
        new SolanaMobileWalletAdapter({
          addressSelector: createDefaultAddressSelector(),
          appIdentity: {
            name: 'SSF Token Sale',
            uri: REAL_VERCEL_URL,
            icon: `${REAL_VERCEL_URL}/favicon.ico`,
          },
          authorizationResultCache: createDefaultAuthorizationResultCache(),
          cluster: 'mainnet-beta',
          onWalletNotFound: createDefaultWalletNotFoundHandler(),
        }),

        new WalletConnectWalletAdapter({
          network: WalletAdapterNetwork.Mainnet,
          options: {
            projectId: PROJECT_ID,
            metadata: {
              name: 'SSF Token Sale',
              description: 'Buy SSF Tokens',
              url: REAL_VERCEL_URL,
              icons: [`${REAL_VERCEL_URL}/favicon.ico`],
            },
          },
        }),

        // in-app browser fallback
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
      ];
    }

    return [];
  }, [isMobile, isEmbedded, isFullscreen]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      {/* AutoConnect OFF on mobile to prevent "Does nothing" bugs */}
      <WalletProvider wallets={wallets} onError={onError} autoConnect={!isMobile || isFullscreen}>
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