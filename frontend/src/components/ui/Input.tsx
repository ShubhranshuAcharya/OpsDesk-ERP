import React, { type InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[13px] font-medium text-ops-text-primary mb-1.5">
            {label}
            {props.required && <span className="text-ops-danger ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full h-9 px-3 bg-ops-bg-surface border rounded-ops-sm text-ops-sm placeholder:text-ops-text-muted focus:outline-none transition-colors
            ${error 
              ? 'border-ops-danger focus:border-ops-danger focus:ring-1 focus:ring-ops-danger' 
              : 'border-ops-border-strong focus:border-ops-primary focus:ring-1 focus:ring-ops-primary'
            }
            disabled:bg-ops-bg-base disabled:text-ops-text-muted disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        {error ? (
          <p className="mt-1.5 text-[12px] text-ops-danger">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-[12px] text-ops-text-secondary">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';
