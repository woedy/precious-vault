import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuditLog, type AuditLogEntry, type AuditLogFilters } from '@/hooks/useAuditLog';
import DataTable, { type Column } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';

const AuditLogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Initialize filters from URL params
  const [filters, setFilters] = useState<AuditLogFilters>(() => ({
    action_type: searchParams.get('action_type') || '',
    admin_user: searchParams.get('admin_user') ? parseInt(searchParams.get('admin_user')!) : undefined,
    date_from: searchParams.get('date_from') || '',
    date_to: searchParams.get('date_to') || '',
    target_type: searchParams.get('target_type') || '',
    target_id: searchParams.get('target_id') || '',
    page: currentPage,
  }));

  const { auditLog } = useAuditLog(filters);
  const entries = auditLog.data?.results ?? [];
  const totalCount = auditLog.data?.count ?? 0;
  const hasNext = !!auditLog.data?.next;
  const hasPrevious = !!auditLog.data?.previous;

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.action_type) params.set('action_type', filters.action_type);
    if (filters.admin_user) params.set('admin_user', filters.admin_user.toString());
    if (filters.date_from) params.set('date_from', filters.date_from);
    if (filters.date_to) params.set('date_to', filters.date_to);
    if (filters.target_type) params.set('target_type', filters.target_type);
    if (filters.target_id) params.set('target_id', filters.target_id);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    setSearchParams(params, { replace: true });
  }, [filters, currentPage, setSearchParams]);

  // Update filters when page changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, page: currentPage }));
  }, [currentPage]);

  // Handle filter changes
  const handleFilterChange = (key: keyof AuditLogFilters, value: string | number | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      action_type: '',
      admin_user: undefined,
      date_from: '',
      date_to: '',
      target_type: '',
      target_id: '',
      page: 1,
    });
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = 
    filters.action_type || 
    filters.admin_user || 
    filters.date_from || 
    filters.date_to || 
    filters.target_type || 
    filters.target_id;

  // Format action type for display
  const formatActionType = (actionType: string): string => {
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format target type for display
  const formatTargetType = (targetType: string): string => {
    return targetType.charAt(0).toUpperCase() + targetType.slice(1);
  };

  // Define table columns
  const columns: Column<AuditLogEntry>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      render: (entry) => new Date(entry.timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    },
    {
      key: 'admin_email',
      header: 'Admin User',
      sortable: true,
    },
    {
      key: 'action_type',
      header: 'Action Type',
      sortable: true,
      render: (entry) => (
        <span className="font-medium">{formatActionType(entry.action_type)}</span>
      ),
    },
    {
      key: 'target_type',
      header: 'Target Type',
      sortable: true,
      render: (entry) => (
        <span className="capitalize">{formatTargetType(entry.target_type)}</span>
      ),
    },
    {
      key: 'target_id',
      header: 'Target ID',
      render: (entry) => (
        <span className="font-mono text-sm">{entry.target_id.slice(0, 8)}...</span>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      render: (entry) => {
        const detailsCount = Object.keys(entry.details).length;
        return (
          <span className="text-sm text-muted-foreground">
            {detailsCount > 0 ? `${detailsCount} field${detailsCount > 1 ? 's' : ''}` : 'No details'}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground mt-2">
          View all administrative actions and system events
        </p>
      </div>

      {/* Stats */}
      <div className="rounded-lg border bg-card p-6">
        <div className="text-2xl font-bold">{totalCount.toLocaleString()}</div>
        <p className="text-sm text-muted-foreground">Total Audit Entries</p>
      </div>

      {/* Filter Controls */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Filters</h2>
          <div className="flex gap-2">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-4 border-t">
            <div>
              <Label htmlFor="action_type">Action Type</Label>
              <select
                id="action_type"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.action_type}
                onChange={(e) => handleFilterChange('action_type', e.target.value)}
              >
                <option value="">All Actions</option>
                <option value="approve_kyc">Approve KYC</option>
                <option value="reject_kyc">Reject KYC</option>
                <option value="approve_transaction">Approve Transaction</option>
                <option value="reject_transaction">Reject Transaction</option>
                <option value="suspend_user">Suspend User</option>
                <option value="activate_user">Activate User</option>
                <option value="adjust_balance">Adjust Balance</option>
                <option value="update_delivery_status">Update Delivery Status</option>
                <option value="assign_carrier">Assign Carrier</option>
              </select>
            </div>

            <div>
              <Label htmlFor="target_type">Target Type</Label>
              <select
                id="target_type"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.target_type}
                onChange={(e) => handleFilterChange('target_type', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="user">User</option>
                <option value="transaction">Transaction</option>
                <option value="delivery">Delivery</option>
              </select>
            </div>

            <div>
              <Label htmlFor="target_id">Target ID</Label>
              <Input
                id="target_id"
                placeholder="Filter by target ID"
                value={filters.target_id}
                onChange={(e) => handleFilterChange('target_id', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="date_from">Date From</Label>
              <Input
                id="date_from"
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="date_to">Date To</Label>
              <Input
                id="date_to"
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Audit Entries</h2>
          <DataTable
            data={entries}
            columns={columns}
            keyExtractor={(entry) => entry.id}
            isLoading={auditLog.isLoading}
            emptyMessage={hasActiveFilters ? 'No audit entries match your filters' : 'No audit entries found'}
          />
        </div>

        {/* Pagination Controls */}
        {totalCount > 0 && (
          <div className="border-t p-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {Math.ceil(totalCount / 20)}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={!hasPrevious || auditLog.isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!hasNext || auditLog.isLoading}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogPage;
