import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-surface-card border border-border shadow-card-dark',
    elevated: 'bg-surface-elevated border border-border-bright shadow-card-dark',
    interactive: 'bg-surface-card border border-border hover:border-brand/50 hover:shadow-brand-glow cursor-pointer transition-all duration-200',
  }[variant];

  return (
    <div
      className={`rounded-2xl p-5 ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

