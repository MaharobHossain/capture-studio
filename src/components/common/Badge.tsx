import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'brand' | 'secondary' | 'error' | 'warning' | 'info';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'brand',
  size = 'md',
}) => {
  const variantStyles = {
    brand: 'bg-brand/10 text-brand border border-brand/20',
    secondary: 'bg-surface-elevated text-text-secondary border border-border',
    error: 'bg-status-error/10 text-status-error border border-status-error/20',
    warning: 'bg-status-warning/10 text-status-warning border border-status-warning/20',
    info: 'bg-status-info/10 text-status-info border border-status-info/20',
  }[variant];

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-medium tracking-wide',
    md: 'text-xs px-2.5 py-1 font-medium',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${sizeStyles} ${variantStyles}`}
    >
      {children}
    </span>
  );
};
