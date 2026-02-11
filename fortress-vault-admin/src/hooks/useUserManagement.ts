import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';

// Types
export interface PortfolioItem {
  metal_name: string;
  quantity: string;
  current_value: string;
}

export interface RecentTransaction {
  id: number;
  transaction_type: string;
  metal_name: string;
  quantity: string;
  total_amount: string;
  status: string;
  created_at: string;
}

export interface ActivityEvent {
  id: number;
  event_type: string;
  description: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  kyc_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface UserDetail extends User {
  wallet_balance: string;
  portfolio: PortfolioItem[];
  recent_transactions: RecentTransaction[];
}

export interface UserActivity {
  user: User;
  activities: ActivityEvent[];
}

export interface SearchUsersParams {
  query: string;
}

export interface SuspendUserParams {
  userId: number;
  reason: string;
}

export interface ActivateUserParams {
  userId: number;
}

export interface AdjustBalanceParams {
  userId: number;
  amount: number;
  reason: string;
}

/**
 * Custom hook for user management operations
 * Provides queries and mutations for user account management
 */
export function useUserManagement() {
  const queryClient = useQueryClient();

  // Query: Search users
  const useSearchUsers = (query: string) => {
    return useQuery({
      queryKey: ['admin', 'users', 'search', query],
      queryFn: async () => {
        if (!query || query.trim().length === 0) return [];
        const response = await api.get<{ results: User[] } | User[]>(`/users/search/?q=${encodeURIComponent(query)}`);
        // Handle both paginated and non-paginated responses
        const data = response.data;
        if (data && typeof data === 'object' && 'results' in data) {
          return data.results;
        }
        return Array.isArray(data) ? data : [];
      },
      enabled: query.trim().length > 0, // Only run query if there's a search term
      staleTime: 10000,
    });
  };

  // Query: Get all users with pagination
  const useUsers = (page: number = 1, pageSize: number = 20) => {
    return useQuery({
      queryKey: ['admin', 'users', 'list', page, pageSize],
      queryFn: async () => {
        const response = await api.get<{ results: User[]; count: number; next: string | null; previous: string | null }>(`/users/?page=${page}&page_size=${pageSize}`);
        return response.data;
      },
      staleTime: 30000,
    });
  };

  // Query: Get user details
  const useUserDetails = (userId: number | null) => {
    return useQuery({
      queryKey: ['admin', 'users', 'details', userId],
      queryFn: async () => {
        if (!userId) return null;
        const response = await api.get<UserDetail>(`/users/${userId}/`);
        return response.data;
      },
      enabled: !!userId, // Only run query if userId is provided
      staleTime: 10000,
    });
  };

  // Query: Get user activity timeline
  const useUserActivity = (userId: number | null) => {
    return useQuery({
      queryKey: ['admin', 'users', 'activity', userId],
      queryFn: async () => {
        if (!userId) return [];
        const response = await api.get<{ results: ActivityEvent[] } | ActivityEvent[]>(`/users/${userId}/activity/`);
        // Handle both paginated and non-paginated responses
        const data = response.data;
        if (data && typeof data === 'object' && 'results' in data) {
          return data.results;
        }
        return Array.isArray(data) ? data : [];
      },
      enabled: !!userId,
      staleTime: 20000,
    });
  };

  // Mutation: Suspend user account
  const suspendUser = useMutation({
    mutationFn: async ({ userId, reason }: SuspendUserParams) => {
      const response = await api.post(`/users/${userId}/suspend/`, { reason });
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast.success('User account suspended');
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'users', 'details', variables.userId]
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });

  // Mutation: Activate user account
  const activateUser = useMutation({
    mutationFn: async ({ userId }: ActivateUserParams) => {
      const response = await api.post(`/users/${userId}/activate/`);
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast.success('User account activated');
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'users', 'details', variables.userId]
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });

  // Mutation: Adjust user wallet balance
  const adjustBalance = useMutation({
    mutationFn: async ({ userId, amount, reason }: AdjustBalanceParams) => {
      const response = await api.post(`/users/${userId}/adjust-balance/`, {
        amount,
        reason
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast.success('Balance adjusted successfully');
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({
        queryKey: ['admin', 'users', 'details', variables.userId]
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });

  return {
    useSearchUsers,
    useUsers,
    useUserDetails,
    useUserActivity,
    suspendUser,
    activateUser,
    adjustBalance,
  };
}
