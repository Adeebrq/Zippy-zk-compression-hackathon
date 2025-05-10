import React from 'react';
import { useWalletContext } from '../components/useWalletContext';
import styled, { keyframes } from 'styled-components';
import { useThemeContext } from '../components/useThemeContext';
import { MdLightMode, MdDarkMode } from "react-icons/md";


const copyText = (text: string) => {
  navigator.clipboard.writeText(text);
};

const Header = () => {
  const { connect, connected, disconnect, publicKey } = useWalletContext();
  const { theme, toggleTheme } = useThemeContext();

  return (
    <HeaderBox>
      <LeftBox>
        <LogoText>Zippy</LogoText>
        <PunchLine>The CPOP dApp</PunchLine>
      </LeftBox>
      <RightBox>

        {!connected ? (
          <StyledButton onClick={connect}>Connect Wallet</StyledButton>
        ) : (
          <StyledButton onClick={disconnect}>Disconnect Wallet</StyledButton>
        )}
        {publicKey ? (
          <CopyKey onClick={() => copyText(publicKey.toBase58())}>
            {publicKey.toBase58().substring(0, 7)}...
          </CopyKey>
        ) : null}
          <ThemeButton onClick={toggleTheme}>
          {theme === 'light' ? <MdDarkMode size={24} color="black" /> : <MdLightMode size={24} color="white" />}
        </ThemeButton>
      </RightBox>
    </HeaderBox>
  );
};

const HeaderBox = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  border-bottom: 1px solid ${(props) => props.theme.border};
  background: ${(props) => props.theme.background};
  padding: 10px;
`;

const LeftBox = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
`;

const RightBox = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
`;

const LogoText = styled.p`
  color: ${(props) => props.theme.text};
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  font-family: "MyCustomFont";
`;


const PunchLine = styled.div`
  font-size: 8px;
`

const CopyKey = styled.p`
  cursor: pointer;
  color: ${(props) => props.theme.text};
  margin: 0;
`;

const glowing = keyframes`
  0% {
    background-position: 0 0;
  }
  50% {
    background-position: 400% 0;
  }
  100% {
    background-position: 0 0;
  }
`;

const StyledButton = styled.button`
  padding: 10px 25px;
  border: solid ${(props) => props.theme.border} 1px;
  outline: none;
  color: ${(props) => props.theme.text};
  cursor: pointer;
  position: relative;
  z-index: 0;
  border-radius: 12px;
  background: ${(props) => props.theme.background};
  font-size: 12px;
  letter-spacing: 0.5px;
  transition: all 0.3s ease-in-out;

  &::after {
    content: '';
    z-index: -1;
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: ${(props) => props.theme.background};
    left: 0;
    top: 0;
    border-radius: 10px;
  }

  &::before {
    content: '';
    background: linear-gradient(
      45deg,
      #6a0dad,
      #8a2be2,
      #9370db,
      #4b0082,
      #0000ff,
      #4169e1,
      #4682b4,
      #6a5acd
    );
    position: absolute;
    top: -2px;
    left: -2px;
    background-size: 600%;
    z-index: -1;
    width: calc(100% + 4px);
    height: calc(100% + 4px);
    filter: blur(8px);
    animation: ${glowing} 20s linear infinite;
    transition: opacity 0.3s ease-in-out;
    border-radius: 10px;
    opacity: 0;
  }

  &:hover {
    &::before {
      opacity: 1;
    }
    color: white;
  }

  &:active {
    &::after {
      background: transparent;
    }
    color: white;
  }
`;

const ThemeButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export default Header;