  import styled, { keyframes } from 'styled-components';
  import { MdConfirmationNumber, MdOfflineBolt ,  MdQrCode2, MdAccountBalanceWallet } from 'react-icons/md';
  import { MetricsSection } from './Metrics';

  const LandingPageInfo = () => {
    return (
      <>
      <Container>
        {/* Animated background gradients */}
        <BackgroundGradient1 />
        <BackgroundGradient2 />
        
        {/* Content container */}
        <ContentWrapper>
          {/* Header with modern typography */}
          <HeaderSection>
            <BadgePill>Experience The Future</BadgePill>
            <MainHeading>A New Way to Capture Experiences</MainHeading>
            <SubHeading>Powered by <GradientSpan>cTokens</GradientSpan></SubHeading>
            <Divider />
          </HeaderSection>
          
          {/* Description with improved typography and spacing */}
          <DescriptionSection>
            <Paragraph>
              Zippy allows event creators mint Proof-of-Participation (cTokens) that represent real-world or digital experiences. 
              These tokens can be claimed by attendees through a simple QR scan, making it easy to reward engagement and verify 
              participation on the Solana blockchain.
            </Paragraph>
            
            <Paragraph>
              Whether you're running a hackathon, a community meetup, or an online workshop, our interface helps you:
            </Paragraph>
            
            {/* Feature grid with icons */}
            <FeatureGrid>
              <FeatureCard>
                <IconWrapper>
                  <MdConfirmationNumber size={20} />
                </IconWrapper>
                <FeatureContent>
                  <FeatureTitle>Mint Participation Tokens</FeatureTitle>
                  <FeatureDescription>Create unique cTokens for every event or experience, instantly and effortlessly. Powered by Solana’s zk compression, mint at scale without breaking the bank.</FeatureDescription>
                </FeatureContent>
              </FeatureCard>
              
              <FeatureCard>
                <IconWrapper>
                  <MdQrCode2 size={20} />
                </IconWrapper>
                <FeatureContent>
                  <FeatureTitle>Generate QR Codes</FeatureTitle>
                  <FeatureDescription>Distribute tokens seamlessly using scannable QR codes. No logins, no apps, just scan and claim.</FeatureDescription>
                </FeatureContent>
              </FeatureCard>
              
              <FeatureCard>
                <IconWrapper>
                  <MdAccountBalanceWallet size={20} />
                </IconWrapper>
                <FeatureContent>
                  <FeatureTitle>Instant Token Claims</FeatureTitle>
                  <FeatureDescription>Attendees can claim their cTokens in seconds through any Solana-compatible wallet.</FeatureDescription>
                </FeatureContent>
              </FeatureCard>
              
              <FeatureCard>
                <IconWrapper>
                  <MdOfflineBolt  size={20} />
                </IconWrapper>
                <FeatureContent>
                  <FeatureTitle>Record low fees</FeatureTitle>
                  <FeatureDescription>Leverage a lightweight, high-speed protocol optimized for real-world scalability, keep costs near zero while reaching thousands.</FeatureDescription>
                </FeatureContent>
              </FeatureCard>
            </FeatureGrid>
            
            {/* CTA button */}
            <CTAWrapper>
              <CTAButton>Get Started</CTAButton>
            </CTAWrapper>
          </DescriptionSection>
        </ContentWrapper>
      </Container>


  {/* CHANGES TO BE MADE HERE */}

      <Container style ={{  marginTop: "20px"}}>
      <BackgroundGradient1 />
        <BackgroundGradient2 />
        
        <ContentWrapper>
          <HeaderSection>
            <BadgePill>Ultra-low gas fees</BadgePill>
            <MainHeading>Zippy is built on the <GradientSpan>Light Protocol</GradientSpan></MainHeading>
            <SubHeading>Blazing Speed,<GradientSpan> Minimal Cost </GradientSpan></SubHeading>
            <Divider />
            </HeaderSection>
            <DescriptionSection>
            <Paragraph>
            ZK compression minimizes on-chain data by storing succinct cryptographic proofs, drastically lowering storage costs. Built on this foundation, the Lightweight Protocol enables creators to mint and distribute compressed tokens at scale—delivering up to 5000× cost savings over traditional token accounts.
            </Paragraph>
            
            <Paragraph>
            It ensures efficient, secure participation tracking with near-zero fees and seamless wallet integration on Solana.
            </Paragraph>

            {/* INSERT METRICS HERE */}
            <MetricsSection />
            </DescriptionSection>
            
            
            </ContentWrapper>


      </Container>
      </>
    );
  };

  // Animations
  const pulseAnimation = keyframes`
    0% { opacity: 0.5; }
    50% { opacity: 0.7; }
    100% { opacity: 0.5; }
  `;

  // Styled Components
  const Container = styled.div`
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: 16px;
    z-index: 4;
  `;

  const BackgroundGradient1 = styled.div`
    position: absolute;
    top: -80px;
    right: -80px;
    width: 260px;
    height: 260px;
    border-radius: 50%;
    background: rgba(59, 80, 255, 0.1);
    filter: blur(40px);
    animation: ${pulseAnimation} 8s infinite ease-in-out;
  `;

  const BackgroundGradient2 = styled.div`
    position: absolute;
    bottom: -120px;
    left: -80px;
    width: 320px;
    height: 320px;
    border-radius: 50%;
    background: rgba(123, 97, 255, 0.1);
    filter: blur(40px);
    animation: ${pulseAnimation} 12s infinite ease-in-out;
  `;

  const ContentWrapper = styled.div`
    position: relative;
    z-index: 10;
    padding: 2rem;
    backdrop-filter: blur(8px);
    border: 1px solid ${props => props.theme.background === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
    border-radius: 16px;
    background-image: linear-gradient(
      to bottom,
      ${props => props.theme.background === 'dark' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)'},
      ${props => props.theme.background === 'dark' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'}
    );
    color: ${props => props.theme.text};
    transition: all 0.3s ease;
  `;

  const HeaderSection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-bottom: 2rem;
  `;

  const BadgePill = styled.div`
    display: inline-block;
    margin-bottom: 0.75rem;
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    background-color: ${props => props.theme.background === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(85, 85, 85, 0.2)'};
    border-radius: 9999px;
  `;

  const MainHeading = styled.h1`
    font-size: 2.5rem;
    font-weight: bold;
    letter-spacing: -0.025em;
    margin-bottom: 0.5rem;
    
    @media (min-width: 768px) {
      font-size: 3rem;
    }
  `;

  const SubHeading = styled.h2`
    font-size: 1.5rem;
    font-weight: 300;
    letter-spacing: -0.025em;
    
    @media (min-width: 768px) {
      font-size: 1.875rem;
    }
  `;

  const GradientSpan = styled.span`
    font-weight: 600;
    background: linear-gradient(to right, #3b50ff, #6675ff);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  `;

  const Divider = styled.div`
    width: 6rem;
    height: 4px;
    margin-top: 1.5rem;
    margin-bottom: 2rem;
    border-radius: 9999px;
    background: linear-gradient(to right, #3b50ff, #6675ff);
  `;

  const DescriptionSection = styled.div`
    font-size: 1.125rem;
    line-height: 1.7;
    max-width: 48rem;
    margin: 0 auto;
  `;

  const Paragraph = styled.p`
    margin-bottom: 1.5rem;
  `;

  const FeatureGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    margin-bottom: 2rem;
    
    @media (min-width: 768px) {
      grid-template-columns: 1fr 1fr;
    }
  `;

  const FeatureCard = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    border-radius: 12px;
    background-color: ${props => props.theme.background === 'dark' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)'};
    backdrop-filter: blur(4px);
    border: 1px solid ${props => props.theme.background === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(80, 80, 80, 0.2)'};
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    }
  `;

  const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(to bottom right, #3b50ff, #6675ff);
    color: white;
  `;

  const FeatureContent = styled.div`
    flex: 1;
  `;

  const FeatureTitle = styled.h3`
    font-weight: 500;
    margin-bottom: 0.25rem;
  `;

  const FeatureDescription = styled.p`
    font-size: 0.875rem;
    opacity: 0.8;
  `;

  const CTAWrapper = styled.div`
    display: flex;
    justify-content: center;
    margin-top: 2rem;
  `;

  const CTAButton = styled.button`
    padding: 0.75rem 2rem;
    font-size: 1rem;
    font-weight: 500;
    color: white;
    background: linear-gradient(to right, #3b50ff, #6675ff);
    border: none;
    border-radius: 9999px;
    box-shadow: 0 10px 20px rgba(59, 80, 255, 0.2);
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      transform: scale(1.05);
      background: linear-gradient(to right, #3043d6, #5c6ae6);
      box-shadow: 0 15px 25px rgba(59, 80, 255, 0.3);
    }
  `;

  export default LandingPageInfo;