import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

// Types matched to backend responses
export interface Metal {
    id: string;
    name: string;
    symbol: string;
    current_price: number;
    price_change_24h: number;
    price_change_percentage_24h: number;
    image_url?: string | null;
}

interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface PortfolioItem {
    id: string;
    metal: Metal;
    product: {
        id: string;
        name: string;
        image_url: string | null;
    };
    weight_oz: number;
    quantity: number;
    purchase_price: number;
    purchase_date: string;
    status: 'vaulted' | 'delivered' | 'in_transit';
    vault_location: {
        id: string;
        city: string;
        country: string;
    } | null;
}

export interface DashboardData {
    total_value: number;
    cash_balance: number;
    holdings: {
        metal: Metal;
        total_oz: number;
        total_value: number;
    }[];
    portfolio_items: PortfolioItem[];
}

export interface Transaction {
    id: string;
    transaction_type: 'buy' | 'sell' | 'convert' | 'deposit' | 'withdraw';
    metal: { symbol: string; name: string } | null;
    amount_oz: number;
    price_per_oz: number;
    total_value: number;
    status: 'pending' | 'completed' | 'failed';
    created_at: string;
}

export const useDashboardData = () => {
    return useQuery({
        queryKey: ['dashboard'],
        queryFn: async () => {
            const response = await api.get<DashboardData>('/trading/portfolio/dashboard/');
            return response.data;
        },
        refetchInterval: 60000, // Refresh every minute
    });
};

export const useTransactions = () => {
    return useQuery({
        queryKey: ['transactions'],
        queryFn: async () => {
            const response = await api.get<Transaction[]>('/trading/transactions/');
            return response.data;
        },
    });
};

export const useMetals = () => {
    return useQuery({
        queryKey: ['metals'],
        queryFn: async () => {
            const response = await api.get<Metal[] | PaginatedResponse<Metal>>('/trading/metals/');
            const data = response.data;
            if (Array.isArray(data)) {
                return data;
            }
            return data.results;
        },
        refetchInterval: 30000, // Refresh every 30s
    });
};
