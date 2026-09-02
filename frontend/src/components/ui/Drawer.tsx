import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg' | 'xl';
}

export function Drawer({ isOpen, onClose, title, children, footer, size = 'md' }: DrawerProps) {
  
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer Panel */}
      <div className={`relative w-full ${sizeClasses[size]} h-full bg-ops-bg-surface shadow-2xl flex flex-col animate-slide-in-right`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ops-border-default shrink-0">
          <h2 className="text-ops-lg font-semibold text-ops-text-primary">{title}</h2>
          <button 
            onClick={onClose}
            className="text-ops-text-muted hover:text-ops-text-primary transition-colors p-1 rounded-ops-sm hover:bg-ops-bg-base"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-ops-border-default bg-ops-bg-base shrink-0 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
