// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useEffect, useState } from 'react';
import { LAMPORTS_PER_SOL, PublicKey, Transaction, Keypair, ComputeBudgetProgram } from '@solana/web3.js';
import { CompressedTokenProgram,  getTokenPoolInfos, selectTokenPoolInfo } from '@lightprotocol/compressed-token';
import { calculateComputeUnitPrice } from '@lightprotocol/stateless.js';
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
import { useWalletContext } from '../hooks/useWalletContext';
import { debounce } from 'lodash';
import '../styles/CreatorPage.css';
import { useAnimatedValue } from '../hooks/useAnimatedValue';
import { toast } from 'react-toastify';

import Modal, { SuccessMessage, SuccessTitle, TokenInfo, ShareLink, AddressMono } from '../components/Modal';
import { useThemeContext } from '../hooks/useThemeContext';
import ParticlesBackground from '../components/ParticlesBackground';

export interface MintViewData {
  mint: PublicKey;
  transactions: Record<string, string>;
  decimals: number;
  ata?: PublicKey;
}

const CreatorPage = () => {
  const { publicKey, network, connected, connection, signTransaction, sendTransaction, adminKeypair } = useWalletContext();
  const { theme } = useThemeContext();
  const isDark = theme === 'dark';
  const [balance, setBalance] = useState<number>(0);
  const [mintAddress, setMintAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mintData, setMintData] = useState<MintViewData | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);

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
    }
  };

  // Create compressed token function - using connection from props
  const createCompressedToken = async () => {
    if (!publicKey || !connection || !signTransaction || !sendTransaction) {
      toast.error('Wallet not connected');
      return null;
    }

    // Validate inputs
    if (!tokenName.trim()) {
      toast.error('Token name is required')
      return null;
    }

    if (!tokenSymbol.trim()) {
      toast.error('Token symbol is required');
      return null;
    }

    if (isNaN(Number(tokenSupply)) || Number(tokenSupply) <= 0) {
      toast.error('Token supply must be a positive number');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const mintAmount = Number(tokenSupply);
      const decimals = Number(tokenDecimals);
      const mint = Keypair.generate();


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
      // const createMintSimulation = await connection.simulateTransaction(createMintTransaction);

      // Send the transaction
      const createMintTransactionSignature = await sendTransaction(
        createMintTransaction,
        connection,
        {
          signers: [mint],
        }
      );


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
      // const mintToSimulation = await connection.simulateTransaction(mintToTransaction);


      // Send the transaction
      const mintToTransactionSignature = await sendTransaction(
        mintToTransaction,
        connection
      );


      // Create the initial result object
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

      // Add a delay before proceeding with the transfer
      console.log("Waiting 3 seconds before proceeding with transfer...");
      await new Promise(resolve => setTimeout(resolve, 4500));

      // 3. TRANSFER TOKENS TO PROGRAM WALLET (separate transaction)
      try {
        if (!adminKeypair) {
          throw new Error('Admin keypair not available');
        }
        
        // Get user's ATA for this token (we already have this from minting)
        const userAta = associatedToken;
        
        // We need to get the token pool info for the mint
        const tokenPoolInfos = await getTokenPoolInfos(connection, mint.publicKey);
        const tokenPoolInfo = selectTokenPoolInfo(tokenPoolInfos);
        
        // Get active state trees
        const activeStateTrees = await connection.getStateTreeInfos();
        const treeInfo = activeStateTrees[0]; // Use the first available tree
        
        // Create compress instruction using CompressedTokenProgram.compress
        const compressIx = await CompressedTokenProgram.compress({
          payer: publicKey,
          owner: publicKey,
          source: userAta,
          toAddress: [adminKeypair.publicKey],
          amount: [BigInt(mintAmount) * BigInt(10 ** decimals)],
          mint: mint.publicKey,
          tokenPoolInfo: tokenPoolInfo,
          outputStateTreeInfo: treeInfo,
        });
        
        // Add compute budget instructions
        const computeUnitLimitIx = ComputeBudgetProgram.setComputeUnitLimit({ units: 120_000 });
        const computeUnitPriceIx = ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: calculateComputeUnitPrice(20_000, 120_000),
        });
        
        // Create a transaction
        const transferTx = new Transaction({ feePayer: publicKey });
        
        // Add compute budget instructions
        transferTx.add(computeUnitLimitIx);
        transferTx.add(computeUnitPriceIx);
        
        // Add compress instruction
        transferTx.add(compressIx);
        
        // Send and confirm the transaction
        const transferTxSignature = await sendTransaction(
          transferTx,
          connection
        );
        
        // Update the result object with the transfer transaction
        result.transactions.transferTransactionSignature = transferTxSignature;
        
        toast.success("Token transferred to program wallet's account successfully! 🎉", {
          position: "top-right",
          autoClose: 3000,
        });
      } catch (transferError) {
        console.error('Error transferring tokens to program wallet:', transferError);
        toast.error(`Token minted but transfer failed: ${transferError instanceof Error ? transferError.message : String(transferError)}`);
      }

      return result;
    } catch (err: any) {
      console.error('Error creating compressed token:', err);
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


      toast.success("Fetched metadata successfully!");

      return metadata;
    } catch (err: any) {
      console.error('Error fetching token metadata:', err);
      return null;
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  useEffect(()=>{
    if(publicKey){
      toast.success("Wallet fetched Sucessfully")
    }

  },[publicKey])

  const requestAirdrop = async () => {
    if (!publicKey || !connection) return;

    setIsLoading(true);
    try {
      const signature = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);
      await connection.confirmTransaction(signature, 'confirmed');
      await fetchBalance();
      toast.success("Recieved Airdrop! 🎉");
  
    } catch (err: any) {
      setError(`Airdrop failed: ${err.message || String(err)}`);
      toast.error("An error has occured");
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

  // Update the effect to only show modal on initial creation
  useEffect(() => {
    if (mintAddress && mintData && fetchedMetadata && !hasShownModal) {
      setShowSuccessModal(true);
      setHasShownModal(true);
    }
  }, [mintAddress, mintData, fetchedMetadata, hasShownModal]);

  return (
    <>
      <ParticlesBackground />
      {!connected ? (
        <div className="unconnected-container">
          <div id="Connection-message-wrapper">
            <p>Welcome to the Creator portal! </p>
            <span id="Connection-message">Connect your wallet to start minting your CPOP Tokens! 🤘 </span>
          </div>
        </div>
      ) : (
        <>
          <div className="titleBody">
            <h1 className="page-title">Compressed Token Generator</h1>
            {connected && (
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
            )}
          </div>
          <div className="creator-container">
            {connected && !mintAddress && (
              <div className="token-details-card">
                <h2 className="section-heading-parent">Mint tokens with a single tap</h2>
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
                    <li>
                      <span className="transaction-type">Share Link:</span>
                      <ShareLink 
                        href={`/ClaimPage/${mintAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        $isDark={isDark}
                      >
                        {`${window.location.origin}/ClaimPage/${mintAddress}`}
                      </ShareLink>
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

            {/* {error && (
              <div className="error-card">
                <h3 className="error-heading">Error</h3>
                <p className="error-message">{error}</p>
              </div>
            )} */}
          </div>
        </>
      )}

      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Compressed token minted successfully!"
        mintAddress={mintAddress}
        fetchedMetadata={fetchedMetadata}
      >
        <SuccessMessage>
          <SuccessTitle>🎉 Congratulations! Your token has been created successfully!</SuccessTitle>
          <TokenInfo $isDark={isDark}>Token Name: {fetchedMetadata?.name}</TokenInfo>
          <TokenInfo $isDark={isDark}>Token Symbol: {fetchedMetadata?.symbol}</TokenInfo>
          <TokenInfo $isDark={isDark}>Mint Address: <AddressMono>{mintAddress}</AddressMono></TokenInfo>
          <TokenInfo $isDark={isDark}>Share this link to airdrop your tokens:</TokenInfo>
          <ShareLink 
            href={`/ClaimPage/${mintAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            $isDark={isDark}
          >
            {`${window.location.origin}/ClaimPage/${mintAddress}`}
          </ShareLink>
        </SuccessMessage>
      </Modal>
    </>
  );
};

export default CreatorPage;