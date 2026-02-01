'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui'; 
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
  const { setVisible } = useWalletModal();

  const [usdAmount, setUsdAmount] = useState<string>("100");
  const [tokenType, setTokenType] = useState<'USDC' | 'USDT'>('USDC');
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [balances, setBalances] = useState({ usdc: 0, usdt: 0 });
  const [checkingBalance, setCheckingBalance] = useState(false);

  const ssfAmount = parseFloat(usdAmount || "0") / PRICE_PER_TOKEN;
  const currentSelectedBalance = tokenType === 'USDC' ? balances.usdc : balances.usdt;

  // ---------------------------------------------------
  // 1. CHECK USER BALANCES
  // ---------------------------------------------------
  useEffect(() => {
    async function checkBalances() {
      if (!publicKey) {
        setBalances({ usdc: 0, usdt: 0 });
        return;
      }
      
      setCheckingBalance(true);
      
      try {
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
  }, [publicKey, connection]);

  // ---------------------------------------------------
  // 2. HANDLE BUY OR CONNECT
  // ---------------------------------------------------
  const handleAction = async () => {
    // A. IF NOT CONNECTED -> OPEN WALLET MODAL
    if (!publicKey) {
        setVisible(true);
        return;
    }

    // B. IF CONNECTED BUT LOW BALANCE -> STOP
    if (currentSelectedBalance < parseFloat(usdAmount)) {
        alert(`Insufficient funds! You only have ${currentSelectedBalance.toFixed(2)} ${tokenType}.`);
        return;
    }

    // C. BUY LOGIC
    setIsLoading(true);
    setStatus("Generating transaction...");

    try {
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

      const transactionBuffer = Buffer.from(data.transaction, 'base64');
      const transaction = Transaction.from(transactionBuffer);

      setStatus(`Please approve the ${tokenType} transfer in your wallet...`);
      
      const signature = await sendTransaction(transaction, connection);
      
      setStatus("Confirming transaction...");
      await connection.confirmTransaction(signature, 'confirmed');

      setStatus("Purchase Successful!");
      alert(`Success! You received ${ssfAmount} SSF tokens.`);
      
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

  // ---------------------------------------------------
  // 3. DETERMINE BUTTON STATE (FIXED TYPES)
  // ---------------------------------------------------
  // We use !!publicKey to force a boolean result (false instead of null)
  const isInsufficientBalance = !!publicKey && !checkingBalance && (currentSelectedBalance < parseFloat(usdAmount));
  const isButtonDisabled = isLoading || (!!publicKey && parseFloat(usdAmount) < MIN_PURCHASE_USD);

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-[#0f0f0f] text-white rounded-3xl border border-gray-800 shadow-2xl relative">
      
      {/* --------------------------------------------------- */}
      {/* HEADER: TITLE + WALLET BUTTON */}
      {/* --------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 z-50 relative">
        <h2 className="text-2xl font-bold text-white">Buy SSF Tokens</h2>
        
        {/* Top Right Wallet Button */}
        <div className="transform scale-90 origin-right relative z-50">
             <WalletMultiButton style={{ 
                 height: '40px', 
                 backgroundColor: '#333',
                 fontSize: '14px',
                 padding: '0 16px',
                 zIndex: 50
             }} />
        </div>
      </div>

      {/* --------------------------------------------------- */}
      {/* UI: PAYMENT SELECTOR */}
      {/* --------------------------------------------------- */}
      <div className="mb-6 relative z-10">
        <label className="text-sm text-gray-400 font-semibold mb-2 block">I want to pay with:</label>
        <div className="grid grid-cols-2 gap-4">
            
            {/* USDC */}
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
                <div className="text-xs mt-1 text-gray-400">
                    {checkingBalance ? "..." : `Bal: ${balances.usdc.toLocaleString()}`}
                </div>
            </div>

            {/* USDT */}
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
                <div className="text-xs mt-1 text-gray-400">
                    {checkingBalance ? "..." : `Bal: ${balances.usdt.toLocaleString()}`}
                </div>
            </div>

        </div>
      </div>

      {/* AMOUNT INPUT */}
      <div className="mb-6 relative z-10">
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
      <div className="bg-gray-800/50 p-6 rounded-2xl mb-8 text-center border border-gray-700 relative z-10">
        <p className="text-sm text-gray-400 mb-1">You Will Receive</p>
        <p className="text-4xl font-bold text-[#14F195] drop-shadow-md">{ssfAmount.toLocaleString()} SSF</p>
        <p className="text-xs text-gray-500 mt-2">Exchange Rate: $0.25 USD = 1 SSF</p>
      </div>

      {/* --------------------------------------------------- */}
      {/* BOTTOM ACTION BUTTON */}
      {/* --------------------------------------------------- */}
      <button 
        onClick={handleAction} 
        disabled={isButtonDisabled || isInsufficientBalance}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all relative z-10 ${
            !publicKey 
             ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg" // Connect Wallet Style
             : isInsufficientBalance 
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"   // No Money Style
                : "bg-white text-black hover:scale-[1.02] shadow-lg" // Buy Style
        }`}
      >
        {isLoading ? (
            <span className="loading loading-spinner">Processing...</span>
        ) : (
            !publicKey ? "Connect Wallet to Buy" :
            isInsufficientBalance ? `Insufficient ${tokenType} Balance` :
            `SWAP ${usdAmount} ${tokenType}`
        )}
      </button>

      {/* STATUS MESSAGE */}
      {status && (
        <div className={`mt-6 text-center text-sm p-3 rounded-lg border relative z-10 ${
            status.includes("Error") || status.includes("cancelled") 
            ? "bg-red-900/30 border-red-800 text-red-300" 
            : "bg-green-900/30 border-green-800 text-green-300"
        }`}>
          {status}
        </div>
      )}

      {/* GLOBAL CSS OVERRIDES FOR MODALS */}
      <style jsx global>{`
        .wallet-adapter-dropdown {
            z-index: 99999 !important;
        }
        .wallet-adapter-dropdown-list {
            z-index: 99999 !important;
        }
        input { position: relative; z-index: 20; }
      `}</style>
    </div>
  );
}