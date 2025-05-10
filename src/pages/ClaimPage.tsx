import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWalletContext } from '../components/useWalletContext';
import { PublicKey } from '@solana/web3.js';
import { getTokenMetadata, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { useThemeContext } from '../components/useThemeContext';

// Add theme type
interface Theme {
  mode: 'light' | 'dark';
}

const ClaimContainer = styled.div`
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
`;

const TokenCard = styled.div<{ $isDark: boolean }>`
  background-color: ${props => props.$isDark ? '#1a1a1a' : 'white'};
  border: 1px solid ${props => props.$isDark ? '#333' : '#e5e7eb'};
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const TokenTitle = styled.h1<{ $isDark: boolean }>`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: ${props => props.$isDark ? 'white' : '#1f2937'};
`;

const TokenInfo = styled.div`
  margin-bottom: 1rem;
`;

const TokenLabel = styled.span<{ $isDark: boolean }>`
  font-weight: 500;
  color: ${props => props.$isDark ? '#9ca3af' : '#6b7280'};
`;

const TokenValue = styled.span<{ $isDark: boolean }>`
  color: ${props => props.$isDark ? '#e5e7eb' : '#374151'};
  margin-left: 0.5rem;
`;

const ClaimButton = styled.button`
  background-color: #3b82f6;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2563eb;
  }

  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div<{ $isDark: boolean }>`
  color: #ef4444;
  background-color: ${props => props.$isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)'};
  padding: 1rem;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
`;

const LoadingMessage = styled.div<{ $isDark: boolean }>`
  color: ${props => props.$isDark ? '#9ca3af' : '#6b7280'};
  text-align: center;
  padding: 2rem;
`;

const ClaimPage = () => {
  const { tokenAddress } = useParams();
  const navigate = useNavigate();
  const { publicKey, connection, connected } = useWalletContext();
  const { theme } = useThemeContext();
  const isDark = theme === 'dark';
  const [tokenMetadata, setTokenMetadata] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenAddress) {
      setError('No token address provided');
      return;
    }

    const fetchTokenMetadata = async () => {
      if (!connection) return;

      try {
        setIsLoading(true);
        setError(null);

        const mintPublicKey = new PublicKey(tokenAddress);
        const metadata = await getTokenMetadata(
          connection,
          mintPublicKey,
          'confirmed',
          TOKEN_2022_PROGRAM_ID
        );

        if (!metadata) {
          setError('No metadata found for this token');
          return;
        }

        setTokenMetadata(metadata);
      } catch (err: any) {
        console.error('Error fetching token metadata:', err);
        setError(`Error fetching token metadata: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenMetadata();
  }, [tokenAddress, connection]);

  const handleClaim = async () => {
    if (!connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    // TODO: Implement token claiming logic
    toast.info('Token claiming functionality coming soon!');
  };

  if (!tokenAddress) {
    return (
      <ClaimContainer>
        <TokenCard $isDark={isDark}>
          <ErrorMessage $isDark={isDark}>
            No token address provided. Please use the share link from a token creator.
          </ErrorMessage>
          <ClaimButton onClick={() => navigate('/')}>Return to Home</ClaimButton>
        </TokenCard>
      </ClaimContainer>
    );
  }

  if (!connected) {
    return (
      <ClaimContainer>
        <TokenCard $isDark={isDark}>
          <TokenTitle $isDark={isDark}>Connect Wallet</TokenTitle>
          <p>Please connect your wallet to claim tokens.</p>
        </TokenCard>
      </ClaimContainer>
    );
  }

  if (isLoading) {
    return (
      <ClaimContainer>
        <TokenCard $isDark={isDark}>
          <LoadingMessage $isDark={isDark}>Fetching token information...</LoadingMessage>
        </TokenCard>
      </ClaimContainer>
    );
  }

  if (error) {
    return (
      <ClaimContainer>
        <TokenCard $isDark={isDark}>
          <ErrorMessage $isDark={isDark}>{error}</ErrorMessage>
          <ClaimButton onClick={() => navigate('/')}>Return to Home</ClaimButton>
        </TokenCard>
      </ClaimContainer>
    );
  }

  return (
    <ClaimContainer>
      <TokenCard $isDark={isDark}>
        <TokenTitle $isDark={isDark}>Claim Your Tokens</TokenTitle>
        {tokenMetadata && (
          <>
            <TokenInfo>
              <TokenLabel $isDark={isDark}>Token Name:</TokenLabel>
              <TokenValue $isDark={isDark}>{tokenMetadata.name}</TokenValue>
            </TokenInfo>
            <TokenInfo>
              <TokenLabel $isDark={isDark}>Token Symbol:</TokenLabel>
              <TokenValue $isDark={isDark}>{tokenMetadata.symbol}</TokenValue>
            </TokenInfo>
            <TokenInfo>
              <TokenLabel $isDark={isDark}>Mint Address:</TokenLabel>
              <TokenValue $isDark={isDark} style={{ fontFamily: 'monospace' }}>{tokenAddress}</TokenValue>
            </TokenInfo>
            {tokenMetadata.uri && (
              <TokenInfo>
                <TokenLabel $isDark={isDark}>Token URI:</TokenLabel>
                <TokenValue $isDark={isDark}>
                  <a 
                    href={tokenMetadata.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#3b82f6' }}
                  >
                    {tokenMetadata.uri}
                  </a>
                </TokenValue>
              </TokenInfo>
            )}
          </>
        )}
        <ClaimButton onClick={handleClaim} disabled={!tokenMetadata}>
          Claim Tokens
        </ClaimButton>
      </TokenCard>
    </ClaimContainer>
  );
};

export default ClaimPage;