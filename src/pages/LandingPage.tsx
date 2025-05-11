import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import BackgroundVideo from '../components/BackgroundVideo'
import LandingPageInfo from '../components/LandingPageInfo';


const LandingPage = () => {
  const words = ["Creators", "Visionaries", "Innovators", "Disruptors", "Leaders", "Builders"];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      setIsTransitioning(true);
      
      // After transition duration, update the indices
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
        setNextIndex((prevIndex) => (prevIndex + 1) % words.length);
        setIsTransitioning(false);
      }, 600);
      
    }, 2000); // Total word display time
    
    return () => clearInterval(intervalId);
  }, [words.length]);

  // const handleClaimClick = () => {
  //   // Show a message that they need a token address
  //   alert('Please use the share link from a token creator to access the claim page.');
  // };

  return (
    <>
    <LandingContainer>
      <BackgroundVideo /> {/* background video */}
      <ContentWrapper>
        <div style={{  alignSelf: "self-start"}}>
        <h1>
          For the{" "}
          <AnimationContainer>
            {words.map((word, index) => (
              <AnimatedWord 
                key={word}
                isActive={!isTransitioning && index === currentIndex || isTransitioning && index === nextIndex}
                position={isTransitioning && index === currentIndex ? 'outgoing' : 
                          isTransitioning && index === nextIndex ? 'incoming' : 'current'}
              >
                {word}
              </AnimatedWord>
            ))}
          </AnimationContainer>
        </h1>
        <h1 style={{margin: "0px"}}>By the Developers</h1>
        </div>
        <ButtonContainer>
          <StartedButton onClick={() => navigate("/CreatorPage")}>Mint your first CPOP Token</StartedButton>
          {/* <StyledButton onClick={handleClaimClick}>Claim Token</StyledButton> */}
        </ButtonContainer>
      </ContentWrapper>
    </LandingContainer> 
      <LandingPageInfo/>  {/* Additional landing page content */}
      </>
  );
};



const LandingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh);
  height: auto;
  position: relative;
  overflow: hidden;
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  font-size: 40px;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
`;

const StyledButton = styled.button`
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  border: 2px solid #3b82f6;
  background-color: transparent;
  color: #3b82f6;
  font-weight: 600;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.3s ease, background-color 0.3s ease;

  &:hover {
    opacity: 1;
    background-color: rgba(59, 130, 246, 0.1); /* subtle blue on hover */
  }
`;


// Container for the words with fixed position
const AnimationContainer = styled.span`
  position: relative;
  display: inline-block;
  min-width: 180px;
  min-height: 60px;
  text-align: center;
  margin: 0px;
  padding: 0px;
`;

// Styled component for each animated word
const AnimatedWord = styled.span<{ isActive: boolean, position: 'incoming' | 'outgoing' | 'current' }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  color: #3b50ff;
  margin: 0px;
  padding: 0px;
  font-size: 84px;
  opacity: ${props => props.isActive ? 1 : 0};
  transform: ${props => props.position === 'incoming' 
    ? 'translateY(10px)' 
    : props.position === 'outgoing' 
      ? 'translateY(-10px)' 
      : 'translateY(-24px)'
  };
  transition: opacity 600ms ease, transform 600ms ease;
`;



const StartedButton = styled.button`
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
  margin: 20px;
  
  &:hover {
    transform: scale(1.05);
    background: linear-gradient(to right, #3043d6, #5c6ae6);
    box-shadow: 0 15px 25px rgba(59, 80, 255, 0.3);
  }
`;


export default LandingPage;