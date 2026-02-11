import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  actionType: 'approve' | 'reject' | 'custom';
  actionLabel?: string;
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  onConfirm: (reason?: string) => void | Promise<void>;
  isLoading?: boolean;
  children?: React.ReactNode;
}

const ActionModal: React.FC<ActionModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  actionType,
  actionLabel,
  requireReason = false,
  reasonLabel = 'Reason',
  reasonPlaceholder = 'Enter reason...',
  onConfirm,
  isLoading = false,
  children,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    // Validate reason if required
    if (requireReason && !reason.trim()) {
      setError('Reason is required');
      return;
    }

    setError(null);

    try {
      await onConfirm(reason.trim() || undefined);
      // Reset state on success
      setReason('');
      onClose();
    } catch (err) {
      const error = err as { message?: string };
      setError(error.message || 'An error occurred');
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setReason('');
      setError(null);
      onClose();
    }
  };

  const getActionButtonVariant = () => {
    switch (actionType) {
      case 'approve':
        return 'default';
      case 'reject':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getDefaultActionLabel = () => {
    if (actionLabel) return actionLabel;
    
    switch (actionType) {
      case 'approve':
        return 'Approve';
      case 'reject':
        return 'Reject';
      default:
        return 'Confirm';
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] p-4">
        <div className="bg-background rounded-lg border shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4">
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="px-6 pb-4 space-y-4">
            {children}

            {requireReason && (
              <div className="space-y-2">
                <Label htmlFor="reason">{reasonLabel}</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={reasonPlaceholder}
                  disabled={isLoading}
                  className={cn(error && 'border-destructive')}
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-2 p-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant={getActionButtonVariant()}
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Processing...
                </>
              ) : (
                getDefaultActionLabel()
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ActionModal;
