import React from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

const LandingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 2rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
`;

const StyledButton = styled.button`
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  border: none;
  background-color: #3b82f6;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2563eb;
  }
`;

const LandingPage = () => {
  const navigate = useNavigate()
  
  const handleClaimClick = () => {
    // Show a message that they need a token address
    alert('Please use the share link from a token creator to access the claim page.');
  }

  return (
    <LandingContainer>
      <h1>Welcome to Zippy - The CPOP dApp</h1>
      <ButtonContainer>
        <StyledButton onClick={() => navigate("/CreatorPage")}>Create Token</StyledButton>
        <StyledButton onClick={handleClaimClick}>Claim Token</StyledButton>
      </ButtonContainer>
    </LandingContainer>
  )
}

export default LandingPage

