// Made some mistake here, stored for reference 


// import React, { useEffect, useState } from 'react';
// import { LAMPORTS_PER_SOL, PublicKey, Transaction, Keypair, SystemProgram, ComputeBudgetProgram  } from '@solana/web3.js';
// import { CompressedTokenProgram } from '@lightprotocol/compressed-token';
// import {
//   TOKEN_2022_PROGRAM_ID,
//   getAssociatedTokenAddress,
//   createInitializeMetadataPointerInstruction,
//   createUpdateFieldInstruction,
//   getMint,
//   createAssociatedTokenAccountInstruction,
//   createMintToInstruction,
// } from '@solana/spl-token';
// import { 
//   createInitializeInstruction, 
// } from '@solana/spl-token-metadata';
// import type {  TokenMetadata 
// } from '@solana/spl-token-metadata';
// import { useWalletContext } from '../components/useWalletContext';
// import { debounce } from 'lodash';


// const CreatorPage = () => {
//   const { publicKey, connect, disconnect, connected, connection, signTransaction } = useWalletContext();
//   const [balance, setBalance] = useState<number>(0);
//   const [mintAddress, setMintAddress] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
  
//   // State variables for token metadata
//   const [tokenName, setTokenName] = useState<string>('');
//   const [tokenSymbol, setTokenSymbol] = useState<string>('');
//   const [tokenDescription, setTokenDescription] = useState<string>('');
//   const [tokenDecimals, setTokenDecimals] = useState<number>(9);
//   const [tokenImage, setTokenImage] = useState<string>('');
//   const [tokenSupply, setTokenSupply] = useState<string>('1000000');
//   const [royaltyFeeBps, setRoyaltyFeeBps] = useState<number>(0);
//   const [metadataCreated, setMetadataCreated] = useState<boolean>(false);

//   const fetchBalance = async () => {
//     if (publicKey && connection) {
//       const balance = await connection.getBalance(publicKey);
//       setBalance(balance / LAMPORTS_PER_SOL);
//       console.log("Wallet PublicKey:", publicKey.toBase58());
//     }
//   };

//   // Debounce the createCompressedToken function to prevent multiple clicks
//   const debouncedCreateCompressedToken = debounce(async () => {
//     if (!publicKey || !signTransaction || !connection) {
//       setError('Wallet not connected');
//       return;
//     }

//     // Validate inputs
//     if (!tokenName.trim()) {
//       setError('Token name is required');
//       return;
//     }

//     if (!tokenSymbol.trim()) {
//       setError('Token symbol is required');
//       return;
//     }

//     if (isNaN(Number(tokenSupply)) || Number(tokenSupply) <= 0) {
//       setError('Token supply must be a positive number');
//       return;
//     }

//     setIsLoading(true);
//     setError(null);

//     try {
//       // Generate a new keypair for the mint
//       let mintKeypair = Keypair.generate();
//       console.log("Generated Mint PublicKey:", mintKeypair.publicKey.toBase58());

//       // Log TOKEN_2022_PROGRAM_ID
//       console.log("TOKEN_2022_PROGRAM_ID:", TOKEN_2022_PROGRAM_ID.toBase58());

//       // Get a fresh blockhash
//       const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');

//       // Step 1: Create the compressed token mint using CompressedTokenProgram
//       // Get minimum rent for mint account
//       const rentExemptBalance = await connection.getMinimumBalanceForRentExemption(82);
      
//       // Create instructions for the token mint
//       const mintInstructions = await CompressedTokenProgram.createMint({
//         feePayer: publicKey,
//         mint: mintKeypair.publicKey,
//         decimals: Number(tokenDecimals),
//         authority: publicKey,
//         freezeAuthority: publicKey,
//         rentExemptBalance,
//         tokenProgramId: TOKEN_2022_PROGRAM_ID,
//       });

//       // Create a transaction
//       const transaction = new Transaction({ 
//         recentBlockhash: blockhash,
//         feePayer: publicKey 
//       });
      
