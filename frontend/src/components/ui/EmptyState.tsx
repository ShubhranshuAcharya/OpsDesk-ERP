import { type ReactNode } from 'react';
import { FileQuestion } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionText?: string;
  actionTo?: string;
  actionOnClick?: () => void;
}

export default function EmptyState({ 
  icon = <FileQuestion size={24} className="text-ops-text-muted" />, 
  title, 
  description,
  actionText,
  actionTo,
  actionOnClick
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-ops-bg-base border border-dashed border-ops-border-strong rounded-ops-md h-full min-h-[160px]">
      <div className="mb-3 w-12 h-12 bg-ops-bg-surface rounded-full shadow-ops-sm flex items-center justify-center border border-ops-border-default">
        {icon}
      </div>
      <h3 className="text-ops-sm font-semibold text-ops-text-primary mb-1">{title}</h3>
      <p className="text-ops-xs text-ops-text-secondary max-w-[250px] mb-4">
        {description}
      </p>
      
      {actionText && (
        actionTo ? (
          <Link to={actionTo} className="inline-flex items-center justify-center h-8 px-3 bg-ops-bg-surface border border-ops-border-strong rounded-ops-sm text-ops-xs font-medium text-ops-text-primary hover:bg-ops-bg-base transition-colors">
            {actionText}
          </Link>
        ) : actionOnClick ? (
          <button onClick={actionOnClick} className="inline-flex items-center justify-center h-8 px-3 bg-ops-bg-surface border border-ops-border-strong rounded-ops-sm text-ops-xs font-medium text-ops-text-primary hover:bg-ops-bg-base transition-colors">
            {actionText}
          </button>
        ) : null
      )}
    </div>
  );
}
