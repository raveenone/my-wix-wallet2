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

// 1. IMPORT THE NETWORK ENUM (Fixes the error)
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

// 2. IMPORT WALLET CONNECT & ADAPTERS
import { WalletConnectWalletAdapter } from '@solana/wallet-adapter-walletconnect';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';

import dynamic from 'next/dynamic'

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
        const mobileCheck = /android|ipad|iphone|ipod/i.test(userAgent);
        setIsMobile(mobileCheck);
    }
  }, []);

  const wallets = useMemo(() => {
    
    // -----------------------------------------------------------
    // CONFIGURATION A: MOBILE (Use WalletConnect)
    // -----------------------------------------------------------
    if (isMobile) {
        return [
            new WalletConnectWalletAdapter({
                // 3. USE THE ENUM HERE (Fixes the error)
                network: WalletAdapterNetwork.Mainnet, 
                options: {
                    // PASTE YOUR PROJECT ID HERE
                    projectId: '06989729509399f142944d7a50716e5f', 
                    metadata: {
                        name: 'SSF Token Sale',
                        description: 'Buy SSF Tokens',
                        url: 'https://my-wix-wallet2.vercel.app', // Your Vercel URL
                        icons: ['https://avatars.githubusercontent.com/u/37784886']
                    },
                },
            }),
            // Fallback adapters for mobile
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
        ];
    }

    // -----------------------------------------------------------
    // CONFIGURATION B: DESKTOP (Standard Extensions)
    // -----------------------------------------------------------
    return [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
    ];

  }, [isMobile]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      {/* AutoConnect OFF on mobile to allow WalletConnect to initialize cleanly */}
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