//       // Add mint instructions
//       if (Array.isArray(mintInstructions)) {
//         transaction.add(...mintInstructions);
//       } else {
//         transaction.add(mintInstructions);
//       }
      
//       // Sign with the mint keypair
//       transaction.partialSign(mintKeypair);

//       // Sign with the wallet
//       const signedTransaction = await signTransaction(transaction);

//       // Simulate transaction to catch errors early
//       const simulation = await connection.simulateTransaction(signedTransaction);
//       if (simulation.value.err) {
//         console.error("Mint creation simulation failed:", simulation.value.logs);
//         throw new Error("Mint creation simulation failed");
//       }

//       // Send and confirm transaction
//       const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
//         skipPreflight: false,
//         preflightCommitment: 'finalized',
//         maxRetries: 3,
//       });
//       console.log("Mint creation transaction sent:", signature);

//       // Wait for confirmation
//       await connection.confirmTransaction(
//         { signature, blockhash, lastValidBlockHeight },
//         'finalized'
//       );

//       console.log("Mint creation confirmed:", signature);
//       console.log("Mint PublicKey (Base58):", mintKeypair.publicKey.toBase58());

//       // Verify mint account exists
//       const mintAccountInfo = await connection.getAccountInfo(mintKeypair.publicKey);
//       if (!mintAccountInfo) {
//         throw new Error("Mint account creation failed");
//       }

//       // Set mint address
//       const mintAddressString = mintKeypair.publicKey.toBase58();
//       setMintAddress(mintAddressString);

//       // Create metadata for the token
//       await createTokenMetadata(mintKeypair.publicKey);
//     } catch (err: any) {
//       console.error('Detailed error:', err);
//       if (err.logs) {
//         console.log("Transaction logs:", err.logs);
//       }
//       // Fetch transaction details if signature is available
//       if (err.signature) {
//         const txDetails = await connection.getTransaction(err.signature, {
//           commitment: 'finalized',
//           maxSupportedTransactionVersion: 0,
//         });
        
//         if (txDetails?.meta?.logMessages) {
//           console.log("Detailed transaction logs:", txDetails.meta.logMessages);
//         }
//       }
//       setError(`Failed to create token: ${err.message || String(err)}`);
//     } finally {
//       setIsLoading(false);
//     }
//   }, 1000); // 1-second debounce

//   // Add this createTokenMetadata function to your CreatorPage component

//   const createTokenMetadata = async (mintPublicKey: PublicKey) => {
//     if (!publicKey || !connection || !signTransaction) {
//       setError('Wallet not connected');
//       return;
//     }
  
//     setIsLoading(true);
//     setError(null);
  
//     try {
//       console.log("Creating metadata for mint:", mintPublicKey.toBase58());
  
//       // Create a PDA for metadata
//       const [metadataAddress] = await PublicKey.findProgramAddress(
//         [Buffer.from('metadata'), TOKEN_2022_PROGRAM_ID.toBuffer(), mintPublicKey.toBuffer()],
//         TOKEN_2022_PROGRAM_ID
//       );
//       console.log("Generated metadata address:", metadataAddress.toBase58());
  
//       // Prepare metadata object according to TokenMetadata interface
//       const metadata: TokenMetadata = {
//         mint: mintPublicKey,
//         name: tokenName,
//         symbol: tokenSymbol,
//         uri: tokenImage, // Using the image URL as URI
//         additionalMetadata: tokenDescription ? [["description", tokenDescription]] : []
//       };
  
//       // Implementation with retry mechanism for 0x6 error
//       let maxRetries = 3;
//       let retryCount = 0;
//       let success = false;
  
//       while (!success && retryCount < maxRetries) {
//         try {
//           // Get a fresh blockhash for each attempt
//           const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
  
//           // Create transaction with higher priority fee to avoid congestion issues
//           const transaction = new Transaction({
//             recentBlockhash: blockhash,
//             feePayer: publicKey
//           });
  
