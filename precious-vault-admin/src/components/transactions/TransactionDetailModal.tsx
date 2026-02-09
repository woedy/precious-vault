import React, { useState } from 'react';
import { useTransactionManagement } from '@/hooks/useTransactionManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StatusBadge from '@/components/StatusBadge';
import { 
  X, 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar, 
  DollarSign,
  Package,
  MessageSquare,
  Send
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  transactionRejectSchema, 
  transactionNoteSchema,
  type TransactionRejectFormData,
  type TransactionNoteFormData
} from '@/lib/validationSchemas';

interface TransactionDetailModalProps {
  txId: number;
  onClose: () => void;
}

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ 
  txId, 
  onClose 
}) => {
  const { 
    useTransactionDetails, 
    approveTransaction, 
    rejectTransaction,
    addNote 
  } = useTransactionManagement();
  
  const transactionDetails = useTransactionDetails(txId);
  
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);

  const {
    register: registerReject,
    handleSubmit: handleSubmitReject,
    formState: { errors: rejectErrors },
    reset: resetReject,
  } = useForm<TransactionRejectFormData>({
    resolver: zodResolver(transactionRejectSchema),
  });

  const {
    register: registerNote,
    handleSubmit: handleSubmitNote,
    formState: { errors: noteErrors },
    reset: resetNote,
  } = useForm<TransactionNoteFormData>({
    resolver: zodResolver(transactionNoteSchema),
  });

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this transaction?')) {
      return;
    }

    try {
      await approveTransaction.mutateAsync({ txId });
      onClose();
    } catch (error) {
      console.error('Failed to approve transaction:', error);
      alert('Failed to approve transaction. Please try again.');
    }
  };

  const handleReject = async (data: TransactionRejectFormData) => {
    if (!window.confirm('Are you sure you want to reject this transaction?')) {
      return;
    }

    try {
      await rejectTransaction.mutateAsync({ txId, reason: data.reason });
      resetReject();
      setShowRejectForm(false);
      onClose();
    } catch (error) {
      console.error('Failed to reject transaction:', error);
      alert('Failed to reject transaction. Please try again.');
    }
  };

  const handleAddNote = async (data: TransactionNoteFormData) => {
    try {
      await addNote.mutateAsync({ txId, note: data.note });
      resetNote();
      setShowNoteForm(false);
    } catch (error) {
      console.error('Failed to add note:', error);
      alert('Failed to add note. Please try again.');
    }
  };

  if (transactionDetails.isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!transactionDetails.data) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Failed to load transaction details</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  }

  const transaction = transactionDetails.data;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Transaction Details</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Transaction ID: #{transaction.id}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Transaction Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Transaction Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">User</p>
                  <p className="text-sm text-muted-foreground">{transaction.user_email}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Type</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {transaction.transaction_type}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Metal</p>
                  <p className="text-sm text-muted-foreground">{transaction.metal_name}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Quantity</p>
                  <p className="text-sm text-muted-foreground">
                    {parseFloat(transaction.quantity).toFixed(4)} oz
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Price per Unit</p>
                  <p className="text-sm text-muted-foreground">
                    ${parseFloat(transaction.price_per_unit).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Total Amount</p>
                  <p className="text-sm text-muted-foreground font-semibold">
                    ${parseFloat(transaction.total_amount).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transaction.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <StatusBadge status={transaction.status} />
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Notes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Notes</h3>
              {!showNoteForm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNoteForm(true)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              )}
            </div>

            {/* Add Note Form */}
            {showNoteForm && (
              <form onSubmit={handleSubmitNote(handleAddNote)} className="space-y-3 border rounded-lg p-4 bg-muted/50">
                <div>
                  <Label htmlFor="note">New Note</Label>
                  <Input
                    id="note"
                    {...registerNote('note')}
                    placeholder="Enter your note (minimum 5 characters)"
                    className="mt-1"
                  />
                  {noteErrors.note && (
                    <p className="text-sm text-red-600 mt-1">
                      {noteErrors.note.message}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowNoteForm(false);
                      resetNote();
                    }}
                    disabled={addNote.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={addNote.isPending}
                  >
                    {addNote.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Add Note
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* Notes List */}
            {transaction.notes && transaction.notes.length > 0 ? (
              <div className="space-y-3">
                {transaction.notes.map((note) => (
                  <div
                    key={note.id}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {note.admin_user_email || `Admin #${note.admin_user}`}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(note.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{note.note}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                No notes yet
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {transaction.status === 'pending' && (
            <div className="space-y-4 pt-4 border-t">
              {!showRejectForm ? (
                <div className="flex items-center justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectForm(true)}
                    disabled={approveTransaction.isPending || rejectTransaction.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={approveTransaction.isPending || rejectTransaction.isPending}
                  >
                    {approveTransaction.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmitReject(handleReject)} className="space-y-4">
                  <div>
                    <Label htmlFor="reason">Rejection Reason *</Label>
                    <Input
                      id="reason"
                      {...registerReject('reason')}
                      placeholder="Enter reason for rejection (minimum 10 characters)"
                      className="mt-1"
                    />
                    {rejectErrors.reason && (
                      <p className="text-sm text-red-600 mt-1">
                        {rejectErrors.reason.message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowRejectForm(false);
                        resetReject();
                      }}
                      disabled={rejectTransaction.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={rejectTransaction.isPending}
                    >
                      {rejectTransaction.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Confirm Rejection
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailModal;
