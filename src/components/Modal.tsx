import React, { useState, useEffect } from 'react';
import { useThemeContext } from '../hooks/useThemeContext';
import styled from 'styled-components';
import Confetti from 'react-confetti';
import { IoClose } from 'react-icons/io5';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  mintAddress?: string | null;
  fetchedMetadata?: {
    name?: string;
    symbol?: string;
  } | null;
}

const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div<{ $isDark: boolean }>`
  background-color: ${props => props.$isDark ? '#1a1a1a' : 'white'};
  border: 1px solid ${props => props.$isDark ? '#333' : '#e5e7eb'};
  border-radius: 0.5rem;
  padding: 1.5rem;
  width: 90%;
  max-width: 500px;
  position: relative;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ModalTitle = styled.h2<{ $isDark: boolean }>`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.$isDark ? 'white' : '#1f2937'};
  margin: 0;
`;

const CloseButton = styled.button<{ $isDark: boolean }>`
  background: none;
  border: none;
  color: ${props => props.$isDark ? '#9ca3af' : '#6b7280'};
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.$isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
    color: ${props => props.$isDark ? 'white' : '#1f2937'};
  }
`;

export const SuccessMessage = styled.div`
  padding: 1rem;
  max-width: 100%;
`;

export const SuccessTitle = styled.h3`
  color: #10B981;
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
`;

export const TokenInfo = styled.p<{ $isDark: boolean }>`
  margin: 0.5rem 0;
  color: ${props => props.$isDark ? '#E5E7EB' : '#374151'};
`;

export const ShareLink = styled.a<{ $isDark: boolean }>`
  display: block;
  word-break: break-all;
  color: #3B82F6;
  text-decoration: none;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: ${props => props.$isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'};
  border-radius: 0.375rem;
  border: 1px solid ${props => props.$isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'};
  
  &:hover {
    text-decoration: underline;
    background-color: ${props => props.$isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'};
  }
`;

export const AddressMono = styled.span`
  font-family: monospace;
`;

const Modal = ({ isOpen, onClose, title, children}: ModalProps) => {
  const { theme } = useThemeContext();
  const isDark = theme === 'dark';
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen) return null;

  return (
    <ModalOverlay isOpen={isOpen}>
      <ModalContent $isDark={isDark}>
        <ModalHeader>
          <ModalTitle $isDark={isDark}>{title}</ModalTitle>
          <CloseButton $isDark={isDark} onClick={onClose}>
            <IoClose size={24} />
          </CloseButton>
        </ModalHeader>
        {children}
      </ModalContent>
      {showConfetti && (
        <ConfettiContainer>
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            numberOfPieces={200}
            recycle={false}
            colors={['#FFD700', '#FF69B4', '#00CED1', '#FF4500', '#7B68EE']}
            gravity={0.3}
            initialVelocityY={10}
          />
        </ConfettiContainer>
      )}
    </ModalOverlay>
  );
};

const ConfettiContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10000;
`;

export default Modal;