//           // Add initialize metadata pointer instruction
//           const metadataPointerIx = createInitializeMetadataPointerInstruction(
//             mintPublicKey,         // mint
//             publicKey,             // authority
//             mintPublicKey,    
//             TOKEN_2022_PROGRAM_ID  // programId
//           )
//           transaction.add(metadataPointerIx);

//           // Add initialize metadata instruction
//           const initMetadataIx = createInitializeInstruction({
//             programId: TOKEN_2022_PROGRAM_ID,
//             mint: mintPublicKey,
//             metadata: metadataAddress,
//             name: metadata.name,
//             symbol: metadata.symbol,
//             uri: metadata.uri,
//             mintAuthority: publicKey,
//             updateAuthority: publicKey,
//           });
//           transaction.add(initMetadataIx);
  
//           // If there's additional metadata like description, add update field instructions
//           if (tokenDescription) {
//             const updateDescriptionIx = createUpdateFieldInstruction({
//               programId: TOKEN_2022_PROGRAM_ID,
//               metadata: metadataAddress,
//               updateAuthority: publicKey,
//               field: "description",
//               value: tokenDescription,
//             });
//             transaction.add(updateDescriptionIx);
//           }
  
//           // Set transaction priority fee to help avoid congestion issues
//           // This is a key part of resolving 0x6 errors
//           transaction.recentBlockhash = blockhash;
          
//           // Simulate transaction
//           const simSignedTx = await signTransaction(transaction);
//           const simulation = await connection.simulateTransaction(simSignedTx);
//           if (simulation.value.err) {
//             console.error(`Metadata creation simulation failed (attempt ${retryCount + 1}):`, simulation.value.logs);
//             throw new Error("Metadata creation simulation failed");
//           }
  
//           // Sign transaction
//           const signedTransaction = await signTransaction(transaction);
  
//           // Send transaction with higher priority to avoid congestion
//           const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
//             skipPreflight: false,
//             preflightCommitment: 'finalized',
//             maxRetries: 3,
//           });
  
//           // Wait for confirmation with longer timeout
//           await connection.confirmTransaction(
//             { signature, blockhash, lastValidBlockHeight },
//             'finalized'
//           );
  
//           console.log("Metadata creation confirmed:", signature);
//           setMetadataCreated(true);
//           success = true;
//         } catch (err: any) {
//           retryCount++;
//           console.error(`Metadata creation attempt ${retryCount} failed:`, err);
          
//           if (err.message && err.message.includes('0x6')) {
//             console.log("Detected 0x6 error (account or token already in use), waiting before retry...");
//             // Wait for a bit before retrying to let pending transactions resolve
//             await new Promise(resolve => setTimeout(resolve, 5000 * retryCount));
//           } else if (retryCount >= maxRetries) {
//             throw err; // If it's not a 0x6 error and we're out of retries, rethrow
//           }
//         }
//       }
  
//       if (!success) {
//         throw new Error("Failed to create token metadata after multiple attempts");
//       }
//     } catch (err: any) {
//       console.error('Metadata creation error:', err);
//       if (err.logs) {
//         console.log("Transaction logs:", err.logs);
//       }
//       setError(`Failed to create token metadata: ${err.message || String(err)}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };




//   const mintInitialSupply = async () => {
//     if (!mintAddress || !publicKey || !connection || !signTransaction) {
//       setError('Cannot mint tokens: Missing required information');
//       return;
//     }

//     setIsLoading(true);
//     setError(null);

//     try {
//       const mintPublicKey = new PublicKey(mintAddress);
//       console.log("Mint PublicKey for token supply:", mintPublicKey.toBase58());
      
//       // Get associated token address
//       const associatedTokenAddress = await getAssociatedTokenAddress(
//         mintPublicKey,
//         publicKey,
//         false,
//         TOKEN_2022_PROGRAM_ID
//       );
//       console.log("Associated Token Address:", associatedTokenAddress.toBase58());
      
//       // Get fresh blockhash
//       const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      
//       // Create a transaction for minting tokens
//       const transaction = new Transaction({
//         recentBlockhash: blockhash,
//         feePayer: publicKey,
//       });
      
