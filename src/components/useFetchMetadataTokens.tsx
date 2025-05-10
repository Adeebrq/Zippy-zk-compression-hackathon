// import { useState, useEffect } from 'react';
// import { PublicKey } from '@solana/web3.js';
// import { 
//   TOKEN_2022_PROGRAM_ID, 
//   getMint, 
//   getExtensionTypes,
//   ExtensionType,
//   getTokenMetadata,
//   MintLayout
// } from '@solana/spl-token';
// import { useWalletContext } from './useWalletContext';

// // Define interfaces for our token data
// interface TokenData {
//   mint: string;
//   amount: number;
//   decimals: number;
//   tokenName: string;
//   symbol: string;
//   uri?: string;
//   extensions: string[];
//   metadata?: any; // Added to store the complete metadata object
// }

// /**
//  * Custom hook to fetch metadata for tokens minted by the user
//  * Limited to the first 10 tokens for performance
//  */
// export const useFetchMetadataTokens = () => {
//   const { connected, publicKey, connection } = useWalletContext();
//   const [tokens, setTokens] = useState<TokenData[]>([]);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
//   const MAX_TOKENS = 10; // Limit to first 10 tokens

//   // Helper function to get token metadata
//   const getTokenMetadataInfo = async (mintAddress: PublicKey) => {
//     try {
//       return await getTokenMetadata(
//         connection,
//         mintAddress,
//         'confirmed',
//         TOKEN_2022_PROGRAM_ID
//       );
//     } catch (err) {
//       console.log(`No metadata found for mint ${mintAddress.toString()}:`, err);
//       return null;
//     }
//   };

//   useEffect(() => {
//     const fetchMintedTokens = async () => {
//       if (!publicKey || !connected) {
//         setTokens([]);
//         return;
//       }

//       try {
//         setLoading(true);
//         setError(null);

//         // Get all program accounts for TOKEN_2022_PROGRAM_ID
//         const accounts = await connection.getProgramAccounts(
//           TOKEN_2022_PROGRAM_ID,
//           {
//             commitment: 'confirmed',
//           }
//         );

//         console.log(`Found ${accounts.length} total token accounts`);

//         // Filter accounts that are mint accounts and where the wallet is the mint authority
//         const mintAccounts = accounts.filter(account => {
//           try {
//             const data = account.account.data;
//             // Check if this is a mint account by verifying the data length
//             if (data.length !== MintLayout.span) {
//               return false;
//             }

//             // Parse the mint account data
//             const mintInfo = MintLayout.decode(data);
            
//             // Check if the wallet is the mint authority
//             return mintInfo.mintAuthority && 
//                    mintInfo.mintAuthority.equals(publicKey);
//           } catch (err) {
//             console.error('Error parsing account:', err);
//             return false;
//           }
//         });

//         console.log(`Found ${mintAccounts.length} mint accounts where wallet is authority`);
        
//         // Limit to first 10 mint accounts
//         const limitedMintAccounts = mintAccounts.slice(0, MAX_TOKENS);
//         console.log(`Processing only the first ${limitedMintAccounts.length} mint accounts`);

//         // Process each limited mint account
//         const mintedTokens = await Promise.all(
//           limitedMintAccounts.map(async (account) => {
//             try {
//               const mintAddress = account.pubkey;
//               const mintAddressStr = mintAddress.toString();
              
//               // Get mint info with extensions
//               const mintInfo = await getMint(
//                 connection,
//                 mintAddress,
//                 'confirmed',
//                 TOKEN_2022_PROGRAM_ID
//               );

//               // Get extension types
//               const extensionTypes = getExtensionTypes(mintInfo.tlvData);
//               const extensions = extensionTypes.map(t => ExtensionType[t]);

//               // Try to get metadata
//               const metadata = await getTokenMetadataInfo(mintAddress);

//               const token: TokenData = {
//                 mint: mintAddressStr,
//                 amount: 0,
//                 decimals: mintInfo.decimals,
//                 tokenName: metadata?.name || `Token ${mintAddressStr.slice(0, 8)}`,
//                 symbol: metadata?.symbol || "UNKNOWN",
//                 uri: metadata?.uri,
//                 extensions,
//                 metadata: metadata // Store the complete metadata object
//               };

//               console.log('Processed token:', token);
//               return token;
//             } catch (err) {
//               console.error(`Error processing mint ${account.pubkey.toString()}:`, err);
//               return null;
//             }
//           })
//         );

//         const validTokens = mintedTokens.filter((token): token is TokenData => token !== null);
//         console.log('Final valid tokens:', validTokens);
        
//         // Fetch additional metadata for each token if URI is present
//         if (validTokens.length > 0) {
//           // First set the initial tokens
//           setTokens(validTokens);
          
//           // Then fetch additional metadata for each token with a URI
//           const tokensWithFullMetadata = await Promise.all(
//             validTokens.map(async (token) => {
//               if (token.uri) {
//                 try {
//                   // Fetch metadata from URI
//                   const response = await fetch(token.uri);
//                   if (response.ok) {
//                     const fullMetadata = await response.json();
//                     return {
//                       ...token,
//                       metadata: {
//                         ...token.metadata,
//                         fullMetadata
//                       }
//                     };
//                   }
//                 } catch (err) {
//                   console.error(`Error fetching metadata from URI for ${token.mint}:`, err);
//                 }
//               }
//               return token;
//             })
//           );
          
//           setTokens(tokensWithFullMetadata);
//         } else {
//           setTokens(validTokens);
//         }
//       } catch (err) {
//         console.error("Error fetching minted tokens:", err);
//         setError("Failed to fetch minted tokens");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchMintedTokens();
//   }, [publicKey, connection, connected]);

//   return { tokens, loading, error };
// };