'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Transaction } from '@solana/web3.js';
import { useState } from 'react';

const PRICE_PER_TOKEN = 0.25;
const MIN_PURCHASE_USD = 1.00;

export default function PresaleWidget() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [usdAmount, setUsdAmount] = useState<string>("100");
  const [tokenType, setTokenType] = useState<'USDC' | 'USDT'>('USDC');
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const ssfAmount = parseFloat(usdAmount || "0") / PRICE_PER_TOKEN;

  const handleBuy = async () => {
    if (!publicKey) return;
    setIsLoading(true);
    setStatus("Generating transaction...");

    try {
      // 1. Call your API to create the swap transaction
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

      // 2. Deserialize the transaction received from server
      const transactionBuffer = Buffer.from(data.transaction, 'base64');
      const transaction = Transaction.from(transactionBuffer);

      // 3. User Signs and Sends
      setStatus("Please approve the swap in your wallet...");
      const signature = await sendTransaction(transaction, connection);
      
      setStatus("Confirming transaction...");
      await connection.confirmTransaction(signature, 'confirmed');

      setStatus("Purchase Successful! Tokens sent to your wallet.");
      alert(`Success! You received ${ssfAmount} SSF tokens.`);

    } catch (error: any) {
      console.error(error);
      setStatus("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-base-200 rounded-2xl border border-gray-700 shadow-xl">
      <h2 className="text-2xl font-bold text-center mb-6 text-primary">Buy SSF Tokens</h2>

      {/* Payment Selection */}
      <div className="flex gap-4 justify-center mb-6">
        <button onClick={() => setTokenType('USDC')} className={`btn ${tokenType === 'USDC' ? 'btn-primary' : 'btn-outline'}`}>USDC</button>
        <button onClick={() => setTokenType('USDT')} className={`btn ${tokenType === 'USDT' ? 'btn-success' : 'btn-outline'}`}>USDT</button>
      </div>

      {/* Amount Input */}
      <div className="form-control mb-6">
        <label className="label">Amount (USD)</label>
        <input 
          type="number" 
          value={usdAmount}
          onChange={(e) => setUsdAmount(e.target.value)}
          className="input input-bordered w-full text-lg"
          min={MIN_PURCHASE_USD}
        />
      </div>

      {/* Info */}
      <div className="bg-base-300 p-4 rounded-xl mb-6 text-center">
        <p className="text-sm">You Get</p>
        <p className="text-3xl font-bold text-[#14F195]">{ssfAmount.toLocaleString()} SSF</p>
      </div>

      {/* Button */}
      {!publicKey ? <div className="flex justify-center"><WalletMultiButton /></div> : (
        <button 
          onClick={handleBuy} 
          disabled={isLoading || parseFloat(usdAmount) < MIN_PURCHASE_USD}
          className="btn btn-primary w-full font-bold text-lg"
        >
          {isLoading ? <span className="loading loading-spinner"></span> : "SWAP NOW"}
        </button>
      )}

      {status && <div className="mt-4 text-center text-sm">{status}</div>}
    </div>
  );
}