'use client';

import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;  // Changed from message to description
  message?: string;      // Keep for backward compatibility
  type?: 'danger' | 'warning' | 'info' | 'success';
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  isLoading?: boolean;
  requireTextConfirmation?: boolean;
  confirmationText?: string;
  inputValue?: string;
  onInputChange?: (value: string) => void;
  inputPlaceholder?: string;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  message, // For backward compatibility
  type = 'warning',
  confirmText = 'Onayla',
  cancelText = 'İptal',
  confirmVariant,
  isLoading = false,
  requireTextConfirmation = false,
  confirmationText = '',
  inputValue = '',
  onInputChange,
  inputPlaceholder = ''
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const displayMessage = description || message || '';

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="w-6 h-6 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case 'info':
        return <Info className="w-6 h-6 text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getConfirmButtonClass = () => {
    if (confirmVariant === 'destructive') {
      return 'bg-destructive hover:bg-destructive/90 text-destructive-foreground';
    }
    
    switch (type) {
      case 'danger':
        return 'bg-destructive hover:bg-destructive/90 text-destructive-foreground';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      default:
        return 'bg-primary hover:bg-primary/90 text-primary-foreground';
    }
  };

  const handleConfirm = () => {
    if (requireTextConfirmation && inputValue !== confirmationText) {
      return;
    }
    onConfirm();
  };

  const isConfirmDisabled = isLoading || (requireTextConfirmation && inputValue !== confirmationText);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full mx-4 border">
        <div className="p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-foreground">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">
                  {displayMessage}
                </p>
              </div>
              
              {requireTextConfirmation && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Onaylamak için &quot;{confirmationText}&quot; yazın:
                  </label>
                  <Input
                    value={inputValue}
                    onChange={(e) => onInputChange?.(e.target.value)}
                    placeholder={inputPlaceholder}
                    className="w-full"
                  />
                </div>
              )}
            </div>
            <div className="ml-3 flex-shrink-0">
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
                disabled={isLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-muted-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isConfirmDisabled}
              className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getConfirmButtonClass()}`}
            >
              {isLoading ? 'İşleniyor...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 