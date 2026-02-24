import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';

// Types
export interface IdentityDocument {
  id: number;
  document_type: string;
  document_url: string;
  uploaded_at: string;
}

export interface KYCUser {
  id: number;
  user_email: string;
  user_name: string;
  kyc_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  kyc_submitted_at: string;
  created_at: string;
  documents?: IdentityDocument[];
}

export interface KYCHistoryEntry {
  id: number;
  status: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
}

export interface KYCDetails extends KYCUser {
  documents: IdentityDocument[];
  history?: KYCHistoryEntry[];
}

export interface ApproveKYCParams {
  userId: number;
}

export interface RejectKYCParams {
  userId: number;
  reason: string;
}

export interface BulkApproveKYCParams {
  userIds: number[];
}

export interface BulkRejectKYCParams {
  userIds: number[];
  reason: string;
}

export interface BulkOperationResult {
  successful: number[];
  failed: Array<{
    userId: number;
    error: string;
  }>;
  total: number;
}

export interface AdminPaginatedResponse<T> {
  results: T[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * Custom hook for KYC management operations
 * Provides queries and mutations for KYC verification workflow
 */
export function useKYCManagement() {
  const queryClient = useQueryClient();

  // Query: Get pending KYC requests
  const pendingKYC = (page: number = 1, pageSize: number = 20) => useQuery({
    queryKey: ['admin', 'kyc', 'pending', page, pageSize],
    queryFn: async () => {
      const response = await api.get<AdminPaginatedResponse<KYCUser> | KYCUser[]>(`/kyc/pending/?page=${page}&page_size=${pageSize}`);
      const data = response.data;
      if (data && typeof data === 'object' && 'results' in data) {
        return data;
      }
      const items = Array.isArray(data) ? data : [];
      return { results: items, count: items.length, page, page_size: pageSize, total_pages: Math.max(1, Math.ceil(items.length / pageSize)) } as AdminPaginatedResponse<KYCUser>;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 20000, // Consider data stale after 20 seconds
  });

  // Query: Get KYC details for a specific user
  const useKYCDetails = (userId: number | null) => {
    return useQuery({
      queryKey: ['admin', 'kyc', 'details', userId],
      queryFn: async () => {
        if (!userId) return null;
        const response = await api.get<KYCDetails>(`/kyc/${userId}/`);
        return response.data;
      },
      enabled: !!userId, // Only run query if userId is provided
      staleTime: 10000,
    });
  };

  // Query: Get KYC history for a specific user
  const useKYCHistory = (userId: number | null) => {
    return useQuery({
      queryKey: ['admin', 'kyc', 'history', userId],
      queryFn: async () => {
        if (!userId) return [];
        const response = await api.get<KYCHistoryEntry[]>(`/kyc/${userId}/history/`);
        return response.data;
      },
      enabled: !!userId,
      staleTime: 30000,
    });
  };

  // Mutation: Approve KYC request
  const approveKYC = useMutation({
    mutationFn: async ({ userId }: ApproveKYCParams) => {
      const response = await api.post(`/kyc/${userId}/approve/`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('KYC request approved successfully');
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'kyc'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });

  // Mutation: Reject KYC request
  const rejectKYC = useMutation({
    mutationFn: async ({ userId, reason }: RejectKYCParams) => {
      const response = await api.post(`/kyc/${userId}/reject/`, { reason });
      return response.data;
    },
    onSuccess: () => {
      toast.success('KYC request rejected');
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'kyc'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });

  // Mutation: Bulk approve KYC requests
  const bulkApproveKYC = useMutation({
    mutationFn: async ({ userIds }: BulkApproveKYCParams) => {
      const response = await api.post<BulkOperationResult>('/kyc/bulk-approve/', { 
        user_ids: userIds 
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Bulk operation completed: ${data.successful.length} approved`);
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'kyc'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });

  // Mutation: Bulk reject KYC requests
  const bulkRejectKYC = useMutation({
    mutationFn: async ({ userIds, reason }: BulkRejectKYCParams) => {
      const response = await api.post<BulkOperationResult>('/kyc/bulk-reject/', { 
        user_ids: userIds,
        reason 
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Bulk operation completed: ${data.successful.length} rejected`);
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'kyc'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });

  return {
    pendingKYC,
    useKYCDetails,
    useKYCHistory,
    approveKYC,
    rejectKYC,
    bulkApproveKYC,
    bulkRejectKYC,
  };
}
