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
  const onError = useCallback((error: WalletError) => {
    console.error(error)
  }, [])
  
  // Use state to handle window object safely (Server Side Rendering fix)
  const [currentUri, setCurrentUri] = useState<string>('https://your-website.com');
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
        setCurrentUri(window.location.origin);
    }
  }, []);

  // CONFIGURE WALLETS
  const wallets = useMemo(
    () => [
      
      // 2. Mobile Wallet Adapter (Fallback for Chrome/Safari on Mobile)
      // This allows app switching if the above don't find the wallet in-browser.
      new SolanaMobileWalletAdapter({
        addressSelector: createDefaultAddressSelector(),
        appIdentity: {
          name: 'SSF Token Sale',
          uri: currentUri, // DYNAMIC: Matches your Vercel URL exactly
          icon: `${currentUri}/favicon.ico`, 
        },
        authorizationResultCache: createDefaultAuthorizationResultCache(),
        cluster: 'mainnet-beta',
        onWalletNotFound: createDefaultWalletNotFoundHandler(),
      }),

      // 1. Standard Adapters (First priority for In-App Browsers & Desktop)
      // If user is in Solflare App Browser, this works instantly.
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    [currentUri]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
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