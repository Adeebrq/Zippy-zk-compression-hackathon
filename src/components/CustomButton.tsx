import React from 'react';
import type { ReactNode, CSSProperties } from 'react';
import '../styles/customButton.css';

interface CustomButtonProps {
  children: ReactNode;
  onClick: () => void;
  style?: CSSProperties;
}

export const CustomButton: React.FC<CustomButtonProps> = ({ children, onClick, style }) => {
  return (
    <button className="customButton" onClick={onClick} style={style}>
      {children}
    </button>
  );
};
