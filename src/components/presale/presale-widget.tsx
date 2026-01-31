'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Transaction } from '@solana/web3.js';
import { useState, useEffect } from 'react';

// ---------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------
const PRICE_PER_TOKEN = 0.25; 
const MIN_PURCHASE_USD = 1.00;

const USDC_MINT_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDT_MINT_ADDRESS = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";

export default function PresaleWidget() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [usdAmount, setUsdAmount] = useState<string>("100");
  const [tokenType, setTokenType] = useState<'USDC' | 'USDT'>('USDC');
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // CHANGED: Store both balances separately
  const [balances, setBalances] = useState({ usdc: 0, usdt: 0 });
  const [checkingBalance, setCheckingBalance] = useState(false);

  const ssfAmount = parseFloat(usdAmount || "0") / PRICE_PER_TOKEN;
  
  // Helper to get current selected balance for validation
  const currentSelectedBalance = tokenType === 'USDC' ? balances.usdc : balances.usdt;

  // ---------------------------------------------------
  // 1. CHECK USER BALANCES (BOTH)
  // ---------------------------------------------------
  useEffect(() => {
    async function checkBalances() {
      if (!publicKey) {
        setBalances({ usdc: 0, usdt: 0 });
        return;
      }
      
      setCheckingBalance(true);
      
      try {
        // Helper function to fetch a single token balance
        const fetchBalance = async (mintAddress: string) => {
            const mint = new PublicKey(mintAddress);
            const response = await connection.getParsedTokenAccountsByOwner(publicKey, { mint });
            
            if (response.value.length > 0) {
                return response.value.reduce((acc, account) => {
                    return acc + (account.account.data.parsed.info.tokenAmount.uiAmount || 0);
                }, 0);
            }
            return 0;
        };

        // Fetch BOTH at the same time
        const [usdcBal, usdtBal] = await Promise.all([
            fetchBalance(USDC_MINT_ADDRESS),
            fetchBalance(USDT_MINT_ADDRESS)
        ]);

        setBalances({ usdc: usdcBal, usdt: usdtBal });

      } catch (e) {
        console.error("Error fetching balances:", e);
        setBalances({ usdc: 0, usdt: 0 });
      } finally {
        setCheckingBalance(false);
      }
    }

    checkBalances();
  }, [publicKey, connection]); // Removed 'tokenType' dependency so it doesn't reload on click

  // ---------------------------------------------------
  // 2. HANDLE BUY
  // ---------------------------------------------------
  const handleBuy = async () => {
    if (!publicKey) return;
    
    // Safety Check: Balance using the helper variable
    if (currentSelectedBalance < parseFloat(usdAmount)) {
        alert(`Insufficient funds! You only have ${currentSelectedBalance.toFixed(2)} ${tokenType}.`);
        return;
    }

    setIsLoading(true);
    setStatus("Generating transaction...");

    try {
      // Call API
      const response = await fetch('/api/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: publicKey.toString(),
          amountUSD: usdAmount,
          tokenType: tokenType
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create transaction");

      // Deserialize
      const transactionBuffer = Buffer.from(data.transaction, 'base64');
      const transaction = Transaction.from(transactionBuffer);

      // Sign and Send
      setStatus(`Please approve the ${tokenType} transfer in your wallet...`);
      
      const signature = await sendTransaction(transaction, connection);
      
      setStatus("Confirming transaction...");
      await connection.confirmTransaction(signature, 'confirmed');

      setStatus("Purchase Successful!");
      alert(`Success! You received ${ssfAmount} SSF tokens.`);
      
      // Refresh page/balances after purchase
      window.location.reload(); 

    } catch (error: any) {
      console.error(error);
      if (error.message?.includes("User rejected")) {
        setStatus("Transaction cancelled.");
      } else {
        setStatus("Error: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-[#0f0f0f] text-white rounded-3xl border border-gray-800 shadow-2xl">
      <h2 className="text-3xl font-bold text-center mb-8 text-white">Buy SSF Tokens</h2>

      {/* --------------------------------------------------- */}
      {/* UI: PAYMENT SELECTOR */}
      {/* --------------------------------------------------- */}
      <div className="mb-6">
        <label className="text-sm text-gray-400 font-semibold mb-2 block">I want to pay with:</label>
        <div className="grid grid-cols-2 gap-4">
            
            {/* USDC OPTION */}
            <div 
                onClick={() => setTokenType('USDC')}
                className={`cursor-pointer rounded-xl p-4 border-2 flex flex-col items-center transition-all ${
                    tokenType === 'USDC' 
                    ? 'border-blue-500 bg-blue-900/20 shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                    : 'border-gray-700 bg-gray-800 hover:border-gray-500'
                }`}
            >
                <div className="font-bold text-xl flex items-center gap-2">
                    <span className="text-blue-400">USDC</span>
                    {tokenType === 'USDC' && <span className="text-blue-500">✓</span>}
                </div>
                {/* FIXED: Always shows USDC balance */}
                <div className="text-xs mt-1 text-gray-400">
                    {checkingBalance ? "..." : `Bal: ${balances.usdc.toLocaleString()}`}
                </div>
            </div>

            {/* USDT OPTION */}
            <div 
                onClick={() => setTokenType('USDT')}
                className={`cursor-pointer rounded-xl p-4 border-2 flex flex-col items-center transition-all ${
                    tokenType === 'USDT' 
                    ? 'border-green-500 bg-green-900/20 shadow-[0_0_15px_rgba(34,197,94,0.5)]' 
                    : 'border-gray-700 bg-gray-800 hover:border-gray-500'
                }`}
            >
                <div className="font-bold text-xl flex items-center gap-2">
                    <span className="text-green-400">USDT</span>
                    {tokenType === 'USDT' && <span className="text-green-500">✓</span>}
                </div>
                {/* FIXED: Always shows USDT balance */}
                <div className="text-xs mt-1 text-gray-400">
                    {checkingBalance ? "..." : `Bal: ${balances.usdt.toLocaleString()}`}
                </div>
            </div>

        </div>
      </div>

      {/* AMOUNT INPUT */}
      <div className="mb-6">
        <label className="text-sm text-gray-400 font-semibold mb-2 block">Amount (USD)</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">$</span>
          <input 
            type="number" 
            value={usdAmount}
            onChange={(e) => setUsdAmount(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl py-4 pl-10 pr-4 text-xl text-white focus:outline-none focus:border-white transition-colors"
            min={MIN_PURCHASE_USD}
          />
        </div>
      </div>

      {/* CONVERSION DISPLAY */}
      <div className="bg-gray-800/50 p-6 rounded-2xl mb-8 text-center border border-gray-700">
        <p className="text-sm text-gray-400 mb-1">You Will Receive</p>
        <p className="text-4xl font-bold text-[#14F195] drop-shadow-md">{ssfAmount.toLocaleString()} SSF</p>
        <p className="text-xs text-gray-500 mt-2">Exchange Rate: $0.25 USD = 1 SSF</p>
      </div>

      {/* ACTION BUTTON */}
      {!publicKey ? (
         <div className="flex justify-center wallet-adapter-button-trigger">
            <WalletMultiButton />
         </div>
      ) : (
        <button 
          onClick={handleBuy} 
          disabled={isLoading || parseFloat(usdAmount) < MIN_PURCHASE_USD || currentSelectedBalance < parseFloat(usdAmount)}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
             currentSelectedBalance < parseFloat(usdAmount)
             ? "bg-gray-600 cursor-not-allowed opacity-50" // Insufficient Funds style
             : "bg-white text-black hover:scale-[1.02] shadow-lg" // Active style
          }`}
        >
          {isLoading ? (
            <span className="loading loading-spinner">Processing...</span>
          ) : (
             currentSelectedBalance < parseFloat(usdAmount) 
             ? `Insufficient ${tokenType} Balance` 
             : `SWAP ${usdAmount} ${tokenType}`
          )}
        </button>
      )}

      {/* STATUS MESSAGE */}
      {status && (
        <div className={`mt-6 text-center text-sm p-3 rounded-lg border ${
            status.includes("Error") || status.includes("cancelled") 
            ? "bg-red-900/30 border-red-800 text-red-300" 
            : "bg-green-900/30 border-green-800 text-green-300"
        }`}>
          {status}
        </div>
      )}
    </div>
  );
}