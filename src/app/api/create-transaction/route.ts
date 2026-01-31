import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js';
import { 
  createTransferCheckedInstruction, 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction,
  getAccount,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError
} from '@solana/spl-token';
import { NextResponse } from 'next/server';
import bs58 from 'bs58';

// ==================================================================
// CONFIGURATION
// ==================================================================
const TREASURY_SECRET = process.env.TREASURY_PRIVATE_KEY!;
// Assuming your key is a base58 string. If it's a JSON array, use Uint8Array.from(JSON.parse(TREASURY_SECRET))
const TREASURY_KEYPAIR = Keypair.fromSecretKey(bs58.decode(TREASURY_SECRET));
const TREASURY_PUBKEY = TREASURY_KEYPAIR.publicKey;

// Token Addresses (Mainnet)
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const USDT_MINT = new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB");

// YOUR TOKEN
const SSF_MINT = new PublicKey("GQgPoRVDbxy47neUJ9j7zF6TrCXWLPUbs5W7y3rnB84L");
const PRICE_PER_TOKEN = 0.25; 
const SSF_DECIMALS = 6; // <--- VERIFY THIS (Check Solscan for your token's decimals)

export async function POST(req: Request) {
  try {
    const { userAddress, amountUSD, tokenType } = await req.json();
    
    if (!userAddress || !amountUSD) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const userPubkey = new PublicKey(userAddress);
    
    // Connect to Solana (Use your Helius/QuickNode RPC if possible for speed)
    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.mainnet-beta.solana.com");

    // 1. Setup Amounts
    const payMint = tokenType === 'USDC' ? USDC_MINT : USDT_MINT;
    const payDecimals = 6; // USDC/T are always 6
    
    // Calculate how much user pays (USDC)
    const payAmountBigInt = BigInt(Math.round(parseFloat(amountUSD) * Math.pow(10, payDecimals)));

    // Calculate how much user gets (SSF)
    const ssfRawAmount = parseFloat(amountUSD) / PRICE_PER_TOKEN;
    const ssfAmountBigInt = BigInt(Math.round(ssfRawAmount * Math.pow(10, SSF_DECIMALS)));

    // 2. Derive Addresses
    // Where user sends USDC FROM
    const userPayAccount = await getAssociatedTokenAddress(payMint, userPubkey);
    // Where you receive USDC TO
    const treasuryPayAccount = await getAssociatedTokenAddress(payMint, TREASURY_PUBKEY);
    
    // Where you send SSF FROM
    const treasurySSFAccount = await getAssociatedTokenAddress(SSF_MINT, TREASURY_PUBKEY);
    // Where user receives SSF TO (We need to check if this exists!)
    const userSSFAccount = await getAssociatedTokenAddress(SSF_MINT, userPubkey);

    const transaction = new Transaction();

    // ---------------------------------------------------------
    // STEP A: CHECK IF USER NEEDS AN ACCOUNT CREATED
    // ---------------------------------------------------------
    try {
      // Try to find the user's SSF account on chain
      await getAccount(connection, userSSFAccount);
    } catch (error: any) {
      // If error is "Account Not Found", we must create it
      if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError || error.message.includes("does not exist")) {
        console.log("User needs new SSF account. Adding create instruction...");
        
        transaction.add(
          createAssociatedTokenAccountInstruction(
            userPubkey,     // Payer (User pays the 0.002 SOL fee)
            userSSFAccount, // The new account address to create
            userPubkey,     // The owner of the new account
            SSF_MINT        // The token mint
          )
        );
      } else {
        throw error; // Rethrow other errors
      }
    }

    // ---------------------------------------------------------
    // STEP B: THE SWAP INSTRUCTIONS
    // ---------------------------------------------------------
    
    // 1. User sends USDC/T to Treasury
    transaction.add(
      createTransferCheckedInstruction(
        userPayAccount, 
        payMint, 
        treasuryPayAccount, 
        userPubkey, 
        payAmountBigInt, 
        payDecimals
      )
    );

    // 2. Treasury sends SSF to User
    transaction.add(
      createTransferCheckedInstruction(
        treasurySSFAccount, 
        SSF_MINT, 
        userSSFAccount, 
        TREASURY_PUBKEY, 
        ssfAmountBigInt, 
        SSF_DECIMALS
      )
    );

    // ---------------------------------------------------------
    // STEP C: SIGN AND SEND
    // ---------------------------------------------------------
    
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPubkey;

    // Sign with Treasury Key (authorizing the SSF transfer)
    transaction.partialSign(TREASURY_KEYPAIR);

    // Serialize and return
    const serializedTransaction = transaction.serialize({ requireAllSignatures: false });
    const base64 = serializedTransaction.toString('base64');

    return NextResponse.json({ transaction: base64 });

  } catch (error: any) {
    console.error("Transaction Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}