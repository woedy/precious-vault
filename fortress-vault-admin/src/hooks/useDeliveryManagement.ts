import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';

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

export interface DeliveryWorkflowStage {
  id: string;
  code: string;
  name: string;
  stage_order: number;
  status: 'pending' | 'in_progress' | 'completed';
  requires_customer_action: boolean;
  customer_action_completed: boolean;
  customer_action_note: string;
  customer_action_completed_at: string | null;
  is_blocked: boolean;
  blocked_reason: string;
  blocked_at: string | null;
  completed_at: string | null;
}

export interface Delivery {
  id: string;
  user: number;
  user_email: string;
  user_name: string;
  status: 'requested' | 'preparing' | 'shipped' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed';
  carrier: string;
  tracking_number: string;
  shipping_address: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    zip?: string;
    country?: string;
  };
  items: DeliveryItem[];
  history: DeliveryHistoryEvent[];
  workflow_stages: DeliveryWorkflowStage[];
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

export function useDeliveryManagement() {
  const queryClient = useQueryClient();

  const invalidateDeliveryQueries = (deliveryId?: string) => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'deliveries'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    if (deliveryId) {
      queryClient.invalidateQueries({ queryKey: ['admin', 'deliveries', 'details', deliveryId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'deliveries', 'history', deliveryId] });
    }
  };

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
        const data = response.data;
        if (data && typeof data === 'object' && 'results' in data) {
          return data.results;
        }
        return Array.isArray(data) ? data : [];
      },
      refetchInterval: 30000,
      staleTime: 20000,
    });
  };

  const useDeliveryDetails = (deliveryId: string | null) => {
    return useQuery({
      queryKey: ['admin', 'deliveries', 'details', deliveryId],
      queryFn: async () => {
        if (!deliveryId) return null;
        const response = await api.get<Delivery>(`/deliveries/${deliveryId}/`);
        return response.data;
      },
      enabled: !!deliveryId,
      staleTime: 10000,
    });
  };

  const useDeliveryHistory = (deliveryId: string | null) => {
    return useQuery({
      queryKey: ['admin', 'deliveries', 'history', deliveryId],
      queryFn: async () => {
        if (!deliveryId) return [];
        const response = await api.get<{ history?: DeliveryHistoryEvent[] } | DeliveryHistoryEvent[]>(`/deliveries/${deliveryId}/history/`);
        const data = response.data;
        if (Array.isArray(data)) {
          return data;
        }
        return data.history ?? [];
      },
      enabled: !!deliveryId,
      staleTime: 10000,
    });
  };

  const updateStatus = useMutation({
    mutationFn: async ({ deliveryId, status, description }: UpdateStatusParams) => {
      const response = await api.post(`/deliveries/${deliveryId}/update_status/`, {
        status,
        description,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast.success('Delivery status updated successfully');
      invalidateDeliveryQueries(variables.deliveryId);
    },
  });

  const assignCarrier = useMutation({
    mutationFn: async ({ deliveryId, carrier, tracking_number }: AssignCarrierParams) => {
      const response = await api.post(`/deliveries/${deliveryId}/assign_carrier/`, {
        carrier,
        tracking_number,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast.success('Carrier assigned successfully');
      invalidateDeliveryQueries(variables.deliveryId);
    },
  });

  const blockStage = useMutation({
    mutationFn: async ({ deliveryId, stage_code, reason }: { deliveryId: string; stage_code: string; reason: string }) => {
      const response = await api.post(`/deliveries/${deliveryId}/block_stage/`, { stage_code, reason });
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast.success('Stage blocked');
      invalidateDeliveryQueries(variables.deliveryId);
    },
  });

  const unblockStage = useMutation({
    mutationFn: async ({ deliveryId, stage_code }: { deliveryId: string; stage_code: string }) => {
      const response = await api.post(`/deliveries/${deliveryId}/unblock_stage/`, { stage_code });
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast.success('Stage unblocked');
      invalidateDeliveryQueries(variables.deliveryId);
    },
  });

  const advanceStage = useMutation({
    mutationFn: async ({ deliveryId }: { deliveryId: string }) => {
      const response = await api.post(`/deliveries/${deliveryId}/advance_stage/`, {});
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast.success('Workflow advanced');
      invalidateDeliveryQueries(variables.deliveryId);
    },
  });

  return {
    useDeliveryList,
    useDeliveryDetails,
    useDeliveryHistory,
    updateStatus,
    assignCarrier,
    blockStage,
    unblockStage,
    advanceStage,
  };
}
