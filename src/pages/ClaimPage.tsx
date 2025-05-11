import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWalletContext } from '../hooks/useWalletContext';
import { PublicKey } from '@solana/web3.js';
import { getTokenMetadata, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { useThemeContext } from '../hooks/useThemeContext';
import { QRCodeSVG } from 'qrcode.react';
import { HandleCompressedTransfer } from '../components/TokenClaim';
import ParticlesBackground from '../components/ParticlesBackground';
import Modal, { SuccessMessage, SuccessTitle} from '../components/Modal';



const ClaimPage = () => {
  const { tokenAddress } = useParams();
  const navigate = useNavigate();
  const { publicKey, connection, connected, adminKeypair } = useWalletContext();
  const { theme } = useThemeContext();
  const isDark = theme === 'dark';
  const noOfTokens = 10
  
  // Define TokenMetadata interface to match the expected type
  interface TokenMetadata {
    name: string;
    symbol: string;
    uri?: string;
  }

  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [txnId, setTxnId]= useState<string | undefined>('')

  useEffect(() => {
    if (!tokenAddress) {
      setError('No token address provided');
      return;
    }

    const fetchTokenMetadata = async () => {
      if (!connection) return;
      try {
        setIsLoading(true);
        const mintPublicKey = new PublicKey(tokenAddress);
        const metadata = await getTokenMetadata(
          connection,
          mintPublicKey,
          'confirmed',
          TOKEN_2022_PROGRAM_ID
        );
        if (!metadata) {
          setError('No metadata found for this token');
          setIsLoading(false)
          return;
        }
        setTokenMetadata(metadata);
      } catch (err: any) {
        console.error('Error fetching token metadata:', err);
        setError(`Error fetching token metadata: ${err.message}`);
        setIsLoading(false)
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenMetadata();
  }, [tokenAddress, connection]);

  const handleClaimClick = async () => {
    if (!connected || !publicKey || !connection || !tokenAddress) {
      toast.error('Please connect your wallet first');
      setIsLoading(false)
      return;
    }
    if (!adminKeypair) {
      toast.error('Fetching assets.... try again');
      setIsLoading(false)
      return;
    }

    try {
      setIsLoading(true);
      const mintPublicKey = new PublicKey(tokenAddress);
      console.log(publicKey.toBase58(), "publicKey")
      console.log(mintPublicKey.toBase58(), "mintPublicKey")
      
      const txId = await HandleCompressedTransfer(
        connection,
        connection,
        mintPublicKey,
        adminKeypair,
        publicKey,
        noOfTokens,
        () => {
          toast.success('Token claimed successfully! 🎉');
          setIsLoading(false);
          setShowSuccessModal(true);
        },
        (error: string) => {
          toast.error(`Failed to claim token: ${error}`);
          setIsLoading(false);
        }
      );
      
      console.log('Claim transaction:', txId);
      setTxnId(txId)
    } catch (err: any) {
      console.error('Error claiming token:', err);
      setError(err.message || 'Failed to claim token');
      toast.error('Failed to claim token');
      setIsLoading(false);
    }
  };

  useEffect(()=>{
    setTimeout(()=>{
      setIsLoading(false)
    },5000)
  },[isLoading])

  useEffect(()=>{
    if(publicKey){
      toast.success("Wallet connected successfully.")
    }

  },[publicKey])

  const handleCopyLink = () => {
    const claimLink = `${window.location.origin}/ClaimPage/${tokenAddress}`;
    navigator.clipboard.writeText(claimLink);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!tokenAddress) {
    return (
      <>
        <ClaimContainer>
          <ErrorMessage $isDark={isDark}>
            No token address provided. Please use the share link from a token creator.
          </ErrorMessage>
          <ClaimButton onClick={() => navigate('/')}>Return to Home</ClaimButton>
        </ClaimContainer>
      </>
    );
  }

  if (!connected) {
    return (
      <>
        <ParticlesBackground />
        <ClaimContainer>
          <TokenCard $isDark={isDark} style={{display: "flex" , flexDirection: "column", alignItems: 'center'}}>
            <HeaderBody>
              Thank you for attending our event!
            </HeaderBody>
            <TokenTitle $isDark={isDark}>A Special gift awaits you 🎁</TokenTitle>
          </TokenCard>
          <QRCodeContainer $isDark={isDark}>
            <QRCodeDescription $isDark={isDark}>
              Please connect your wallet to claim tokens.
            </QRCodeDescription>
          </QRCodeContainer>
        </ClaimContainer>
      </>
    );
  }

  if (isLoading && !tokenMetadata) {
    return (
      <>
        <ClaimContainer>
          <LoadingMessage $isDark={isDark}>
            Fetching token information...
          </LoadingMessage>
        </ClaimContainer>
      </>
    );
  }

  if (error && !tokenMetadata) {
    return (
      <>
        <ClaimContainer>
          <ErrorMessage $isDark={isDark}>{error}</ErrorMessage>
          <ClaimButton onClick={() => navigate('/')}>Return to Home</ClaimButton>
        </ClaimContainer>
      </>
    );
  }

  return (
    <>
      <ClaimContainer>
        <TokenTitle $isDark={isDark}>Claim Your Tokens</TokenTitle>
        {tokenMetadata && (
          <>
            <TokenCard $isDark={isDark}>
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
                <TokenValue $isDark={isDark}>{tokenAddress}</TokenValue>
              </TokenInfo>
              {tokenMetadata.uri && (
                <TokenInfo>
                  <TokenLabel $isDark={isDark}>Token URI:</TokenLabel>
                  <TokenValue $isDark={isDark}>
                    {tokenMetadata.uri}
                  </TokenValue>
                </TokenInfo>
              )}
            </TokenCard>

            <QRCodeContainer $isDark={isDark}>
              <QRCodeTitle $isDark={isDark}>Scan to Claim</QRCodeTitle>
              <QRCodeWrapper>
                <QRCodeSVG
                  value={`${window.location.origin}/ClaimPage/${tokenAddress}`}
                  size={200}
                  bgColor={'#ffffff'}
                  fgColor={'#000000'}
                  level={'L'}
                  includeMargin={false}
                />
              </QRCodeWrapper>
              <QRCodeDescription $isDark={isDark}>
                Scan this QR code with your mobile wallet to claim your tokens
              </QRCodeDescription>
              <CopyButton onClick={handleCopyLink}>
                {copied ? 'Copied!' : 'Copy Claim Link'}
              </CopyButton>
            </QRCodeContainer>
          </>
        )}

        <ClaimButton onClick={handleClaimClick} disabled={isLoading}>
          {isLoading ? 'Claiming...' : 'Claim Tokens'}
        </ClaimButton>
      </ClaimContainer>

      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Received airdrop successfully!"
      >
        <SuccessMessage>
          <SuccessTitle>Congratulations! 🎉</SuccessTitle>
          <StyledTokenInfo $isDark={isDark}>
            You have received {noOfTokens} ${tokenMetadata?.symbol}
          </StyledTokenInfo>
          <StyledTokenInfo $isDark={isDark}>
            Claim transaction: {' '}
            <TransactionLink 
              href={`https://explorer.solana.com/tx/${txnId}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              $isDark={isDark}
            >
              View on Explorer
            </TransactionLink>
          </StyledTokenInfo>
        </SuccessMessage>
      </Modal>
    </>
  );
};

const HeaderBody= styled.div`
  font-size: 30px;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  align-items: center;
`

const ClaimContainer = styled.div`
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
  min-height: 100vh;
  height: auto;
`

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

const QRCodeContainer = styled.div<{ $isDark: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background-color: ${props => props.$isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'};
  border-radius: 0.5rem;
  margin: 1.5rem 0;
`;

const QRCodeWrapper = styled.div`
  padding: 1rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const QRCodeTitle = styled.h3<{ $isDark: boolean }>`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.$isDark ? 'white' : '#1f2937'};
  margin: 0;
`;

const QRCodeDescription = styled.p<{ $isDark: boolean }>`
  color: ${props => props.$isDark ? '#9ca3af' : '#6b7280'};
  text-align: center;
  margin: 0;
`;

const CopyButton = styled.button`
  background-color: #3b82f6;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  &:hover {
    background-color: #2563eb;
  }
  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;

const StyledTokenInfo = styled.div<{ $isDark: boolean }>`
  color: ${props => props.$isDark ? '#e5e7eb' : '#374151'};
  margin: 0.5rem 0;
`;

const TransactionLink = styled.a<{ $isDark: boolean }>`
  color: ${props => props.$isDark ? '#3b82f6' : '#2563eb'};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

export default ClaimPage;