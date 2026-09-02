import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void;
  title: string;
  message?: ReactNode;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'primary';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  message,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  isLoading = false
}: ConfirmDialogProps) {
  const handleClose = onCancel ?? onClose ?? (() => {});
  const displayContent = description ?? message;
  
  if (!isOpen) return null;

  const iconMap: Record<string, ReactNode> = {
    danger: <AlertTriangle size={24} className="text-ops-danger" />,
    warning: <AlertTriangle size={24} className="text-ops-warning" />,
    info: <Info size={24} className="text-ops-primary" />,
    primary: <Info size={24} className="text-ops-primary" />
  };

  const bgMap: Record<string, string> = {
    danger: 'bg-ops-danger-bg border-ops-danger/20',
    warning: 'bg-ops-warning-bg border-ops-warning/20',
    info: 'bg-ops-bg-base border-ops-border-default',
    primary: 'bg-ops-bg-base border-ops-border-default'
  };

  const buttonVariantMap: Record<string, 'danger' | 'primary' | 'secondary' | 'ghost'> = {
    danger: 'danger',
    warning: 'primary',
    info: 'primary',
    primary: 'primary'
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!isLoading ? handleClose : undefined} />
      
      <div className="relative w-full max-w-md bg-ops-bg-surface rounded-ops-md shadow-2xl overflow-hidden animate-fade-in border border-ops-border-default">
        <div className="p-6">
          <div className="flex gap-4">
            <div className={`w-12 h-12 rounded-full border flex items-center justify-center shrink-0 ${bgMap[variant]}`}>
              {iconMap[variant]}
            </div>
            <div className="flex-1 pt-1">
              <div className="flex justify-between items-start">
                <h3 className="text-ops-base font-semibold text-ops-text-primary">{title}</h3>
                <button 
                  onClick={!isLoading ? handleClose : undefined}
                  className="text-ops-text-muted hover:text-ops-text-primary"
                  disabled={isLoading}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="mt-2 text-ops-sm text-ops-text-secondary">
                {displayContent}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-ops-bg-base px-6 py-4 flex justify-end gap-3 border-t border-ops-border-default">
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button variant={buttonVariantMap[variant]} onClick={onConfirm} isLoading={isLoading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
