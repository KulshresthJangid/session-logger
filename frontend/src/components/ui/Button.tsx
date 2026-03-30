import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const variantClass = {
    primary: 'btn-primary',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
    success: 'btn-success',
  }[variant];

  const sizeClass = {
    sm: 'text-xs px-3 py-1.5',
    md: '',
    lg: 'text-base px-5 py-2.5',
  }[size];

  return (
    <button
      className={cn(variantClass, sizeClass, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}
