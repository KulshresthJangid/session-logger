import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'card',
        onClick && 'cursor-pointer hover:border-surface-border/60 hover:bg-surface-tertiary transition-colors',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
