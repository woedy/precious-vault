import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface BulkOperationResult {
  successful: number[];
  failed: Array<{
    userId: number;
    error: string;
  }>;
  total: number;
}

interface BulkOperationResultModalProps {
  result: BulkOperationResult;
  operation: 'approve' | 'reject';
  onClose: () => void;
}

const BulkOperationResultModal: React.FC<BulkOperationResultModalProps> = ({
  result,
  operation,
  onClose,
}) => {
  const successCount = result.successful.length;
  const failureCount = result.failed.length;
  const operationText = operation === 'approve' ? 'approved' : 'rejected';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            {failureCount === 0 ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : successCount === 0 ? (
              <XCircle className="h-6 w-6 text-red-600" />
            ) : (
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            )}
            <div>
              <h2 className="text-xl font-semibold">
                Bulk Operation Complete
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {successCount} of {result.total} requests {operationText} successfully
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Success Summary */}
          {successCount > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-900">
                  Successfully {operationText} ({successCount})
                </h3>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-800">
                  User IDs: {result.successful.join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Failure Details */}
          {failureCount > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-red-900">
                  Failed to {operation} ({failureCount})
                </h3>
              </div>
              <div className="space-y-2">
                {result.failed.map((failure, index) => (
                  <div
                    key={index}
                    className="bg-red-50 border border-red-200 rounded-md p-3"
                  >
                    <p className="text-sm font-medium text-red-900">
                      User ID: {failure.userId}
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      Error: {failure.error}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default BulkOperationResultModal;
