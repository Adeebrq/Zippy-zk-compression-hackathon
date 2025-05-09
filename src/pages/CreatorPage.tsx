import React, { useEffect, useState } from 'react';
import { LAMPORTS_PER_SOL, PublicKey, Transaction, Keypair,} from '@solana/web3.js';
import { CompressedTokenProgram } from '@lightprotocol/compressed-token';
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddress,
  createInitializeMetadataPointerInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  ExtensionType,
  TYPE_SIZE,
  LENGTH_SIZE,
  getMintLen,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getTokenMetadata,
} from '@solana/spl-token';
import { 
  createInitializeInstruction,
  pack,
} from '@solana/spl-token-metadata';
import type { TokenMetadata } from '@solana/spl-token-metadata';
import { useWalletContext } from '../components/useWalletContext';
import { debounce } from 'lodash';
export interface MintViewData {
  mint: PublicKey;
  transactions: Record<string, string>;
  decimals: number;
  ata?: PublicKey;
}

const CreatorPage = () => {
  const { publicKey, connect, disconnect, connected, connection, signTransaction, sendTransaction } = useWalletContext();
  const [balance, setBalance] = useState<number>(0);
  const [mintAddress, setMintAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mintData, setMintData] = useState<MintViewData | null>(null);
  
  // State variables for token metadata
  const [tokenName, setTokenName] = useState<string>('');
  const [tokenSymbol, setTokenSymbol] = useState<string>('');
  const [tokenDescription, setTokenDescription] = useState<string>('');
  const [tokenDecimals, setTokenDecimals] = useState<number>(9);
  const [tokenImage, setTokenImage] = useState<string>('');
  const [tokenSupply, setTokenSupply] = useState<string>('1000000');
  const [royaltyFeeBps, setRoyaltyFeeBps] = useState<number>(0);
  const [metadataCreated, setMetadataCreated] = useState<boolean>(false);
  
  // Added state for fetched metadata
  const [fetchedMetadata, setFetchedMetadata] = useState<TokenMetadata | null>(null);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState<boolean>(false);

  const fetchBalance = async () => {
    if (publicKey && connection) {
      const balance = await connection.getBalance(publicKey);
      setBalance(balance / LAMPORTS_PER_SOL);
      console.log("Wallet PublicKey:", publicKey.toBase58());
    }
  };

  // Create compressed token function - using connection from props
  const createCompressedToken = async () => {
    if (!publicKey || !connection || !signTransaction || !sendTransaction) {
      setError('Wallet not connected');
      return null;
    }

    // Validate inputs
    if (!tokenName.trim()) {
      setError('Token name is required');
      return null;
    }

    if (!tokenSymbol.trim()) {
      setError('Token symbol is required');
      return null;
    }

    if (isNaN(Number(tokenSupply)) || Number(tokenSupply) <= 0) {
      setError('Token supply must be a positive number');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const mintAmount = Number(tokenSupply);
      const decimals = Number(tokenDecimals);
      const mint = Keypair.generate();

      console.log("compressed mint", mint.publicKey.toBase58());

      // Create metadata object
      const metadata: TokenMetadata = {
        mint: mint.publicKey,
        name: tokenName,
        symbol: tokenSymbol,
        uri: tokenImage, // Using the image URL as URI
        additionalMetadata: tokenDescription ? [["description", tokenDescription]] : []
      };

      // Calculate metadata and mint sizes
      const metadataExtension = TYPE_SIZE + LENGTH_SIZE;
      const metadataLen = pack(metadata).length;
      const mintLen = getMintLen([ExtensionType.MetadataPointer]);

      // Get rent exemption amount - using connection prop from useWallet()
      const mintLamports = await connection.getMinimumBalanceForRentExemption(
        mintLen + metadataExtension + metadataLen
      );

      // Set token program ID
      const tokenProgramId = TOKEN_2022_PROGRAM_ID;

      // 1. MINT CREATION
      // Create instructions for mint account creation
      const [
        createAccountInstruction,
        initializeMintInstruction,
        createTokenPoolIx
      ] = await CompressedTokenProgram.createMint({
        feePayer: publicKey,
        authority: publicKey,
        mint: mint.publicKey,
        decimals,
        freezeAuthority: null,
        rentExemptBalance: mintLamports,
        tokenProgramId,
        mintSize: mintLen,
      });

      // Create metadata pointer instruction
      const initializeMetadataPointerInstruction = createInitializeMetadataPointerInstruction(
        mint.publicKey,
        publicKey,
        mint.publicKey,
        tokenProgramId
      );

      // Create metadata initialization instruction
      const initializeMetadataInstruction = createInitializeInstruction({
        metadata: mint.publicKey,
        updateAuthority: publicKey,
        mint: mint.publicKey,
        mintAuthority: publicKey,
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
        programId: tokenProgramId,
      });

      // Combine all instructions into a transaction
      const createMintTransaction = new Transaction({ feePayer: publicKey }).add(
        createAccountInstruction,
        initializeMetadataPointerInstruction,
        initializeMintInstruction,
        initializeMetadataInstruction,
        createTokenPoolIx
      );

      // Simulate transaction first - using connection prop from useWallet()
      const createMintSimulation = await connection.simulateTransaction(createMintTransaction);
      console.log("simulation", createMintSimulation);

      // Send the transaction
      const createMintTransactionSignature = await sendTransaction(
        createMintTransaction,
        connection,
        {
          signers: [mint],
        }
      );

      console.log(`createMintTransactionSignature: ${createMintTransactionSignature}`);

      // 2. CREATE ASSOCIATED TOKEN ACCOUNT AND MINT TOKENS
      const associatedToken = await getAssociatedTokenAddress(
        mint.publicKey,
        publicKey,
        false,
        tokenProgramId,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Create instructions for ATA creation and minting
      const initializeAssociatedTokenAccountInstruction = createAssociatedTokenAccountInstruction(
        publicKey,
        associatedToken,
        publicKey,
        mint.publicKey,
        tokenProgramId,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const initializeMintToInstruction = createMintToInstruction(
        mint.publicKey,
        associatedToken,
        publicKey,
        mintAmount * 10 ** decimals,
        [],
        tokenProgramId
      );

      // Create transaction for ATA and minting
      const mintToTransaction = new Transaction({ feePayer: publicKey }).add(
        initializeAssociatedTokenAccountInstruction,
        initializeMintToInstruction
      );

      // Simulate transaction - using connection prop from useWallet()
      const mintToSimulation = await connection.simulateTransaction(mintToTransaction);
      console.log("mintToSimulation", mintToSimulation);

      // Send the transaction
      const mintToTransactionSignature = await sendTransaction(
        mintToTransaction,
        connection
      );

      console.log(`mintToTransactionSignature: ${mintToTransactionSignature}`);

      // Create the result object
      const result: MintViewData = {
        mint: mint.publicKey,
        transactions: {
          createMintTransactionSignature,
          mintToTransactionSignature,
        },
        decimals,
        ata: associatedToken,
      };

      setMintData(result);
      setMintAddress(mint.publicKey.toBase58());
      setMetadataCreated(true);
      
      return result;
    } catch (err: any) {
      console.error('Error creating compressed token:', err);
      setError(`Failed to create token: ${err.message || String(err)}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce the createCompressedToken function
  const debouncedCreateCompressedToken = debounce(async () => {
    await createCompressedToken();
  }, 1000);

  // Enhanced metadata fetch function
  const fetchMetadata = async () => {
    if (!mintAddress || !connection) {
      setError('No mint address available or not connected');
      return null;
    }
    
    setIsFetchingMetadata(true);
    setError(null);
    
    try {
      console.log("Fetching metadata for mint:", mintAddress);
      const mintPublicKey = new PublicKey(mintAddress);
      
      const metadata = await getTokenMetadata(
        connection, 
        mintPublicKey,
        'confirmed',
        TOKEN_2022_PROGRAM_ID
      );
      
      if (!metadata) {
        console.log('No metadata found for this mint.');
        setError('No metadata found for this mint');
        return null;
      }
      
      console.log("Fetched metadata:", metadata);
      setFetchedMetadata(metadata);
      return metadata;
    } catch (err: any) {
      console.error('Error fetching token metadata:', err);
      setError(`Failed to fetch metadata: ${err.message || String(err)}`);
      return null;
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  const requestAirdrop = async () => {
    if (!publicKey || !connection) return;
    
    setIsLoading(true);
    try {
      console.log("Requesting airdrop to:", publicKey.toBase58());
      const signature = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);
      await connection.confirmTransaction(signature, 'confirmed');
      await fetchBalance();
      console.log("Airdrop successful:", signature);
    } catch (err: any) {
      setError(`Airdrop failed: ${err.message || String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (publicKey && connection) {
      fetchBalance();
    }
  }, [publicKey, connection]);

  useEffect(() => {
    if (mintAddress && connection && metadataCreated) {
      const timer = setTimeout(() => {
        fetchMetadata();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [mintAddress, connection, metadataCreated]);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-[var(--text-color)]">Compressed Token Creator</h1>
      <div className="mb-6">
        {connected ? (
          <div>
            <p className="mb-2 text-[var(--text-color)]">Connected: <span className="font-mono">{publicKey?.toBase58()}</span></p>
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
          <p className="mb-2 text-[var(--text-color)]">Balance: {balance} SOL</p>
          <button
            onClick={requestAirdrop}
            disabled={isLoading}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded mr-2"
          >
            {isLoading ? 'Processing...' : 'Request Airdrop (1 SOL)'}
          </button>
        </div>
      )}
      
      {connected && !mintAddress && (
        <div className="bg-[var(--bg-color)] p-6 rounded-lg shadow-sm mb-6 border border-[var(--border-color)]">
          <h2 className="text-xl font-semibold mb-4 text-[var(--text-color)]">Token Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-color)] mb-1">Token Name*</label>
              <input
                type="text"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--bg-color)] text-[var(--text-color)]"
                placeholder="My Compressed Token"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--text-color)] mb-1">Token Symbol*</label>
              <input
                type="text"
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--bg-color)] text-[var(--text-color)]"
                placeholder="CTKN"
                maxLength={10}
                required
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--text-color)] mb-1">Description</label>
            <textarea
              value={tokenDescription}
              onChange={(e) => setTokenDescription(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--bg-color)] text-[var(--text-color)]"
              placeholder="A description of your compressed token"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-color)] mb-1">Decimals</label>
              <input
                type="number"
                value={tokenDecimals}
                onChange={(e) => setTokenDecimals(Number(e.target.value))}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--bg-color)] text-[var(--text-color)]"
                min={0}
                max={9}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--text-color)] mb-1">Initial Supply</label>
              <input
                type="text"
                value={tokenSupply}
                onChange={(e) => setTokenSupply(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--bg-color)] text-[var(--text-color)]"
                placeholder="1000000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--text-color)] mb-1">Royalty (basis points)</label>
              <input
                type="number"
                value={royaltyFeeBps}
                onChange={(e) => setRoyaltyFeeBps(Number(e.target.value))}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--bg-color)] text-[var(--text-color)]"
                min={0}
                max={10000}
                placeholder="0-10000 (100 = 1%)"
              />
              <p className="text-xs text-[var(--text-color)] opacity-70 mt-1">100 = 1%, 1000 = 10%</p>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--text-color)] mb-1">Image URL</label>
            <input
              type="text"
              value={tokenImage}
              onChange={(e) => setTokenImage(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--bg-color)] text-[var(--text-color)]"
              placeholder="https://example.com/token-image.png"
            />
            <p className="text-xs text-[var(--text-color)] opacity-70 mt-1">Enter a URL to your token image (recommended size: 512x512px)</p>
          </div>
          
          <div className="flex flex-col space-y-2">
            <button
              onClick={debouncedCreateCompressedToken}
              disabled={isLoading || !tokenName || !tokenSymbol || balance <= 0}
              className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-6 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Token...' : 'Create Compressed Token with Metadata'}
            </button>
            <p className="text-xs text-[var(--text-color)] opacity-70">
              This will create both the token mint and associated metadata.
            </p>
          </div>
        </div>
      )}
      
      {mintAddress && mintData && (
        <div className="p-4 bg-[var(--bg-color)] border border-[var(--border-color)] rounded mb-4">
          <h3 className="font-bold text-[var(--text-color)]">Token Created Successfully!</h3>
          <p className="mt-2 text-[var(--text-color)]">Mint Address: <span className="font-mono">{mintAddress}</span></p>
          <div className="mt-2">
            <p className="text-[var(--text-color)]"><strong>Token Details:</strong></p>
            <ul className="list-disc pl-5 mt-1 text-[var(--text-color)]">
              <li>Name: {tokenName}</li>
              <li>Symbol: {tokenSymbol}</li> 
              <li>Decimals: {tokenDecimals}</li>
              <li>Metadata: {metadataCreated ? 'Created ✓' : 'Pending...'}</li>
              <li>Associated Token Account: <span className="font-mono text-xs">{mintData.ata?.toBase58()}</span></li>
            </ul>
          </div>
          <div className="mt-3">
            <p className="text-[var(--text-color)]"><strong>Transactions:</strong></p>
            <ul className="list-disc pl-5 mt-1 text-[var(--text-color)]">
              <li>
                <span className="font-semibold">Create Mint:</span> 
                <a 
                  href={`https://explorer.solana.com/tx/${mintData.transactions.createMintTransactionSignature}?cluster=devnet`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline ml-1 text-xs"
                >
                  {mintData.transactions.createMintTransactionSignature.slice(0, 12)}...
                </a>
              </li>
              <li>
                <span className="font-semibold">Mint Tokens:</span>
                <a 
                  href={`https://explorer.solana.com/tx/${mintData.transactions.mintToTransactionSignature}?cluster=devnet`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline ml-1 text-xs"
                >
                  {mintData.transactions.mintToTransactionSignature.slice(0, 12)}...
                </a>
              </li>
            </ul>
          </div>
          
          <div className="mt-4 border-t border-[var(--border-color)] pt-3">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-[var(--text-color)]">Token Metadata</h4>
              <button 
                onClick={fetchMetadata}
                disabled={isFetchingMetadata}
                className="bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-3 rounded"
              >
                {isFetchingMetadata ? 'Loading...' : 'Refresh Metadata'}
              </button>
            </div>
            
            {isFetchingMetadata && (
              <div className="text-[var(--text-color)] opacity-70 mt-2">Fetching metadata...</div>
            )}
            
            {fetchedMetadata ? (
              <div className="mt-2 bg-[var(--bg-color)] p-3 rounded border border-[var(--border-color)]">
                <div className="grid grid-cols-2 gap-2 text-sm text-[var(--text-color)]">
                  <div className="font-medium">Name:</div>
                  <div>{fetchedMetadata.name}</div>
                  
                  <div className="font-medium">Symbol:</div>
                  <div>{fetchedMetadata.symbol}</div>
                  
                  <div className="font-medium">URI:</div>
                  <div className="break-all">
                    <a 
                      href={fetchedMetadata.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {fetchedMetadata.uri}
                    </a>
                  </div>
                  
                  {fetchedMetadata.additionalMetadata && fetchedMetadata.additionalMetadata.length > 0 && (
                    <>
                      <div className="font-medium">Additional Metadata:</div>
                      <div>
                        <ul className="list-disc pl-5">
                          {fetchedMetadata.additionalMetadata.map((item, index) => (
                            <li key={index}><span className="font-medium">{item[0]}:</span> {item[1]}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : metadataCreated ? (
              <div className="mt-2 italic text-[var(--text-color)] opacity-70">
                Click "Refresh Metadata" to view the token's metadata
              </div>
            ) : null}
          </div>
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-100 border border-red-300 rounded">
          <h3 className="font-bold text-[var(--text-color)]">Error</h3>
          <p className="text-[var(--text-color)]">{error}</p>
        </div>
      )}
    </div>
  );
};

export default CreatorPage;