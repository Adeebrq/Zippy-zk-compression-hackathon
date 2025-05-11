import React, { useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { MdSavings, MdSpeed, MdPriceCheck, MdAccountBalance, MdGroups, MdLink } from 'react-icons/md';
import { useThemeContext } from '../hooks/useThemeContext';


// Define the metric type
interface Metric {
  id: number;
  title: string;
  traditionalCost: string;
  compressedCost: string;
  savings: string;
  efficiency: string;
}

const MetricsScroller: React.FC<{ metrics: Metric[] }> = ({ metrics }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { theme } = useThemeContext();
  
  // Map metrics to appropriate icons
  const getIconForMetric = (id: number) => {
    switch (id) {
      case 1: return <MdAccountBalance size={22} />;
      case 2: return <MdPriceCheck size={22} />;
      case 3: return <MdSavings size={22} />;
      case 4: return <MdSpeed size={22} />;
      case 5: return <MdGroups size={22} />;
      default: return <MdSavings size={22} />;
    }
  };

  return (
    <ScrollContainer>
      <MetricsRow ref={scrollRef}>
        {/* First set of cards */}
        {metrics.map(metric => (
          <MetricCard key={metric.id}>
            <IconWrapper>
              {getIconForMetric(metric.id)}
            </IconWrapper>
            <MetricContent>
              <MetricTitle>{metric.title}</MetricTitle>
              <CostComparison>
                <OldCost>{metric.traditionalCost}</OldCost>
                <Arrow>→</Arrow>
                <NewCost>{metric.compressedCost}</NewCost>
              </CostComparison>
              <MetricHighlights>
                <Savings>{metric.savings} savings</Savings>
                <Efficiency>{metric.efficiency}</Efficiency>
              </MetricHighlights>
            </MetricContent>
          </MetricCard>
        ))}
        
        {/* Duplicate all cards to ensure seamless looping */}
        {metrics.map(metric => (
          <MetricCard key={`clone-${metric.id}`}>
            <IconWrapper>
              {getIconForMetric(metric.id)}
            </IconWrapper>
            <MetricContent>
              <MetricTitle>{metric.title}</MetricTitle>
              <CostComparison>
                <OldCost>{metric.traditionalCost}</OldCost>
                <Arrow>→</Arrow>
                <NewCost>{metric.compressedCost}</NewCost>
              </CostComparison>
              <MetricHighlights>
                <Savings>{metric.savings} savings</Savings>
                <Efficiency>{metric.efficiency}</Efficiency>
              </MetricHighlights>
            </MetricContent>
          </MetricCard>
        ))}
      </MetricsRow>
    </ScrollContainer>
  );
};

// Import the metrics data in this component
import metricsData from "../protocolStats.json";

const MetricsSection: React.FC = () => {
  // Type assertion to ensure metrics has the right type
  const typedMetrics = metricsData as Metric[];
  const { theme } = useThemeContext();
  
  return (
    <MetricsContainer>
      <MetricsHeading>Protocol Comparison</MetricsHeading>
      <MetricsSubheading>See how the Light Protocol stacks up against traditional methods</MetricsSubheading>
      <MetricsScroller metrics={typedMetrics} />
      <LearnMoreLink 
        href="https://docs.lightprotocol.com/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <MdLink size={16} style={{ marginRight: '6px' }} />
        Learn more about the Light Protocol
      </LearnMoreLink>
    </MetricsContainer>
  );
};

// Define a type for the theme prop
type ThemeProps = {
  theme: {
    background: string;
    text: string;
    primary: string;
    secondary: string;
    border: string;
  };
};

// Animation keyframes - modified for truly seamless scrolling
const scrollAnimation = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(calc(-50%)); }
`;

// Styled Components
const ScrollContainer = styled.div`
  width: 100%;
  overflow: hidden;
  position: relative;
  padding: 1rem 0;
  margin: 1.5rem 0;
  
  &:before, &:after {
    content: '';
    position: absolute;
    top: 0;
    width: 60px;
    height: 100%;
    z-index: 2;
  }
  
  &:before {
    left: 0;
    background: linear-gradient(to right, 
      ${props => props.theme.background}, 
      transparent);
  }
  
  &:after {
    right: 0;
    background: linear-gradient(to left, 
      ${props => props.theme.background}, 
      transparent);
  }
`;

const MetricsRow = styled.div`
  display: flex;
  width: fit-content;
  animation: ${scrollAnimation} 30s linear infinite;
  
  &:hover {
    animation-play-state: paused;
  }
`;

const MetricCard = styled.div`
  min-width: 280px;
  flex-shrink: 0;
  margin-right: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 12px;
  background-color: ${props => props.theme.background};
  backdrop-filter: blur(4px);
  border: 1px solid ${props => props.theme.border};
  box-shadow: 0 4px 12px ${props => props.theme.background === '#1a1a1a' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.1)'};
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 24px ${props => props.theme.background === '#1a1a1a' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.15)'};
    z-index: 1;
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(to bottom right, #3b50ff, #6675ff);
  color: white;
`;

const MetricContent = styled.div`
  flex: 1;
`;

const MetricTitle = styled.h3`
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.5rem;
`;

const CostComparison = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
`;

const OldCost = styled.span`
  text-decoration: line-through;
  opacity: 0.7;
  color: ${props => props.theme.background === '#1a1a1a' ? '#e57373' : '#d32f2f'};
`;

const Arrow = styled.span`
  margin: 0 0.5rem;
  color: #6675ff;
`;

const NewCost = styled.span`
  font-weight: 600;
  color: ${props => props.theme.background === '#1a1a1a' ? '#81c784' : '#2e7d32'};
`;

const MetricHighlights = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const Savings = styled.span`
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: ${props => props.theme.background === '#1a1a1a' ? 'rgba(59, 80, 255, 0.2)' : 'rgba(59, 80, 255, 0.1)'};
  color: ${props => props.theme.background === '#1a1a1a' ? '#90caf9' : '#3b50ff'};
  font-weight: 500;
`;

const Efficiency = styled.span`
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: ${props => props.theme.background === '#1a1a1a' ? 'rgba(123, 97, 255, 0.2)' : 'rgba(123, 97, 255, 0.1)'};
  color: ${props => props.theme.background === '#1a1a1a' ? '#b39ddb' : '#7b61ff'};
  font-weight: 500;
`;

const MetricsContainer = styled.div`
  margin: 2rem 0;
  text-align: center;
`;

const MetricsHeading = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  /* color: ${(props: ThemeProps) => props.theme.background === 'dark' ? '#f5f5f5' : '#212121'}; */
  color: ${props => props.theme.text};
`;

const MetricsSubheading = styled.p`
  font-size: 1rem;
  opacity: ${(props: ThemeProps) => props.theme.background === 'dark' ? '0.9' : '0.8'};
  margin-bottom: 1.5rem;
  /* color: ${(props: ThemeProps) => props.theme.background === 'dark' ? '#e0e0e0' : '#424242'}; */
  color: ${props => props.theme.text}
`;

const LearnMoreLink = styled.a`
  display: inline-flex;
  align-items: center;
  margin-top: 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #3b50ff;
  cursor: pointer;
  transition: opacity 0.15s ease;
  text-decoration: none;
  
  &:hover {
    opacity: 0.8;
    text-decoration: underline;
  }
`;

export { MetricsSection };