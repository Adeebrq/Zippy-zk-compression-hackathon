import { Buffer } from 'buffer';
window.Buffer = Buffer;

import 'crypto-browserify';
window.process = window.process || { env: {} };
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CustomWalletProvider } from './hooks/useWalletContext.tsx'
import { WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'


const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter()
]

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WalletProvider wallets={wallets}>
      <CustomWalletProvider>
        <App />
      </CustomWalletProvider>
    </WalletProvider>
  </StrictMode>,
)


declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}