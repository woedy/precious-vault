import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

// Types for audit log data
export interface AuditLogEntry {
  id: string;
  admin_user: number;
  admin_email: string;
  action_type: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export interface AuditLogFilters {
  action_type?: string;
  admin_user?: number;
  date_from?: string;
  date_to?: string;
  target_type?: string;
  target_id?: string;
  page?: number;
}

export interface PaginatedAuditLogResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AuditLogEntry[];
}

/**
 * Custom hook for audit log management
 * Provides queries for audit log list with filtering
 */
export function useAuditLog(filters: AuditLogFilters = {}) {
  // Query: Get audit log entries with filtering and pagination
  const auditLog = useQuery<PaginatedAuditLogResponse>({
    queryKey: ['admin', 'audit', filters],
    queryFn: async () => {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters.action_type) {
        params.append('action_type', filters.action_type);
      }
      if (filters.admin_user) {
        params.append('admin_user', filters.admin_user.toString());
      }
      if (filters.date_from) {
        params.append('date_from', filters.date_from);
      }
      if (filters.date_to) {
        params.append('date_to', filters.date_to);
      }
      if (filters.target_type) {
        params.append('target_type', filters.target_type);
      }
      if (filters.target_id) {
        params.append('target_id', filters.target_id);
      }
      if (filters.page) {
        params.append('page', filters.page.toString());
      }
      
      const response = await api.get<PaginatedAuditLogResponse>(
        `/audit/?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  // Query: Get single audit log entry details
  const useAuditLogDetails = (id: string | null) => {
    return useQuery<AuditLogEntry>({
      queryKey: ['admin', 'audit', 'details', id],
      queryFn: async () => {
        if (!id) throw new Error('Audit log ID is required');
        const response = await api.get<AuditLogEntry>(`/audit/${id}/`);
        return response.data;
      },
      enabled: !!id, // Only run query if id is provided
      staleTime: 60000, // Audit logs don't change, can be cached longer
    });
  };

  return {
    auditLog,
    useAuditLogDetails,
  };
}
