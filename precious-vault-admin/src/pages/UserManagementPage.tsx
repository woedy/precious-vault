import React, { useState, useMemo } from 'react';
import { useUserManagement, type User } from '@/hooks/useUserManagement';
import DataTable, { type Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import UserDetailModal from '@/components/users/UserDetailModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Eye } from 'lucide-react';

const UserManagementPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const pageSize = 20;

  const { useSearchUsers, useUsers } = useUserManagement();

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Use search query if present, otherwise use paginated list
  const searchResults = useSearchUsers(debouncedQuery);
  const usersList = useUsers(currentPage, pageSize);

  const isSearching = debouncedQuery.trim().length > 0;
  const usersQuery = isSearching ? searchResults : usersList;
  
  // Extract users array based on query type
  let users: User[] = [];
  let totalItems = 0;
  
  if (isSearching) {
    const searchData = usersQuery.data;
    if (Array.isArray(searchData)) {
      users = searchData;
      totalItems = searchData.length;
    }
  } else {
    const listData = usersQuery.data;
    if (listData && typeof listData === 'object' && 'results' in listData) {
      users = listData.results;
      totalItems = listData.count;
    }
  }
  
  const totalPages = isSearching ? 1 : Math.ceil(totalItems / pageSize);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: totalItems,
      active: users.filter((u: User) => u.is_active).length,
      suspended: users.filter((u: User) => !u.is_active).length,
      verified: users.filter((u: User) => u.kyc_status === 'verified').length,
      pending: users.filter((u: User) => u.kyc_status === 'pending').length,
    };
  }, [users, totalItems]);

  // Define table columns
  const columns: Column<User>[] = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      className: 'font-mono text-sm w-20',
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      className: 'font-medium',
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (user) => `${user.first_name} ${user.last_name}`.trim() || '-',
    },
    {
      key: 'kyc_status',
      header: 'KYC Status',
      sortable: true,
      render: (user) => <StatusBadge status={user.kyc_status} />,
    },
    {
      key: 'is_active',
      header: 'Account Status',
      sortable: true,
      render: (user) => (
        <StatusBadge status={user.is_active ? 'active' : 'suspended'} />
      ),
    },
    {
      key: 'date_joined',
      header: 'Join Date',
      sortable: true,
      render: (user) => new Date(user.date_joined).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    },
    {
      key: 'last_login',
      header: 'Last Login',
      sortable: true,
      render: (user) => user.last_login 
        ? new Date(user.last_login).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : 'Never',
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
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-2">
          Search and manage platform users
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-sm text-muted-foreground">Total Users</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">{stats.active}</div>
          <p className="text-sm text-muted-foreground">Active</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">{stats.suspended}</div>
          <p className="text-sm text-muted-foreground">Suspended</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">{stats.verified}</div>
          <p className="text-sm text-muted-foreground">KYC Verified</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">{stats.pending}</div>
          <p className="text-sm text-muted-foreground">KYC Pending</p>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <Label htmlFor="search">Search Users</Label>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by username, email, or user ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {isSearching && (
            <p className="text-sm text-muted-foreground mt-2">
              {usersQuery.isLoading 
                ? 'Searching...' 
                : `Found ${users.length} user(s)`}
            </p>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {isSearching ? 'Search Results' : 'All Users'}
          </h2>
          <DataTable
            data={users}
            columns={columns}
            keyExtractor={(user) => user.id}
            onRowClick={(user) => setSelectedUserId(user.id)}
            isLoading={usersQuery.isLoading}
            emptyMessage={
              isSearching 
                ? 'No users match your search' 
                : 'No users found'
            }
            pagination={!isSearching ? {
              currentPage,
              totalPages,
              pageSize,
              totalItems,
              onPageChange: setCurrentPage,
            } : undefined}
          />
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
};

export default UserManagementPage;
