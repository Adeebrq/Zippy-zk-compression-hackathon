import React, { useEffect, useState } from 'react';
import { LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import { CompressedTokenProgram } from '@lightprotocol/compressed-token';
import { TOKEN_2022_PROGRAM_ID, MINT_SIZE } from '@solana/spl-token';
import { useWalletContext } from '../components/useWalletContext';

const CreatorPage = () => {
  const { publicKey, connect, disconnect, connected, connection, signTransaction } = useWalletContext();
  const [balance, setBalance] = useState(0);
  const [mintAddress, setMintAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    if (publicKey && connection) {
      const balance = await connection.getBalance(publicKey);
      setBalance(balance / LAMPORTS_PER_SOL);
    }
  };

  const createCompressedToken = async () => {
    if (!publicKey || !signTransaction || !connection) {
      setError('Wallet not connected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate a new keypair for the mint
      const mintKeypair = Keypair.generate();

      // Get rent-exempt balance for the mint
      const rentExemptBalance = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

      // Get a fresh blockhash - important to get this right before creating the transaction
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');

      // Create mint instructions
      const instructions = await CompressedTokenProgram.createMint({
        feePayer: publicKey,
        mint: mintKeypair.publicKey,
        decimals: 9,
        authority: publicKey,
        freezeAuthority: null,
        rentExemptBalance,
        tokenProgramId: TOKEN_2022_PROGRAM_ID,
      });

      // Create a transaction with fresh blockhash
      const transaction = new Transaction({ 
        recentBlockhash: blockhash, 
        feePayer: publicKey 
      });

      // Add mint instructions
      transaction.add(...instructions);

      // Sign with the mint keypair first
      transaction.partialSign(mintKeypair);

      // Then, sign with the wallet
      const signedTransaction = await signTransaction(transaction);

      // Send and confirm transaction with proper options
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'finalized',
        maxRetries: 3
      });

      console.log("Transaction sent:", signature);

      // Wait for confirmation with timeout
      const confirmationPromise = connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'finalized');

      // Add a timeout to handle hanging transactions
      const timeout = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Transaction confirmation timeout")), 30000)
      );

      try {
        const confirmation = await Promise.race([confirmationPromise, timeout]);
        
        if (confirmation && confirmation.value && confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }
      } catch (err) {
        if (err instanceof Error && err.message === "Transaction confirmation timeout") {
          throw err;
        }
        // If it's another error during confirmation, try to check status directly
        const status = await connection.getSignatureStatus(signature);
        if (status && status.value && status.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
        }
      }

      console.log("Transaction confirmed:", signature);
      setMintAddress(mintKeypair.publicKey.toBase58());
    } catch (err) {
      console.error('Detailed error:', err);
      setError(`Failed to create token: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Request airdrop function - useful for testing
  const requestAirdrop = async () => {
    if (!publicKey || !connection) return;
    
    setIsLoading(true);
    try {
      const signature = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);
      await connection.confirmTransaction(signature, 'confirmed');
      await fetchBalance();
    } catch (err) {
      setError(`Airdrop failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (publicKey && connection) fetchBalance();
  }, [publicKey, connection]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Compressed Token Creator</h1>
      <div className="mb-6">
        {connected ? (
          <div>
            <p className="mb-2">Connected: <span className="font-mono">{publicKey?.toBase58()}</span></p>
            <button onClick={disconnect} className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded">
              Disconnect
            </button>
          </div>
        ) : (
          <button onClick={connect} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
            Connect Wallet
          </button>
        )}
      </div>
      {connected && (
        <div className="mb-6">
          <p className="mb-2">Balance: {balance} SOL</p>
          <button
            onClick={requestAirdrop}
            disabled={isLoading}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
          >
            {isLoading ? 'Processing...' : 'Request Airdrop (1 SOL)'}
          </button>
        </div>
      )}
      {connected && balance > 0 && (
        <div className="mb-6">
          <button
            onClick={createCompressedToken}
            disabled={isLoading}
            className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded"
          >
            {isLoading ? 'Creating Token...' : 'Create Compressed Token'}
          </button>
        </div>
      )}
      {mintAddress && (
        <div className="p-4 bg-green-100 border border-green-300 rounded">
          <h3 className="font-bold">Token Created!</h3>
          <p>Mint Address: <span className="font-mono">{mintAddress}</span></p>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-100 border border-red-300 rounded">
          <h3 className="font-bold">Error</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default CreatorPage;