import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTransactionManagement, type Transaction, type TransactionFilters } from '@/hooks/useTransactionManagement';
import DataTable, { type Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import TransactionDetailModal from '@/components/transactions/TransactionDetailModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, Filter, X } from 'lucide-react';

const TransactionManagementPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTxId, setSelectedTxId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Initialize filters from URL params
  const [filters, setFilters] = useState<TransactionFilters>(() => ({
    status: searchParams.get('status') || '',
    type: searchParams.get('type') || '',
    user: searchParams.get('user') || '',
    date_from: searchParams.get('date_from') || '',
    date_to: searchParams.get('date_to') || '',
    amount_min: searchParams.get('amount_min') || '',
    amount_max: searchParams.get('amount_max') || '',
    search: searchParams.get('search') || '',
  }));

  const { pendingTransactions, useFilteredTransactions } = useTransactionManagement();

  // Determine which query to use based on filters
  const hasActiveFilters = Object.values(filters).some(v => v !== '');
  const filteredTransactions = useFilteredTransactions(filters);
  
  const transactionsQuery = hasActiveFilters ? filteredTransactions : pendingTransactions;
  const transactions = transactionsQuery.data ?? [];

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: transactions.length,
      pending: transactions.filter(t => t.status === 'pending').length,
      completed: transactions.filter(t => t.status === 'completed').length,
      failed: transactions.filter(t => t.status === 'failed').length,
    };
  }, [transactions]);

  // Handle filter changes
  const handleFilterChange = (key: keyof TransactionFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: '',
      type: '',
      user: '',
      date_from: '',
      date_to: '',
      amount_min: '',
      amount_max: '',
      search: '',
    });
  };

  // Define table columns
  const columns: Column<Transaction>[] = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      className: 'font-mono text-sm',
    },
    {
      key: 'user_email',
      header: 'User',
      sortable: true,
    },
    {
      key: 'transaction_type',
      header: 'Type',
      sortable: true,
      render: (tx) => (
        <span className="capitalize">{tx.transaction_type}</span>
      ),
    },
    {
      key: 'metal_name',
      header: 'Metal',
      sortable: true,
    },
    {
      key: 'quantity',
      header: 'Quantity',
      sortable: true,
      render: (tx) => parseFloat(tx.quantity).toFixed(4),
    },
    {
      key: 'total_amount',
      header: 'Amount',
      sortable: true,
      render: (tx) => `$${parseFloat(tx.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (tx) => <StatusBadge status={tx.status} />,
    },
    {
      key: 'created_at',
      header: 'Date',
      sortable: true,
      render: (tx) => new Date(tx.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (tx) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTxId(tx.id);
          }}
        >
          <Eye className="h-4 w-4 mr-2" />
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transaction Management</h1>
        <p className="text-muted-foreground mt-2">
          Review and process platform transactions
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-sm text-muted-foreground">Total Transactions</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">{stats.pending}</div>
          <p className="text-sm text-muted-foreground">Pending</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">{stats.completed}</div>
          <p className="text-sm text-muted-foreground">Completed</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">{stats.failed}</div>
          <p className="text-sm text-muted-foreground">Failed</p>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Search & Filters</h2>
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

        {/* Search */}
        <div>
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search by transaction ID, user email..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-4 border-t">
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
                <option value="convert">Convert</option>
              </select>
            </div>

            <div>
              <Label htmlFor="user">User Email</Label>
              <Input
                id="user"
                placeholder="Filter by user email"
                value={filters.user}
                onChange={(e) => handleFilterChange('user', e.target.value)}
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

            <div>
              <Label htmlFor="amount_min">Min Amount ($)</Label>
              <Input
                id="amount_min"
                type="number"
                placeholder="0.00"
                value={filters.amount_min}
                onChange={(e) => handleFilterChange('amount_min', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="amount_max">Max Amount ($)</Label>
              <Input
                id="amount_max"
                type="number"
                placeholder="0.00"
                value={filters.amount_max}
                onChange={(e) => handleFilterChange('amount_max', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {hasActiveFilters ? 'Filtered Transactions' : 'Pending Transactions'}
          </h2>
          <DataTable
            data={transactions}
            columns={columns}
            keyExtractor={(tx) => tx.id}
            onRowClick={(tx) => setSelectedTxId(tx.id)}
            isLoading={transactionsQuery.isLoading}
            emptyMessage={hasActiveFilters ? 'No transactions match your filters' : 'No pending transactions'}
          />
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTxId && (
        <TransactionDetailModal
          txId={selectedTxId}
          onClose={() => setSelectedTxId(null)}
        />
      )}
    </div>
  );
};

export default TransactionManagementPage;
