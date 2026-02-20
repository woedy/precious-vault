import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';

export interface ShipmentEvent {
  id: string;
  status: string;
  description: string;
  location: string | null;
  timestamp: string;
}

export interface ShipmentWorkflowStage {
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

export interface Shipment {
  id: string;
  tracking_number: string | null;
  carrier: string;
  status: string;
  destination_address: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    zip?: string;
    country?: string;
  };
  estimated_delivery: string | null;
  created_at: string;
  updated_at: string;
  events: ShipmentEvent[];
  items_count: number;
  workflow_stages: ShipmentWorkflowStage[];
}

const normalizeShipment = (item: any): Shipment => ({
  ...item,
  events: Array.isArray(item?.events) ? item.events : [],
  workflow_stages: Array.isArray(item?.workflow_stages) ? item.workflow_stages : [],
});

export const useShipments = () => {
  return useQuery<Shipment[]>({
    queryKey: ['shipments'],
    queryFn: async () => {
      const response = await api.get('/trading/shipments/');
      const payload = response.data;

      if (Array.isArray(payload)) {
        return payload.map(normalizeShipment);
      }

      if (payload && typeof payload === 'object' && Array.isArray(payload.results)) {
        return payload.results.map(normalizeShipment);
      }

      return [];
    },
  });
};

export const useCompleteShipmentStageAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shipmentId, action_note }: { shipmentId: string; action_note: string }) => {
      const response = await api.post(`/trading/shipments/${shipmentId}/complete_stage_action/`, {
        action_note,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Stage action submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to submit stage action';
      toast.error(message);
    },
  });
};
