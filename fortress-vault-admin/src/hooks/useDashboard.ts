import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

// Types for dashboard data
export interface DashboardMetrics {
  total_users: number;
  active_users_30d: number;
  pending_kyc: number;
  pending_transactions: number;
  active_deliveries: number;
  total_transaction_volume_30d: number;
  trends: {
    total_users: number;
    active_users_30d: number;
    pending_kyc: number;
    pending_transactions: number;
    active_deliveries: number;
    total_transaction_volume_30d: number;
  };
}

export interface AdminAction {
  id: number;
  admin_user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  action_type: string;
  target_model: string;
  target_id: number;
  details: Record<string, unknown>;
  timestamp: string;
}

export interface Alert {
  id: number;
  type: 'kyc' | 'transaction';
  title: string;
  description: string;
  age_hours: number;
  link: string;
}

/**
 * Custom hook for dashboard data management
 * Implements queries for metrics, recent actions, and alerts
 * with appropriate refetch intervals
 */
export function useDashboard() {
  // Query for dashboard metrics with 60 second refetch interval
  const metrics = useQuery<DashboardMetrics>({
    queryKey: ['admin', 'dashboard', 'metrics'],
    queryFn: async () => {
      const response = await api.get('/dashboard/metrics/');
      return response.data;
    },
    refetchInterval: 60000, // 60 seconds
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  // Query for recent admin actions with 30 second refetch interval
  const recentActions = useQuery<AdminAction[]>({
    queryKey: ['admin', 'dashboard', 'recent-actions'],
    queryFn: async () => {
      const response = await api.get('/dashboard/recent-actions/');
      return response.data;
    },
    refetchInterval: 30000, // 30 seconds
  });

  // Query for alerts with 30 second refetch interval
  const alerts = useQuery<Alert[]>({
    queryKey: ['admin', 'dashboard', 'alerts'],
    queryFn: async () => {
      const response = await api.get('/dashboard/alerts/');
      return response.data;
    },
    refetchInterval: 30000, // 30 seconds
  });

  return {
    metrics,
    recentActions,
    alerts,
  };
}
