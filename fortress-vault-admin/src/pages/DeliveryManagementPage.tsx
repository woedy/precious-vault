import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDeliveryManagement, type Delivery, type DeliveryFilters } from '@/hooks/useDeliveryManagement';
import DataTable, { type Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import DeliveryDetailModal from '@/components/delivery/DeliveryDetailModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, Filter, X, Package } from 'lucide-react';

const DeliveryManagementPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Initialize filters from URL params
  const [filters, setFilters] = useState<DeliveryFilters>(() => ({
    status: searchParams.get('status') || '',
    user: searchParams.get('user') || '',
    date_from: searchParams.get('date_from') || '',
    date_to: searchParams.get('date_to') || '',
    carrier: searchParams.get('carrier') || '',
    search: searchParams.get('search') || '',
  }));

  const { useDeliveryList } = useDeliveryManagement();

  // Determine which query to use based on filters
  const hasActiveFilters = Object.values(filters).some(v => v !== '');
  const deliveriesQuery = useDeliveryList(hasActiveFilters ? filters : undefined);
  const deliveries = deliveriesQuery.data ?? [];

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
      total: deliveries.length,
      preparing: deliveries.filter(d => d.status === 'preparing').length,
      shipped: deliveries.filter(d => d.status === 'shipped').length,
      delivered: deliveries.filter(d => d.status === 'delivered').length,
    };
  }, [deliveries]);

  // Handle filter changes
  const handleFilterChange = (key: keyof DeliveryFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: '',
      user: '',
      date_from: '',
      date_to: '',
      carrier: '',
      search: '',
    });
  };

  // Define table columns
  const columns: Column<Delivery>[] = [
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
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (delivery) => <StatusBadge status={delivery.status} />,
    },
    {
      key: 'carrier',
      header: 'Carrier',
      sortable: true,
      render: (delivery) => delivery.carrier || <span className="text-muted-foreground">Not assigned</span>,
    },
    {
      key: 'tracking_number',
      header: 'Tracking Number',
      sortable: true,
      render: (delivery) => delivery.tracking_number ? (
        <span className="font-mono text-sm">{delivery.tracking_number}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Date',
      sortable: true,
      render: (delivery) => new Date(delivery.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (delivery) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDeliveryId(delivery.id);
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
        <h1 className="text-3xl font-bold tracking-tight">Delivery Management</h1>
        <p className="text-muted-foreground mt-2">
          Oversee physical delivery requests and shipment tracking
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Total Deliveries</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">{stats.preparing}</div>
          <p className="text-sm text-muted-foreground">Preparing</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">{stats.shipped}</div>
          <p className="text-sm text-muted-foreground">Shipped</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">{stats.delivered}</div>
          <p className="text-sm text-muted-foreground">Delivered</p>
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
            placeholder="Search by delivery ID, user email, tracking number..."
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
                <option value="requested">Requested</option>
                <option value="preparing">Preparing</option>
                <option value="shipped">Shipped</option>
                <option value="in_transit">In Transit</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <Label htmlFor="carrier">Carrier</Label>
              <select
                id="carrier"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.carrier}
                onChange={(e) => handleFilterChange('carrier', e.target.value)}
              >
                <option value="">All Carriers</option>
                <option value="FedEx">FedEx</option>
                <option value="UPS">UPS</option>
                <option value="DHL">DHL</option>
                <option value="USPS">USPS</option>
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
          </div>
        )}
      </div>

      {/* Deliveries Table */}
      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {hasActiveFilters ? 'Filtered Deliveries' : 'All Deliveries'}
          </h2>
          <DataTable
            data={deliveries}
            columns={columns}
            keyExtractor={(delivery) => delivery.id}
            onRowClick={(delivery) => setSelectedDeliveryId(delivery.id)}
            isLoading={deliveriesQuery.isLoading}
            emptyMessage={hasActiveFilters ? 'No deliveries match your filters' : 'No deliveries found'}
          />
        </div>
      </div>

      {/* Delivery Detail Modal */}
      {selectedDeliveryId && (
        <DeliveryDetailModal
          deliveryId={selectedDeliveryId}
          onClose={() => setSelectedDeliveryId(null)}
        />
      )}
    </div>
  );
};

export default DeliveryManagementPage;
