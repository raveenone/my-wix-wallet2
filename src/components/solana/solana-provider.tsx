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
import { ReactNode, useCallback, useMemo } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
import '@solana/wallet-adapter-react-ui/styles.css'
import { AnchorProvider } from '@coral-xyz/anchor'

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
// IMPORTANT: PASTE YOUR VERCEL URL HERE
// ---------------------------------------------------------
// Do not use window.location. This must be the actual domain 
// listed in your Vercel settings. No trailing slash.
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

  const wallets = useMemo(
    () => [
      // 1. Mobile Wallet Adapter (Android Priority)
      new SolanaMobileWalletAdapter({
        addressSelector: createDefaultAddressSelector(),
        appIdentity: {
          name: 'SSF Token Sale',
          uri: REAL_VERCEL_URL, // <--- HARDCODED URI FIXES THE IFRAME MISMATCH
          icon: `${REAL_VERCEL_URL}/favicon.ico`,
        },
        authorizationResultCache: createDefaultAuthorizationResultCache(),
        cluster: 'mainnet-beta',
        onWalletNotFound: createDefaultWalletNotFoundHandler(),
      }),

      // 2. Standard Adapters (iOS / Desktop)
      // These have their own built-in deep linking for iOS
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      {/* AutoConnect is safer left OFF for mobile iframes to prevent race conditions */}
      <WalletProvider wallets={wallets} onError={onError} autoConnect={true}>
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