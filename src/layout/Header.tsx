import React, { useState, useEffect } from 'react';
import { CustomButton } from '../components/CustomButton';
import { useWalletContext } from '../components/useWalletContext';

const copyText = (text: string) => {
  navigator.clipboard.writeText(text);
};

const Header = () => {
    const { connect, connected, disconnect, publicKey } = useWalletContext();
  
    return (
      <div className="headerBody">
        <div className="left">
          <p className="logoText">SolMate</p>
        </div>
        <div className="right">
          <button className="theme-button">
            Toggle Theme
          </button>
          <p>This is a header</p>
  
          {!connected ? (
            <CustomButton onClick={connect}>Connect Wallet</CustomButton>
          ) : (
            <CustomButton onClick={disconnect}>Disconnect Wallet</CustomButton>
          )}
          {publicKey ? (
            <p className="copyKey" onClick={() => copyText(publicKey.toBase58())}>
              {publicKey.toBase58().substring(0, 7)}...
            </p>
          ) : null}
        </div>
      </div>
    );
  };

export default Header;