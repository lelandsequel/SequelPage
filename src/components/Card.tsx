import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  glassEffect?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', glassEffect = false, onClick }: CardProps) {
  const glassStyles = glassEffect
    ? 'bg-white/80 backdrop-blur-lg shadow-xl border border-white/20'
    : 'bg-white shadow-md';

  return (
    <div className={`rounded-xl ${glassStyles} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
