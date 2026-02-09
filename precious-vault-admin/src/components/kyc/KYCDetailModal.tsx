import React, { useState } from 'react';
import { useKYCManagement } from '@/hooks/useKYCManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StatusBadge from '@/components/StatusBadge';
import DocumentViewer from './DocumentViewer';
import { X, CheckCircle, XCircle, Clock, User, Mail, Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { kycRejectSchema, type KYCRejectFormData } from '@/lib/validationSchemas';

interface KYCDetailModalProps {
  userId: number;
  onClose: () => void;
}

const KYCDetailModal: React.FC<KYCDetailModalProps> = ({ userId, onClose }) => {
  const { useKYCDetails, useKYCHistory, approveKYC, rejectKYC } = useKYCManagement();
  const kycDetails = useKYCDetails(userId);
  const kycHistory = useKYCHistory(userId);
  
  const [showRejectForm, setShowRejectForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<KYCRejectFormData>({
    resolver: zodResolver(kycRejectSchema),
  });

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this KYC request?')) {
      return;
    }

    try {
      await approveKYC.mutateAsync({ userId });
      onClose();
    } catch (error) {
      console.error('Failed to approve KYC:', error);
      alert('Failed to approve KYC request. Please try again.');
    }
  };

  const handleReject = async (data: KYCRejectFormData) => {
    if (!window.confirm('Are you sure you want to reject this KYC request?')) {
      return;
    }

    try {
      await rejectKYC.mutateAsync({ userId, reason: data.reason });
      reset();
      setShowRejectForm(false);
      onClose();
    } catch (error) {
      console.error('Failed to reject KYC:', error);
      alert('Failed to reject KYC request. Please try again.');
    }
  };

  if (kycDetails.isLoading) {
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

  if (!kycDetails.data) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Failed to load KYC details</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  }

  const user = kycDetails.data;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">KYC Verification Details</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Review user information and identity documents
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">User Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-muted-foreground">{user.user_name}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user.user_email}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Submitted</p>
                  <p className="text-sm text-muted-foreground">
                    {user.kyc_submitted_at
                      ? new Date(user.kyc_submitted_at).toLocaleString()
                      : 'Not submitted'}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <StatusBadge status={user.kyc_status} />
                </div>
              </div>
            </div>
          </div>

          {/* Identity Documents */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Identity Documents</h3>
            {user.documents && user.documents.length > 0 ? (
              <DocumentViewer documents={user.documents} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No documents uploaded
              </div>
            )}
          </div>

          {/* KYC History */}
          {kycHistory.data && kycHistory.data.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">KYC History</h3>
              <div className="space-y-3">
                {kycHistory.data.map((entry) => (
                  <div
                    key={entry.id}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <StatusBadge status={entry.status} />
                      <span className="text-sm text-muted-foreground">
                        {new Date(entry.submitted_at).toLocaleString()}
                      </span>
                    </div>
                    {entry.reviewed_at && (
                      <p className="text-sm text-muted-foreground">
                        Reviewed: {new Date(entry.reviewed_at).toLocaleString()}
                        {entry.reviewed_by && ` by ${entry.reviewed_by}`}
                      </p>
                    )}
                    {entry.rejection_reason && (
                      <p className="text-sm">
                        <span className="font-medium">Reason:</span>{' '}
                        {entry.rejection_reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {user.kyc_status === 'pending' && (
            <div className="space-y-4 pt-4 border-t">
              {!showRejectForm ? (
                <div className="flex items-center justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectForm(true)}
                    disabled={approveKYC.isPending || rejectKYC.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={approveKYC.isPending || rejectKYC.isPending}
                  >
                    {approveKYC.isPending ? (
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
                <form onSubmit={handleSubmit(handleReject)} className="space-y-4">
                  <div>
                    <Label htmlFor="reason">Rejection Reason *</Label>
                    <Input
                      id="reason"
                      {...register('reason')}
                      placeholder="Enter reason for rejection (minimum 10 characters)"
                      className="mt-1"
                    />
                    {errors.reason && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.reason.message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowRejectForm(false);
                        reset();
                      }}
                      disabled={rejectKYC.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={rejectKYC.isPending}
                    >
                      {rejectKYC.isPending ? (
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

export default KYCDetailModal;
