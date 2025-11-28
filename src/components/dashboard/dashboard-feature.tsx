'use client';

import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletButton } from '../solana/solana-provider'; // Ensure this path matches your project structure
import { useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';

import { AppHero } from '@/components/app-hero'

const links: { label: string; href: string }[] = [
  { label: 'Solana Docs', href: 'https://docs.solana.com/' },
  { label: 'Solana Faucet', href: 'https://faucet.solana.com/' },
  { label: 'Solana Cookbook', href: 'https://solana.com/developers/cookbook/' },
  { label: 'Solana Stack Overflow', href: 'https://solana.stackexchange.com/' },
  { label: 'Solana Developers GitHub', href: 'https://github.com/solana-developers/' },
]

/*export function DashboardFeature() {
  return (
    <div>
      <AppHero title="Satoshi Strike Force" subtitle="Token on solana" />
    </div>
  )
}*/

// ----------------------------------------------------
// 1. PASTE YOUR TOKEN MINT ADDRESS HERE
// ----------------------------------------------------
const MY_TOKEN_MINT_ADDRESS = "GQgPoRVDbxy47neUJ9j7zF6TrCXWLPUbs5W7y3rnB84L"; 

export function DashboardFeature() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function getTokenBalance() {
      if (!publicKey) {
        setTokenBalance(null);
        return;
      }

      setIsLoading(true);
      try {
        const mintPublicKey = new PublicKey(MY_TOKEN_MINT_ADDRESS);
        
        // Ask Solana for all token accounts owned by this user that match the specific Mint Address
        const response = await connection.getParsedTokenAccountsByOwner(
          publicKey, 
          { mint: mintPublicKey }
        );

        if (response.value.length > 0) {
          // If account exists, grab the "uiAmount" (human readable number)
          const amount = response.value[0].account.data.parsed.info.tokenAmount.uiAmount;
          setTokenBalance(amount);
        } else {
          // User has never held this token
          setTokenBalance(0);
        }
      } catch (error) {
        console.error("Error fetching token balance:", error);
        setTokenBalance(0);
      } finally {
        setIsLoading(false);
      }
    }

    getTokenBalance();
  }, [publicKey, connection]);

  return (
    <div className="hero flex flex-col items-center justify-center w-full bg-base-200">
      <div className="hero-content text-center">
        <div className="max-w-md">
          
          <h1 className="text-5xl font-bold">Satoshi Strike Force</h1>
          <p className="py-6">
            Token on solana
          </p>
          
          <div className="flex flex-col items-center gap-4">
            {/* The Connect Button */}
            <WalletButton />

            {/* Display Balance Logic */}
            {publicKey && (
              <div className="mt-6 p-4 max-w-xs border border-primary rounded-xl bg-base-100 shadow-xl">
                <h2 className="text-xl font-bold mb-2 text-primary">Your Balance</h2>
                
                {isLoading ? (
                  <span className="loading loading-spinner loading-md"></span>
                ) : (
                  <div className="stat-value text-4xl">
                    {tokenBalance !== null ? tokenBalance : 0} 
                    <span className="text-sm ml-2 opacity-50">SSF TOKENS</span>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
