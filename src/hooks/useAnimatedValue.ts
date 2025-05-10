import { useState, useEffect } from 'react';

export const useAnimatedValue = (targetValue: number, duration: number = 1000) => {
  const [value, setValue] = useState(0);
  const [prevTarget, setPrevTarget] = useState(targetValue);

  useEffect(() => {
    // Reset animation when target value changes significantly (like on connect/disconnect)
    if (Math.abs(targetValue - prevTarget) > 0.1) {
      setValue(0);
    }
    setPrevTarget(targetValue);

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = targetValue * easeOutQuart;
      
      setValue(currentValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [targetValue, duration, prevTarget]);

  return value;
}; 