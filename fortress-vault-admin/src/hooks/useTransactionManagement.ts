import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';

// Types
export interface TransactionNote {
  id: number;
  admin_user: number;
  admin_user_email?: string;
  note: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  user: number;
  user_email: string;
  transaction_type: 'buy' | 'sell' | 'convert';
  metal: number;
  metal_name: string;
  quantity: string;
  price_per_unit: string;
  total_amount: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at?: string;
  notes?: TransactionNote[];
}

export interface TransactionFilters {
  status?: string;
  type?: string;
  user?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: string;
  amount_max?: string;
  search?: string;
}

export interface ApproveTransactionParams {
  txId: number;
}

export interface RejectTransactionParams {
  txId: number;
  reason: string;
}

export interface AddNoteParams {
  txId: number;
  note: string;
}

export interface GenerateTransactionsParams {
  user_identifier: string;
  date_from: string;
  date_to: string;
  transactions_per_day: number;
}

export interface ClearTransactionsParams {
  user_identifier: string;
  date_from?: string;
  date_to?: string;
  batch_size?: number;
}

/**
 * Custom hook for transaction management operations
 * Provides queries and mutations for transaction review and approval workflow
 */
export function useTransactionManagement() {
  const queryClient = useQueryClient();

  // Query: Get pending transactions
  const pendingTransactions = useQuery({
    queryKey: ['admin', 'transactions', 'pending'],
    queryFn: async () => {
      const response = await api.get<{ results: Transaction[] } | Transaction[]>('/transactions/pending/');
      // Handle both paginated and non-paginated responses
      const data = response.data;
      if (data && typeof data === 'object' && 'results' in data) {
        return data.results;
      }
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 20000, // Consider data stale after 20 seconds
  });

  // Query: Get transaction details
  const useTransactionDetails = (txId: number | null) => {
    return useQuery({
      queryKey: ['admin', 'transactions', 'details', txId],
      queryFn: async () => {
        if (!txId) return null;
        const response = await api.get<Transaction>(`/transactions/${txId}/`);
        return response.data;
      },
      enabled: !!txId, // Only run query if txId is provided
      staleTime: 10000,
    });
  };

  // Query: Get filtered transactions
  const useFilteredTransactions = (filters: TransactionFilters) => {
    return useQuery({
      queryKey: ['admin', 'transactions', 'filtered', filters],
      queryFn: async () => {
        const params = new URLSearchParams();
        
        if (filters.status) params.append('status', filters.status);
        if (filters.type) params.append('type', filters.type);
        if (filters.user) params.append('user', filters.user);
        if (filters.date_from) params.append('date_from', filters.date_from);
        if (filters.date_to) params.append('date_to', filters.date_to);
        if (filters.amount_min) params.append('amount_min', filters.amount_min);
        if (filters.amount_max) params.append('amount_max', filters.amount_max);
        if (filters.search) params.append('search', filters.search);

        const response = await api.get<{ results: Transaction[] } | Transaction[]>(`/transactions/?${params.toString()}`);
        // Handle both paginated and non-paginated responses
        const data = response.data;
        if (data && typeof data === 'object' && 'results' in data) {
          return data.results;
        }
        return Array.isArray(data) ? data : [];
      },
      staleTime: 20000,
    });
  };

  // Mutation: Approve transaction
  const approveTransaction = useMutation({
    mutationFn: async ({ txId }: ApproveTransactionParams) => {
      const response = await api.post(`/transactions/${txId}/approve/`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Transaction approved successfully');
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });

  // Mutation: Reject transaction
  const rejectTransaction = useMutation({
    mutationFn: async ({ txId, reason }: RejectTransactionParams) => {
      const response = await api.post(`/transactions/${txId}/reject/`, { reason });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Transaction rejected');
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });

  // Mutation: Generate synthetic transactions for a customer/date range
  const generateTransactions = useMutation({
    mutationFn: async (payload: GenerateTransactionsParams) => {
      const response = await api.post('/transactions/generate/', payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Synthetic transactions generated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });


  // Mutation: Clear user transactions in batches
  const clearTransactions = useMutation({
    mutationFn: async (payload: ClearTransactionsParams) => {
      const response = await api.post('/transactions/clear_user_transactions/', payload);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Cleared ${data.deleted_count || 0} transactions successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });

  // Mutation: Add note to transaction
  const addNote = useMutation({
    mutationFn: async ({ txId, note }: AddNoteParams) => {
      const response = await api.post(`/transactions/${txId}/notes/`, { note });
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast.success('Note added successfully');
      // Invalidate transaction details to refetch with new note
      queryClient.invalidateQueries({ 
        queryKey: ['admin', 'transactions', 'details', variables.txId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['admin', 'transactions'] 
      });
    },
  });

  return {
    pendingTransactions,
    useTransactionDetails,
    useFilteredTransactions,
    approveTransaction,
    rejectTransaction,
    generateTransactions,
    clearTransactions,
    addNote,
  };
}