//       // Check if ATA exists, if not create it
//       const ataInfo = await connection.getAccountInfo(associatedTokenAddress);
//       if (!ataInfo) {
//         console.log("Creating new Associated Token Account");
//         // Create Associated Token Account if it doesn't exist
//         const createAtaIx = createAssociatedTokenAccountInstruction(
//           publicKey, // payer
//           associatedTokenAddress, // ATA address
//           publicKey, // owner
//           mintPublicKey, // mint
//           TOKEN_2022_PROGRAM_ID // programId
//         );
//         transaction.add(createAtaIx);
//       } else {
//         console.log("Associated Token Account already exists");
//       }
      
//       // Add mint-to instruction
//       const mintAmount = BigInt(Number(tokenSupply) * Math.pow(10, tokenDecimals));
//       console.log("Minting amount (with decimals):", mintAmount.toString());
      
//       const mintToIx = createMintToInstruction(
//         mintPublicKey, // mint
//         associatedTokenAddress, // destination
//         publicKey, // authority
//         mintAmount, // amount
//         [], // signers (empty array as we're using the transaction signer)
//         TOKEN_2022_PROGRAM_ID // programId
//       );
//       transaction.add(mintToIx);
      
//       // Simulate transaction
//       const signedTransactionSim = await signTransaction(transaction);
//       const simulation = await connection.simulateTransaction(signedTransactionSim);
//       if (simulation.value.err) {
//         console.error("Minting simulation failed:", simulation.value.logs);
//         throw new Error("Minting simulation failed");
//       }

//       // Sign with wallet
//       const signedTransaction = await signTransaction(transaction);
      
//       // Send and confirm transaction
//       const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
//         skipPreflight: false,
//         preflightCommitment: 'finalized',
//         maxRetries: 3,
//       });
      
//       await connection.confirmTransaction(
//         { signature, blockhash, lastValidBlockHeight },
//         'finalized'
//       );
      
//       console.log("Initial supply minted:", signature);
//       console.log("Token supply minted to:", associatedTokenAddress.toBase58());
//     } catch (err: any) {
//       console.error('Minting error:', err);
//       if (err.logs) {
//         console.log("Transaction logs:", err.logs);
//       }
//       setError(`Failed to mint initial supply: ${err.message || String(err)}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const requestAirdrop = async () => {
//     if (!publicKey || !connection) return;
    
//     setIsLoading(true);
//     try {
//       console.log("Requesting airdrop to:", publicKey.toBase58());
//       const signature = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);
//       await connection.confirmTransaction(signature, 'confirmed');
//       await fetchBalance();
//       console.log("Airdrop successful:", signature);
//     } catch (err: any) {
//       setError(`Airdrop failed: ${err.message || String(err)}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (publicKey && connection) {
//       fetchBalance();
//       console.log("ZK Compressed Token Program:", "ZK Compressed Token Program ID would be logged here if available");
//     }
//   }, [publicKey, connection]);

//   return (
//     <div className="p-4 max-w-3xl mx-auto">
//       <h1 className="text-2xl font-bold mb-4">Compressed Token Creator</h1>
//       <div className="mb-6">
//         {connected ? (
//           <div>
//             <p className="mb-2">Connected: <span className="font-mono">{publicKey?.toBase58()}</span></p>
//             <button onClick={disconnect} className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded">
//               Disconnect
//             </button>
//           </div>
//         ) : (
//           <button onClick={connect} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
//             Connect Wallet
//           </button>
//         )}
//       </div>
      
//       {connected && (
//         <div className="mb-6">
//           <p className="mb-2">Balance: {balance} SOL</p>
//           <button
//             onClick={requestAirdrop}
//             disabled={isLoading}
//             className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded mr-2"
//           >
//             {isLoading ? 'Processing...' : 'Request Airdrop (1 SOL)'}
//           </button>
//         </div>
//       )}
      
