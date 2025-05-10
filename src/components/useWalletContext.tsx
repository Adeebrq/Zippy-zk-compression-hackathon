import { createContext, useContext, useMemo, useEffect, useState } from "react";
import { useWallet, WalletProvider as AdapterWalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { clusterApiUrl, Connection, PublicKey, Transaction } from "@solana/web3.js";
import type {TransactionSignature , Keypair} from "@solana/web3.js";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { Rpc, createRpc } from "@lightprotocol/stateless.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

const apiKey = import.meta.env.VITE_HELIUS_API_KEY;


type TokenInfo = {
  mint: string;
  amount: number;
  decimals: number;
};

// Update the interface to include sendTransaction and network
interface WalletContextProps {
  publicKey: PublicKey | null;
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
  connection: Rpc;
  tokenBalance: TokenInfo[]
  network: string;
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
    sendTransaction,
    wallets: adapterWallets
  } = useWallet();
  const [tokenBalance, setTokenBalance] = useState<TokenInfo[]>([])

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
  const connection = useMemo(() => 
    createRpc(RPC_ENDPOINT, COMPRESSION_RPC_ENDPOINT, PROVER_ENDPOINT),
    [RPC_ENDPOINT, COMPRESSION_RPC_ENDPOINT, PROVER_ENDPOINT]
  );

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

  useEffect(()=>  {
    try {

        const fetchAccounts= async()=> {
            if (!publicKey || !wallets)return ;

            const tokenFetch= await connection.getParsedTokenAccountsByOwner(publicKey, {programId: TOKEN_PROGRAM_ID})
            const tokens= tokenFetch.value.map((accountInfo)=> {
                const parsed= accountInfo.account.data.parsed.info

                if (!parsed || !parsed.mint || parsed.tokenAmount.uiAmount === undefined  || parsed.tokenAmount.decimals === undefined) return null;
                 return {
                    mint: parsed.mint,
                    amount: parsed.tokenAmount.uiAmount,
                    decimals: parsed.tokenAmount.decimals
                 }

            }).filter((t): t is {mint: string; amount: number; decimals: number}=> t !== null )
            setTokenBalance(tokens)
            console.log(tokenBalance)
        }
        fetchAccounts();
        
    } catch (error) {
        console.log("An error has occured, ", error)
        
    }
}, [publicKey, connected])
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