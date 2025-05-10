import React, { useEffect, useState } from 'react';
import { LAMPORTS_PER_SOL, PublicKey, Transaction, Keypair } from '@solana/web3.js';
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
import './CreatorPage.css';
import { useAnimatedValue } from '../hooks/useAnimatedValue';
// import { useFetchMetadataTokens } from "../components/useFetchMetadataTokens";

export interface MintViewData {
  mint: PublicKey;
  transactions: Record<string, string>;
  decimals: number;
  ata?: PublicKey;
}

const CreatorPage = () => {
  const { publicKey, connect, disconnect, network, connected, connection, signTransaction, sendTransaction } = useWalletContext();
  // const { tokens, loading,} = useFetchMetadataTokens();
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

  // Use a key to force animation reset on connection changes
  const [animationKey, setAnimationKey] = useState(0);
  const animatedBalance = useAnimatedValue(balance, 1000);

  // Reset animation when connection state changes
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
    if (!connected) {
      setBalance(0);
    }
  }, [connected]);

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
    <>
    {!connected ? (
       <div className="unconnected-container">
       <div id="Connection-message-wrapper">
       <p>Welcome to the Creator portal! </p>
       <span id="Connection-message">Connect your wallet to start minting your CPOP Tokens! 🤘 </span>
       </div>
      </div>
    )
      : (
      <>
      <div className="titleBody">
        <h1 className="page-title">Compressed Token Generator</h1>
        {connected &&
        <div className='titleBodyLeft'>
          <div>
            <p>{network} <span className="connection-indicator"></span></p>
            <p id="connectionStatus">Connection stable</p>
          </div>
          <div className="vertical-separator"></div>
          <div className='balanceSection'>
            <div className="balanceBody">
              <p key={animationKey} className='animatedValue'>{animatedBalance.toFixed(2)} SOL</p>
              <button
                onClick={requestAirdrop}
                disabled={isLoading}
                className={`airdrop-button ${isLoading ? 'disabled' : ''}`}
              >
                {isLoading ? 'Processing...' : 'Request Airdrop'}
              </button>
            </div>
          </div>
        </div>
        }
      </div>
      <div className="creator-container">
        {connected && !mintAddress && (
          <div className="token-details-card">
            <h2 className="section-heading-parent">Compressed Token Mint</h2>
            <h2 className="section-heading">Token Details</h2>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Token Name*</label>
                <input
                  type="text"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  className="form-input"
                  placeholder="My Compressed Token"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Token Symbol*</label>
                <input
                  type="text"
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value)}
                  className="form-input"
                  placeholder="CTKN"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                value={tokenDescription}
                onChange={(e) => setTokenDescription(e.target.value)}
                className="form-textarea"
                placeholder="A description of your compressed token"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Image URL</label>
              <input
                type="text"
                value={tokenImage}
                onChange={(e) => setTokenImage(e.target.value)}
                className="form-input"
                placeholder="https://example.com/token-image.png"
              />
            </div>
            <p style={{fontSize: '20px', fontWeight: "600", marginTop: '60px'}}>Token Settings</p>

            <div className="form-grid-triple">
              <div className="form-group">
                <label className="form-label">Decimals</label>
                <input
                  type="number"
                  value={tokenDecimals}
                  onChange={(e) => setTokenDecimals(Number(e.target.value))}
                  className="form-input"
                  min={0}
                  max={9}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Initial Supply</label>
                <input
                  type="text"
                  value={tokenSupply}
                  onChange={(e) => setTokenSupply(e.target.value)}
                  className="form-input"
                  placeholder="1000000"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Royalty (basis points)</label>
                <input
                  type="number"
                  value={royaltyFeeBps}
                  onChange={(e) => setRoyaltyFeeBps(Number(e.target.value))}
                  className="form-input"
                  min={0}
                  max={10000}
                  placeholder="0-10000 (100 = 1%)"
                />
                <p className="form-hint">100 = 1%, 1000 = 10%</p>
              </div>
            </div>

            <div className="button-container">
              <button
                onClick={debouncedCreateCompressedToken}
                disabled={isLoading || !tokenName || !tokenSymbol || balance <= 0}
                className={`create-token-button ${(isLoading || !tokenName || !tokenSymbol || balance <= 0) ? 'disabled' : ''}`}
              >
                {isLoading ? 'Creating Token...' : 'Create Compressed Token with Metadata'}
              </button>
              <p className="button-hint">
                This will create both the token mint and associated metadata.
              </p>
            </div>
          </div>
        )}

        {/* {connected && (
          <>
            <p>{publicKey || connected ? "SPL Tokens" : null}</p>
            {publicKey && tokens.map((token) => (
              <div key={token?.tokenName} className="tokenCard">
                <img
                  src={token.uri}
                  alt={`${token.tokenName} logo`}
                  className="tokenLogo"
                />
                <div className="tokenInfo">
                  <div className="tokenHeader">
                    <p className="tokenName">{token?.tokenName}</p>
                    <a href={`https://explorer.solana.com/address/${token.mint}?cluster=devnet`} target="_blank">
                      <p style={{color: "#6B77FF", textDecoration: "none"}}>View on Explorer</p>
                    </a>
                  </div>
                  <p className="tokenSymbol">{token?.symbol}</p>
                  <p className="tokenAmount">amount: {token?.amount}</p>
                </div>
              </div>
            ))}
          </>
        )} */}

        {mintAddress && mintData && (
          <div className="token-success-card">
            <h3 className="success-heading">Token Created Successfully! 🤘</h3>
            <p className="mint-address">Mint Address: <span className="address-mono">{mintAddress}</span></p>
            <div className="token-info-section">
              <p className="token-info-heading">Token Details:</p>
              <ul className="token-info-list">
                <li>Name: {tokenName}</li>
                <li>Symbol: {tokenSymbol}</li>
                <li>Decimals: {tokenDecimals}</li>
                <li>Metadata: {metadataCreated ? 'Created ✓' : 'Pending...'}</li>
                <li>Associated Token Account: <span className="address-mono small">{mintData.ata?.toBase58()}</span></li>
              </ul>
            </div>
            <div className="transactions-section">
              <p className="transactions-heading">Transactions:</p>
              <ul className="transactions-list">
                <li>
                  <span className="transaction-type">Create Mint Signature:</span>
                  <a
                    href={`https://explorer.solana.com/tx/${mintData.transactions.createMintTransactionSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transaction-link"
                  >
                    {mintData.transactions.createMintTransactionSignature.slice(0, 12)}...
                    (View on explorer)
                  </a>
                </li>
                <li>
                  <span className="transaction-type">Mint Tokens Signature:</span>
                  <a
                    href={`https://explorer.solana.com/tx/${mintData.transactions.mintToTransactionSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transaction-link"
                  >
                    {mintData.transactions.mintToTransactionSignature.slice(0, 12)}...
                    (View on explorer)
                  </a>
                </li>
              </ul>
            </div>

            <div className="metadata-section">
              <div className="metadata-header">
                <h4 className="metadata-heading">Token Metadata</h4>
                <button
                  onClick={fetchMetadata}
                  disabled={isFetchingMetadata}
                  className={`refresh-metadata-button ${isFetchingMetadata ? 'disabled' : ''}`}
                >
                  {isFetchingMetadata ? 'Loading...' : 'Refresh Metadata'}
                </button>
              </div>

              {isFetchingMetadata && (
                <div className="loading-message">Fetching metadata...</div>
              )}

              {fetchedMetadata ? (
                <div className="metadata-card">
                  <div className="metadata-grid">
                    <div className="metadata-key">Name:</div>
                    <div className="metadata-value">{fetchedMetadata.name}</div>

                    <div className="metadata-key">Symbol:</div>
                    <div className="metadata-value">{fetchedMetadata.symbol}</div>

                    <div className="metadata-key">URI:</div>
                    <div className="metadata-value break-all">
                      {fetchedMetadata.uri &&
                       <a
                       href={fetchedMetadata.uri}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="metadata-link"
                     >
                       {fetchedMetadata.uri}
                     </a>
                      }
                      Nil
                    </div>

                    {fetchedMetadata.additionalMetadata && fetchedMetadata.additionalMetadata.length > 0 && (
                      <>
                        <div className="metadata-key">Additional Metadata:</div>
                        <div className="metadata-value">
                          <ul className="additional-metadata-list">
                            {fetchedMetadata.additionalMetadata.map((item, index) => (
                              <li key={index}><span className="metadata-item-key">{item[0]}:</span> {item[1]}</li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : metadataCreated ? (
                <div className="metadata-prompt">
                  Click "Refresh Metadata" to view the token's metadata
                </div>
              ) : null}
            </div>
          </div>
        )}

        {error && (
          <div className="error-card">
            <h3 className="error-heading">Error</h3>
            <p className="error-message">{error}</p>
          </div>
        )}
      </div>
      </>
    )}
  
    </>
  );
};

export default CreatorPage;