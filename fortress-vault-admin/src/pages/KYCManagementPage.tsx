import React, { useState, useMemo, useEffect } from 'react';
import { useKYCManagement, type KYCUser, type BulkOperationResult } from '@/hooks/useKYCManagement';
import DataTable, { type Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import KYCDetailModal from '@/components/kyc/KYCDetailModal';
import ActionModal from '@/components/ActionModal';
import BulkOperationResultModal from '@/components/BulkOperationResultModal';
import { Button } from '@/components/ui/button';
import { Eye, CheckCircle, XCircle } from 'lucide-react';

const KYCManagementPage: React.FC = () => {
  const { pendingKYC, bulkApproveKYC, bulkRejectKYC } = useKYCManagement();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkOperationResult | null>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Update current time periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Handle bulk approve
  const handleBulkApprove = async () => {
    const userIds = Array.from(selectedIds).map(Number);
    
    try {
      const result = await bulkApproveKYC.mutateAsync({ userIds });
      setBulkResult(result);
      setBulkAction(null);
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Bulk approve failed:', error);
      // Show error in result modal
      setBulkResult({
        successful: [],
        failed: userIds.map(userId => ({
          userId,
          error: 'Network error or server unavailable'
        })),
        total: userIds.length
      });
      setBulkAction(null);
      setSelectedIds(new Set());
    }
  };

  // Handle bulk reject
  const handleBulkReject = async (reason?: string) => {
    if (!reason) {
      console.error('Reason is required for bulk reject');
      return;
    }
    
    const userIds = Array.from(selectedIds).map(Number);
    
    try {
      const result = await bulkRejectKYC.mutateAsync({ userIds, reason });
      setBulkResult(result);
      setBulkAction(null);
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Bulk reject failed:', error);
      // Show error in result modal
      setBulkResult({
        successful: [],
        failed: userIds.map(userId => ({
          userId,
          error: 'Network error or server unavailable'
        })),
        total: userIds.length
      });
      setBulkAction(null);
      setSelectedIds(new Set());
    }
  };

  // Calculate stats using useMemo
  const stats = useMemo(() => {
    const data = pendingKYC.data ?? [];
    
    return {
      total: data.length,
      olderThan48Hours: data.filter(
        (u) =>
          u.kyc_submitted_at &&
          currentTime - new Date(u.kyc_submitted_at).getTime() > 48 * 60 * 60 * 1000
      ).length,
      last24Hours: data.filter(
        (u) =>
          u.kyc_submitted_at &&
          currentTime - new Date(u.kyc_submitted_at).getTime() < 24 * 60 * 60 * 1000
      ).length,
    };
  }, [pendingKYC.data, currentTime]);

  // Define table columns
  const columns: Column<KYCUser>[] = [
    {
      key: 'user_email',
      header: 'Email',
      sortable: true,
      className: 'font-medium',
    },
    {
      key: 'user_name',
      header: 'Name',
      sortable: true,
    },
    {
      key: 'kyc_submitted_at',
      header: 'Submission Date',
      sortable: true,
      render: (user) => {
        if (!user.kyc_submitted_at) return '-';
        return new Date(user.kyc_submitted_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      },
    },
    {
      key: 'kyc_status',
      header: 'Status',
      sortable: true,
      render: (user) => <StatusBadge status={user.kyc_status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedUserId(user.id);
          }}
        >
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">KYC Management</h1>
        <p className="text-muted-foreground mt-2">
          Review and process Know Your Customer verification requests
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-sm text-muted-foreground">Pending Requests</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">{stats.olderThan48Hours}</div>
          <p className="text-sm text-muted-foreground">Older than 48 hours</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">{stats.last24Hours}</div>
          <p className="text-sm text-muted-foreground">Last 24 hours</p>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedIds.size} request(s) selected (max 50)
            </div>
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => setBulkAction('approve')}
                disabled={selectedIds.size === 0}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Bulk Approve
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkAction('reject')}
                disabled={selectedIds.size === 0}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Bulk Reject
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pending KYC Table */}
      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Pending KYC Requests</h2>
          <DataTable
            data={pendingKYC.data ?? []}
            columns={columns}
            keyExtractor={(user) => user.id}
            onRowClick={(user) => setSelectedUserId(user.id)}
            isLoading={pendingKYC.isLoading}
            emptyMessage="No pending KYC requests"
            selection={{
              selectedIds,
              onSelectionChange: setSelectedIds,
              maxSelection: 50,
            }}
          />
        </div>
      </div>

      {/* KYC Detail Modal */}
      {selectedUserId && (
        <KYCDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}

      {/* Bulk Action Modals */}
      {bulkAction === 'approve' && (
        <ActionModal
          isOpen={true}
          onClose={() => setBulkAction(null)}
          title="Bulk Approve KYC Requests"
          description={`Are you sure you want to approve ${selectedIds.size} KYC request(s)?`}
          actionType="approve"
          actionLabel="Approve All"
          isLoading={bulkApproveKYC.isPending}
          onConfirm={handleBulkApprove}
        />
      )}

      {bulkAction === 'reject' && (
        <ActionModal
          isOpen={true}
          onClose={() => setBulkAction(null)}
          title="Bulk Reject KYC Requests"
          description={`Are you sure you want to reject ${selectedIds.size} KYC request(s)?`}
          actionType="reject"
          actionLabel="Reject All"
          requireReason
          isLoading={bulkRejectKYC.isPending}
          onConfirm={handleBulkReject}
        />
      )}

      {/* Bulk Operation Result Modal */}
      {bulkResult && (
        <BulkOperationResultModal
          result={bulkResult}
          operation={bulkResult.successful.length > 0 ? 'approve' : 'reject'}
          onClose={() => setBulkResult(null)}
        />
      )}
    </div>
  );
};

export default KYCManagementPage;
