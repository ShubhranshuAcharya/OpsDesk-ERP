import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className={`relative w-full ${sizeClasses[size]} bg-ops-bg-surface rounded-ops-lg shadow-2xl flex flex-col max-h-full animate-fade-in`}>
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-ops-border-default shrink-0">
          <h2 className="text-ops-lg font-semibold text-ops-text-primary">{title}</h2>
          <button 
            onClick={onClose}
            className="text-ops-text-muted hover:text-ops-text-primary transition-colors p-1 rounded-ops-sm hover:bg-ops-bg-base"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
        
        {footer && (
          <div className="px-6 py-4 border-t border-ops-border-default bg-ops-bg-base shrink-0 flex items-center justify-end gap-3 rounded-b-ops-lg">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
