import { createContext, useContext, useMemo, useEffect } from "react";
import { useWallet, WalletProvider as AdapterWalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { clusterApiUrl, Connection, PublicKey, Transaction } from "@solana/web3.js";
import type {TransactionSignature , Keypair} from "@solana/web3.js";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { Rpc, createRpc } from "@lightprotocol/stateless.js";

const apiKey = import.meta.env.VITE_HELIUS_API_KEY;

// Update the interface to include sendTransaction
interface WalletContextProps {
  publicKey: PublicKey | null;
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
  connection: Rpc;
  signTransaction: ((transaction: Transaction) => Promise<Transaction>) | undefined;
  sendTransaction: ((
    transaction: Transaction,
    connection: Connection | Rpc,
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
    sendTransaction, // Get sendTransaction from useWallet
    wallets: adapterWallets
  } = useWallet();
  
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ];

  /// Helius exposes Solana and compression RPC endpoints through a single URL
  const RPC_ENDPOINT = `https://devnet.helius-rpc.com?api-key=${apiKey}`;
  const COMPRESSION_RPC_ENDPOINT = RPC_ENDPOINT;
  const PROVER_ENDPOINT = RPC_ENDPOINT;
  const connection: Rpc = createRpc(RPC_ENDPOINT, COMPRESSION_RPC_ENDPOINT, PROVER_ENDPOINT);

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
          sendTransaction, // Include sendTransaction in the context
        }}
      >
        {children}
      </WalletContext.Provider>
    </AdapterWalletProvider>
  );
};

export const useWalletContext = (): WalletContextProps => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWalletContext must be used within a CustomWalletProvider");
  }
  return context;
};