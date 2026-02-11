import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';

// Types
export interface DeliveryHistoryEvent {
  id: string;
  status: string;
  description: string;
  location?: string;
  timestamp: string;
}

export interface DeliveryItem {
  id: string;
  metal_name: string;
  metal_symbol: string;
  product_name: string;
  weight_oz: string;
  quantity: number;
  status: string;
}

export interface Delivery {
  id: string;
  user: number;
  user_email: string;
  user_name: string;
  status: 'processing' | 'shipped' | 'customs' | 'delivered';
  carrier: string;
  tracking_number: string;
  shipping_address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  items: DeliveryItem[];
  history: DeliveryHistoryEvent[];
  estimated_delivery?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryFilters {
  status?: string;
  user?: string;
  date_from?: string;
  date_to?: string;
  carrier?: string;
  search?: string;
}

export interface UpdateStatusParams {
  deliveryId: string;
  status: string;
  description?: string;
}

export interface AssignCarrierParams {
  deliveryId: string;
  carrier: string;
  tracking_number: string;
}

/**
 * Custom hook for delivery management operations
 * Provides queries and mutations for delivery oversight and tracking
 */
export function useDeliveryManagement() {
  const queryClient = useQueryClient();

  // Query: Get delivery list with optional filters
  const useDeliveryList = (filters?: DeliveryFilters) => {
    return useQuery({
      queryKey: ['admin', 'deliveries', 'list', filters],
      queryFn: async () => {
        const params = new URLSearchParams();
        
        if (filters?.status) params.append('status', filters.status);
        if (filters?.user) params.append('user', filters.user);
        if (filters?.date_from) params.append('date_from', filters.date_from);
        if (filters?.date_to) params.append('date_to', filters.date_to);
        if (filters?.carrier) params.append('carrier', filters.carrier);
        if (filters?.search) params.append('search', filters.search);

        const response = await api.get<{ results: Delivery[] } | Delivery[]>(`/deliveries/?${params.toString()}`);
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
  };

  // Query: Get delivery details
  const useDeliveryDetails = (deliveryId: string | null) => {
    return useQuery({
      queryKey: ['admin', 'deliveries', 'details', deliveryId],
      queryFn: async () => {
        if (!deliveryId) return null;
        const response = await api.get<Delivery>(`/deliveries/${deliveryId}/`);
        return response.data;
      },
      enabled: !!deliveryId, // Only run query if deliveryId is provided
      staleTime: 10000,
    });
  };

  // Query: Get delivery history
  const useDeliveryHistory = (deliveryId: string | null) => {
    return useQuery({
      queryKey: ['admin', 'deliveries', 'history', deliveryId],
      queryFn: async () => {
        if (!deliveryId) return [];
        const response = await api.get<{ results: DeliveryHistoryEvent[] } | DeliveryHistoryEvent[]>(`/deliveries/${deliveryId}/history/`);
        // Handle both paginated and non-paginated responses
        const data = response.data;
        if (data && typeof data === 'object' && 'results' in data) {
          return data.results;
        }
        return Array.isArray(data) ? data : [];
      },
      enabled: !!deliveryId,
      staleTime: 10000,
    });
  };

  // Mutation: Update delivery status
  const updateStatus = useMutation({
    mutationFn: async ({ deliveryId, status, description }: UpdateStatusParams) => {
      const response = await api.post(`/deliveries/${deliveryId}/update-status/`, {
        status,
        description,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast.success('Delivery status updated successfully');
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      queryClient.invalidateQueries({ 
        queryKey: ['admin', 'deliveries', 'details', variables.deliveryId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['admin', 'deliveries', 'history', variables.deliveryId] 
      });
    },
  });

  // Mutation: Assign carrier and tracking number
  const assignCarrier = useMutation({
    mutationFn: async ({ deliveryId, carrier, tracking_number }: AssignCarrierParams) => {
      const response = await api.post(`/deliveries/${deliveryId}/assign-carrier/`, {
        carrier,
        tracking_number,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast.success('Carrier assigned successfully');
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'deliveries'] });
      queryClient.invalidateQueries({ 
        queryKey: ['admin', 'deliveries', 'details', variables.deliveryId] 
      });
    },
  });

  return {
    useDeliveryList,
    useDeliveryDetails,
    useDeliveryHistory,
    updateStatus,
    assignCarrier,
  };
}
