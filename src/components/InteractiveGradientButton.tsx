import React, { useRef, useEffect, useState } from 'react';

interface InteractiveGradientButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const InteractiveGradientButton: React.FC<InteractiveGradientButtonProps> = ({
  children,
  className = '',
  onClick,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [gradientPosition, setGradientPosition] = useState({ x: 50, y: 50 });
  const [currentPosition, setCurrentPosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = button.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setGradientPosition({ x, y });
    };

    const handleMouseLeave = () => {
      setGradientPosition({ x: 50, y: 50 });
    };

    button.addEventListener('mousemove', handleMouseMove);
    button.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      button.removeEventListener('mousemove', handleMouseMove);
      button.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Smooth tweening animation
  useEffect(() => {
    const animate = () => {
      setCurrentPosition(prev => ({
        x: prev.x + (gradientPosition.x - prev.x) * 0.1,
        y: prev.y + (gradientPosition.y - prev.y) * 0.1
      }));
      requestAnimationFrame(animate);
    };

    const animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [gradientPosition]);

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      className={`px-6 py-3 rounded-lg text-white font-medium
                 bg-gradient-to-r from-primary via-secondary to-primary
                 transition-all duration-300 ease-out
                 hover:shadow-lg hover:-translate-y-0.5
                 active:translate-y-0 ${className}`}
      style={{
        backgroundSize: '200% 200%',
        backgroundPosition: `${currentPosition.x}% ${currentPosition.y}%`,
      }}
    >
      {children}
    </button>
  );
}; 