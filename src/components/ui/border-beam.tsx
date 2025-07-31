'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface TwoMinuteBorderProps {
  children: ReactNode;
  className?: string;
}

export function TwoMinuteBorder({
  children,
  className
}: TwoMinuteBorderProps) {
  return (
    <div 
      className={cn('relative rounded-lg', className)}
      style={{
        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #6366f1)',
        padding: '2px',
      }}
    >
      {/* Content with white background */}
      <div className="bg-white rounded-lg">
        {children}
      </div>
    </div>
  );
}

// Main 2-minute rule highlighting component
export function TwoMinuteRuleBorder({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <TwoMinuteBorder className={className}>
      {children}
    </TwoMinuteBorder>
  );
}

// For consistency, keeping this but using the same simple border
export function TwoMinuteRuleBorderSubtle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <TwoMinuteBorder className={className}>
      {children}
    </TwoMinuteBorder>
  );
} 