
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface Vault {
    id: string;
    name: string;
    city: string;
    country: string;
    flag_emoji: string;
    storage_fee_percent: number;
    is_allocated: boolean;
    is_insured: boolean;
    capacity_percent: number;
    status: string;
}

export const useVaults = () => {
    return useQuery({
        queryKey: ['vaults'],
        queryFn: async () => {
            const res = await api.get<Vault[] | PaginatedResponse<Vault>>('/vaults/');
            const data = res.data;
            if (Array.isArray(data)) {
                return data;
            }
            return data.results;
        }
    });
};