//       {connected && !mintAddress && (
//         <div className="bg-gray-50 p-6 rounded-lg shadow-sm mb-6">
//           <h2 className="text-xl font-semibold mb-4">Token Details</h2>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Token Name*</label>
//               <input
//                 type="text"
//                 value={tokenName}
//                 onChange={(e) => setTokenName(e.target.value)}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 placeholder="My Compressed Token"
//                 required
//               />
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Token Symbol*</label>
//               <input
//                 type="text"
//                 value={tokenSymbol}
//                 onChange={(e) => setTokenSymbol(e.target.value)}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 placeholder="CTKN"
//                 maxLength={10}
//                 required
//               />
//             </div>
//           </div>
          
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
//             <textarea
//               value={tokenDescription}
//               onChange={(e) => setTokenDescription(e.target.value)}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//               placeholder="A description of your compressed token"
//               rows={3}
//             />
//           </div>
          
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Decimals</label>
//               <input
//                 type="number"
//                 value={tokenDecimals}
//                 onChange={(e) => setTokenDecimals(Number(e.target.value))}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 min={0}
//                 max={9}
//               />
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Initial Supply</label>
//               <input
//                 type="text"
//                 value={tokenSupply}
//                 onChange={(e) => setTokenSupply(e.target.value)}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 placeholder="1000000"
//               />
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Royalty (basis points)</label>
//               <input
//                 type="number"
//                 value={royaltyFeeBps}
//                 onChange={(e) => setRoyaltyFeeBps(Number(e.target.value))}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 min={0}
//                 max={10000}
//                 placeholder="0-10000 (100 = 1%)"
//               />
//               <p className="text-xs text-gray-500 mt-1">100 = 1%, 1000 = 10%</p>
//             </div>
//           </div>
          
//           <div className="mb-6">
//             <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
//             <input
//               type="text"
//               value={tokenImage}
//               onChange={(e) => setTokenImage(e.target.value)}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//               placeholder="https://example.com/token-image.png"
//             />
//             <p className="text-xs text-gray-500 mt-1">Enter a URL to your token image (recommended size: 512x512px)</p>
//           </div>
          
//           <div className="flex flex-col space-y-2">
//             <button
//               onClick={debouncedCreateCompressedToken}
//               disabled={isLoading || !tokenName || !tokenSymbol || balance <= 0}
//               className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-6 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
//             >
//               {isLoading ? 'Creating Token...' : 'Create Compressed Token with Metadata'}
//             </button>
//             <p className="text-xs text-gray-500">
//               This will create both the token mint and associated metadata.
//             </p>
//           </div>
//         </div>
//       )}
      
//       {mintAddress && (
//         <div className="p-4 bg-green-100 border border-green-300 rounded mb-4">
//           <h3 className="font-bold">Token Created Successfully!</h3>
//           <p className="mt-2">Mint Address: <span className="font-mono">{mintAddress}</span></p>
//           <div className="mt-2">
//             <p><strong>Token Details:</strong></p>
//             <ul className="list-disc pl-5 mt-1">
//               <li>Name: {tokenName}</li>
//               <li>Symbol: {tokenSymbol}</li> 
//               <li>Decimals: {tokenDecimals}</li>
//               <li>Metadata: {metadataCreated ? 'Created ✓' : 'Pending...'}</li>
//             </ul>
//           </div>
//         </div>
//       )}
      
//       {mintAddress && (
//         <div className="p-4 bg-blue-50 border border-blue-200 rounded mb-4">
//           <h3 className="font-bold">Mint Initial Supply</h3>
//           <p className="mt-2">Ready to mint {tokenSupply} {tokenSymbol} tokens to your wallet.</p>
//           <button 
//             className="mt-3 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md"
//             onClick={mintInitialSupply}
//             disabled={isLoading}
//           >
//             {isLoading ? 'Processing...' : `Mint ${tokenSupply} ${tokenSymbol}`}
//           </button>
//         </div>
//       )}
      
//       {error && (
//         <div className="p-4 bg-red-100 border border-red-300 rounded">
//           <h3 className="font-bold">Error</h3>
//           <p>{error}</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CreatorPage;