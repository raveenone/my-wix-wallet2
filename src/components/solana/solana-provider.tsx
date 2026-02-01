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
  
  const [currentUri, setCurrentUri] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);

  // 1. DETECT DEVICE TYPE ON LOAD
  useEffect(() => {
    if (typeof window !== 'undefined') {
        setCurrentUri(window.location.origin);
        
        // Simple mobile detection check
        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
        const mobileCheck = /android|ipad|iphone|ipod/i.test(userAgent);
        setIsMobile(mobileCheck);
    }
  }, []);

  // 2. CONFIGURE WALLETS BASED ON DEVICE
  const wallets = useMemo(() => {
    
    // CONFIG A: MOBILE DEVICES
    // We REMOVE the standard adapters to prevent the "Get App" popup conflicts.
    // We ONLY use the Mobile Adapter, which handles app switching correctly.
    if (isMobile) {
        return [
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
        ];
    }

    // CONFIG B: DESKTOP
    // On desktop, we want the browser extensions.
    return [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
    ];

  }, [isMobile, currentUri]);

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