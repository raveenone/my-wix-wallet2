'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Transaction } from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createTransferCheckedInstruction, 
  getAccount, 
  getMint 
} from '@solana/spl-token';
import { useState, useEffect } from 'react';

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------
// 1. REPLACE THIS WITH YOUR WALLET ADDRESS (Where money goes)
const TREASURY_WALLET = new PublicKey("7Q5o2vSjWAHLpWu9nY2togU3W3p5H3vKzG112GysQPEa");

// 2. Token Mints (Mainnet Addresses)
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const USDT_MINT = new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB");

// 3. Sale Config
const PRICE_PER_TOKEN = 0.25; // $0.25
const MIN_PURCHASE_USD = 1.00; // $1.00

export default function PresaleWidget() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [usdAmount, setUsdAmount] = useState<string>("100");
  const [tokenType, setTokenType] = useState<'USDC' | 'USDT'>('USDC');
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Calculate SSF Amount
  const ssfAmount = parseFloat(usdAmount || "0") / PRICE_PER_TOKEN;

  const handleBuy = async () => {
    if (!publicKey) return;
    setIsLoading(true);
    setStatus("Preparing transaction...");

    try {
      const amount = parseFloat(usdAmount);
      if (isNaN(amount) || amount < MIN_PURCHASE_USD) {
        throw new Error(`Minimum purchase is $${MIN_PURCHASE_USD}`);
      }

      // 1. Determine which coin user is paying with
      const mintToUse = tokenType === 'USDC' ? USDC_MINT : USDT_MINT;
      const decimals = 6; // Both USDC and USDT use 6 decimals on Solana

      // 2. Find the User's Token Account
      const userTokenAccount = await getAssociatedTokenAddress(mintToUse, publicKey);
      
      // 3. Find the Treasury's Token Account (Where we send money)
      const treasuryTokenAccount = await getAssociatedTokenAddress(mintToUse, TREASURY_WALLET);

      // Check if Treasury Account exists (If not, this transaction will fail, 
      // so you must have held USDC/USDT in your treasury wallet at least once)
      try {
        await getAccount(connection, treasuryTokenAccount);
      } catch (e) {
        throw new Error("Treasury wallet is not initialized to receive " + tokenType);
      }

      // 4. Create Transfer Instruction
      // Logic: Amount * 10^decimals (e.g. 100 USDC = 100 * 1,000,000)
      const transferAmount = BigInt(Math.round(amount * Math.pow(10, decimals)));

      const transaction = new Transaction().add(
        createTransferCheckedInstruction(
          userTokenAccount,     // From (User)
          mintToUse,            // Mint (USDC/USDT)
          treasuryTokenAccount, // To (Treasury)
          publicKey,            // Payer (User)
          transferAmount,       // Amount (in smallest unit)
          decimals              // Decimals
        )
      );

      // 5. Send Transaction
      setStatus("Please sign the transaction in your wallet...");
      const signature = await sendTransaction(transaction, connection);
      
      setStatus("Confirming transaction...");
      await connection.confirmTransaction(signature, 'confirmed');

      setStatus(`Success! Transaction: ${signature.slice(0, 8)}...`);
      alert("Purchase Successful! You have purchased " + ssfAmount + " SSF.");

    } catch (error: any) {
      console.error(error);
      let msg = error.message;
      if (msg.includes("User rejected")) msg = "Transaction rejected by user.";
      if (msg.includes("TokenAccountNotFoundError")) msg = `You do not have any ${tokenType} in your wallet.`;
      setStatus("Error: " + msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-base-200 rounded-2xl border border-gray-700 shadow-xl">
      <h2 className="text-2xl font-bold text-center mb-6 text-primary">Buy SSF Tokens</h2>

      {/* 1. Payment Method Selection */}
      <div className="form-control mb-4">
        <label className="label"><span className="label-text text-lg">Pay With:</span></label>
        <div className="flex gap-4 justify-center">
          <label className="cursor-pointer label gap-2 border border-gray-600 rounded-lg px-4 py-2 bg-base-100">
            <input 
              type="radio" 
              name="token" 
              className="radio radio-primary" 
              checked={tokenType === 'USDC'} 
              onChange={() => setTokenType('USDC')} 
            />
            <span className="font-bold">USDC</span>
          </label>
          <label className="cursor-pointer label gap-2 border border-gray-600 rounded-lg px-4 py-2 bg-base-100">
            <input 
              type="radio" 
              name="token" 
              className="radio radio-success" 
              checked={tokenType === 'USDT'} 
              onChange={() => setTokenType('USDT')} 
            />
            <span className="font-bold">USDT</span>
          </label>
        </div>
      </div>

      {/* 2. Amount Input */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Amount (USD)</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-3 text-gray-400">$</span>
          <input 
            type="number" 
            value={usdAmount}
            onChange={(e) => setUsdAmount(e.target.value)}
            className="input input-bordered w-full pl-8 text-lg"
            min={MIN_PURCHASE_USD}
          />
        </div>
        <label className="label">
          <span className="label-text-alt text-gray-400">Min purchase: ${MIN_PURCHASE_USD}</span>
        </label>
      </div>

      {/* 3. Conversion Display */}
      <div className="bg-base-300 p-4 rounded-xl mb-6 text-center">
        <p className="text-sm opacity-70">You Will Receive</p>
        <p className="text-3xl font-bold text-[#14F195]">{ssfAmount.toLocaleString()} SSF</p>
        <p className="text-xs opacity-50 mt-1">Rate: $0.25 / SSF</p>
      </div>

      {/* 4. Action Button */}
      <div className="flex flex-col gap-3">
        {!publicKey ? (
           <div className="flex justify-center"><WalletMultiButton /></div>
        ) : (
          <button 
            onClick={handleBuy} 
            disabled={isLoading || parseFloat(usdAmount) < MIN_PURCHASE_USD}
            className="btn btn-primary btn-lg w-full font-bold text-lg shadow-lg shadow-primary/20"
          >
            {isLoading ? <span className="loading loading-spinner"></span> : "BUY TOKENS NOW"}
          </button>
        )}
      </div>

      {/* 5. Status Message */}
      {status && (
        <div className={`mt-4 text-center text-sm p-2 rounded ${status.includes("Error") ? "bg-red-900/50 text-red-200" : "bg-gray-800 text-green-400"}`}>
          {status}
        </div>
      )}
    </div>
  );
}