import { createContext, useContext, useMemo, useEffect, useState } from "react";
import { useWallet, WalletProvider as AdapterWalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { clusterApiUrl, Connection, PublicKey, Transaction } from "@solana/web3.js";
import type { TransactionSignature } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { Rpc, createRpc } from "@lightprotocol/stateless.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { firestore } from "../config/firebase";
import bs58 from 'bs58';

const apiKey = import.meta.env.VITE_HELIUS_API_KEY;

type TokenInfo = {
  mint: string;
  amount: number;
  decimals: number;
};

interface AdminWallet {
  publicKey: string;  
  secretKey: string; 
}

interface WalletContextProps {
  publicKey: PublicKey | null;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  connection: Rpc;
  tokenBalance: TokenInfo[];
  network: string;
  adminKeys: AdminWallet | null;
  adminKeypair: Keypair | null;
  signTransaction: ((transaction: Transaction) => Promise<Transaction>) | undefined;
  sendTransaction: ((
    transaction: Transaction,
    connection: Rpc,
    options?: { signers?: Keypair[] }
  ) => Promise<TransactionSignature>) | undefined;
}

const WalletContext = createContext<WalletContextProps | null>(null);

export const CustomWalletProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    publicKey,
    connected,
    select,
    connect,
    disconnect,
    signTransaction,
    sendTransaction,
    wallets: adapterWallets
  } = useWallet();
  const [tokenBalance, setTokenBalance] = useState<TokenInfo[]>([]);
  const [adminKeys, setAdminKeys] = useState<AdminWallet | null>(null);
  const [adminKeypair, setAdminKeypair] = useState<Keypair | null>(null);

  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ];

  // Define which network we're using
  const [network, setNetwork] = useState("devnet");

  // Create RPC endpoints based on the network
  const getRpcEndpoints = () => {
    const networkUrl = network === "mainnet" 
      ? `https://mainnet.helius-rpc.com?api-key=${apiKey}`
      : `https://devnet.helius-rpc.com?api-key=${apiKey}`;
    
    return {
      RPC_ENDPOINT: networkUrl,
      COMPRESSION_RPC_ENDPOINT: networkUrl,
      PROVER_ENDPOINT: networkUrl
    };
  };

  const { RPC_ENDPOINT, COMPRESSION_RPC_ENDPOINT, PROVER_ENDPOINT } = getRpcEndpoints();
  
  // Use useMemo to create the connection to prevent unnecessary re-renders
  const connection = useMemo(
    () => createRpc(RPC_ENDPOINT, COMPRESSION_RPC_ENDPOINT, PROVER_ENDPOINT),
    [RPC_ENDPOINT, COMPRESSION_RPC_ENDPOINT, PROVER_ENDPOINT]
  );

  // Function to fetch admin keys
  async function fetchAdminKeys(): Promise<void> {
    try {
      const walletDocRef = doc(firestore, 'adminKeys', 'keys');
      const walletDoc = await getDoc(walletDocRef);
      
      if (walletDoc.exists()) {
        // Get the data
        const data = walletDoc.data();


        // Validate the secret key format
        if (!data.secretKey || typeof data.secretKey !== 'string') {
          throw new Error('Invalid secret key format in database');
        }

        // Convert hex string to Uint8Array
        const secretKeyHex = data.secretKey;
        if (secretKeyHex.length !== 128) { // 64 bytes = 128 hex characters
          throw new Error('Invalid secret key length');
        }

        const secretKeyUint8Array = new Uint8Array(64);
        for (let i = 0; i < 64; i++) {
          secretKeyUint8Array[i] = parseInt(secretKeyHex.substr(i * 2, 2), 16);
        }
        
        const wallet = {
          publicKey: data.publicKey,
          secretKey: data.secretKey,
        };
        
        setAdminKeys(wallet);
        const keypair = Keypair.fromSecretKey(secretKeyUint8Array);
        setAdminKeypair(keypair);
        
        console.log("Successfully loaded admin keypair");
      } else {
        console.log("No admin wallet found in database");
        throw new Error('Admin wallet not found in database');
      }
    } catch (error) {
      console.error("Error fetching wallet:", error);
      throw error;
    }
  }

  useEffect(() => {
    const phantomWallet = adapterWallets.find(w => w.adapter.name === "Phantom");
    const isInstalled = adapterWallets.find(w => w.readyState === "Installed");
    let walletName = null;
    
    if (phantomWallet && phantomWallet.readyState === "Installed") {
      walletName = phantomWallet.adapter.name;
    } else if (isInstalled) {
      walletName = isInstalled.adapter.name;
    } else {
      console.log("An error has occurred");
    }
    
    if (walletName) {
      select(walletName);
    }
  }, [adapterWallets, select]);

  // Token fetch 
  useEffect(() => {
    try {
      const fetchAccounts = async () => {
        if (!publicKey) return;

        const tokenFetch = await connection.getParsedTokenAccountsByOwner(publicKey, {programId: TOKEN_PROGRAM_ID});
        const tokens = tokenFetch.value.map((accountInfo) => {
          const parsed = accountInfo.account.data.parsed.info;

          if (!parsed || !parsed.mint || parsed.tokenAmount.uiAmount === undefined || parsed.tokenAmount.decimals === undefined) return null;
          return {
            mint: parsed.mint,
            amount: parsed.tokenAmount.uiAmount,
            decimals: parsed.tokenAmount.decimals
          };
        }).filter((t): t is TokenInfo => t !== null);
        
        setTokenBalance(tokens);
      };
      
      fetchAdminKeys();
      if (publicKey && connected) {
        fetchAccounts();
      }
    } catch (error) {
      console.log("An error has occurred, ", error);
    }
  }, [publicKey, connected, connection]);

  return (
    <AdapterWalletProvider wallets={wallets} autoConnect={true}>
      <WalletContext.Provider
        value={{
          publicKey,
          connected,
          connect,
          disconnect,
          connection,
          signTransaction,
          sendTransaction,
          network,
          tokenBalance,
          adminKeys,
          adminKeypair,
        }}
      >
        {children}
      </WalletContext.Provider>
    </AdapterWalletProvider>
  );
};

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWalletContext must be used within a CustomWalletProvider");
  }
  return context;
};