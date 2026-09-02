import React, { type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-ops-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-ops-primary disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-ops-primary text-white hover:bg-ops-primary-hover active:bg-ops-primary border border-transparent',
      secondary: 'bg-ops-bg-surface text-ops-text-primary border border-ops-border-strong hover:bg-ops-bg-base hover:text-ops-text-primary',
      danger: 'bg-ops-danger text-white hover:brightness-90 border border-transparent',
      ghost: 'bg-transparent text-ops-text-secondary hover:bg-ops-bg-base hover:text-ops-text-primary border border-transparent'
    };

    const sizes = {
      sm: 'h-8 px-3 text-ops-xs',
      md: 'h-9 px-4 text-ops-sm',
      lg: 'h-10 px-5 text-ops-base'
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
