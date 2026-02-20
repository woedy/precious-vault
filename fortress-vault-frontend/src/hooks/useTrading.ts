
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface BuyRequest {
    product_id: string;
    quantity: number;
    delivery_method: 'vault' | 'delivery';
    vault_id?: string;
}

export interface SellRequest {
    portfolio_item_id: string;
    amount_oz: number;
}

export interface DepositRequest {
    amount: number;
}

export const useTrading = () => {
    const queryClient = useQueryClient();

    const buyMutation = useMutation({
        mutationFn: async (data: BuyRequest) => {
            const response = await api.post('/trading/trade/buy/', data);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Purchase successful!');
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Purchase failed');
        }
    });

    const sellMutation = useMutation({
        mutationFn: async (data: SellRequest) => {
            const response = await api.post('/trading/trade/sell/', data);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Sale successful!');
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Sale failed');
        }
    });

    const convertMutation = useMutation({
        mutationFn: async (data: SellRequest) => { // Reusing SellRequest as structure is identical
            const response = await api.post('/trading/trade/convert/', data);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Conversion successful!');
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Conversion failed');
        }
    });

    const depositMutation = useMutation({
        mutationFn: async (data: DepositRequest) => {
            const response = await api.post('/trading/trade/deposit/', data);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Deposit successful!');
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Deposit failed');
        }
    });

    const requestDeliveryMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post('/trading/trade/request_delivery/', data);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Delivery request submitted!');
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Delivery request failed');
        }
    });

    return {
        buy: buyMutation,
        sell: sellMutation,
        convert: convertMutation,
        deposit: depositMutation,
        requestDelivery: requestDeliveryMutation
    };
};
