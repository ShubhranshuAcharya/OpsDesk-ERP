import { type HTMLAttributes } from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: string;
  variant?: BadgeVariant;
}

export default function StatusBadge({ status, variant, className = '', ...props }: StatusBadgeProps) {
  // Auto-detect variant based on common status strings if not provided
  let activeVariant: BadgeVariant = variant || 'default';
  
  if (!variant) {
    const s = status.toUpperCase();
    if (['CONFIRMED', 'ACTIVE', 'IN', 'COMPLETED'].includes(s)) activeVariant = 'success';
    else if (['DRAFT', 'PENDING', 'LOW_STOCK', 'LEAD'].includes(s)) activeVariant = 'warning';
    else if (['CANCELLED', 'OUT', 'OUT_OF_STOCK', 'ERROR', 'INACTIVE'].includes(s)) activeVariant = 'danger';
    else activeVariant = 'info';
  }

  const variantStyles = {
    success: 'bg-ops-success-bg text-ops-success border-ops-success/20',
    warning: 'bg-ops-warning-bg text-ops-warning border-ops-warning/20',
    danger: 'bg-ops-danger-bg text-ops-danger border-ops-danger/20',
    info: 'bg-ops-info-bg text-ops-info border-ops-info/20',
    default: 'bg-ops-bg-base text-ops-text-secondary border-ops-border-strong',
  };

  return (
    <span 
      className={`inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider rounded-full border ${variantStyles[activeVariant]} ${className}`}
      {...props}
    >
      {status}
    </span>
  );
}
