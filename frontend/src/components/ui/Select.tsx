import React, { type SelectHTMLAttributes } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[13px] font-medium text-ops-text-primary mb-1.5">
            {label}
            {props.required && <span className="text-ops-danger ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full h-9 px-3 bg-ops-bg-surface border rounded-ops-sm text-ops-sm focus:outline-none transition-colors appearance-none
            ${error 
              ? 'border-ops-danger focus:border-ops-danger focus:ring-1 focus:ring-ops-danger' 
              : 'border-ops-border-strong focus:border-ops-primary focus:ring-1 focus:ring-ops-primary'
            }
            disabled:bg-ops-bg-base disabled:text-ops-text-muted disabled:cursor-not-allowed
            ${className}
          `}
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23475467' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 0.5rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.5em 1.5em',
            paddingRight: '2.5rem'
          }}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p className="mt-1.5 text-[12px] text-ops-danger">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
