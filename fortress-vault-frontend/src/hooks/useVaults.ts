
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Vault {
    id: string;
    location_name: string;
    city: string;
    country: string;
    flag?: string; // Legacy
    flag_emoji: string;
    storage_fee_percent: number;
    description?: string;
    is_active: boolean;
}

export const useVaults = () => {
    return useQuery({
        queryKey: ['vaults'],
        queryFn: async () => {
            const res = await api.get<Vault[]>('/vaults/');
            return res.data;
        }
    });
};
