import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface MetalPriceItem {
  id: string;
  name: string;
  symbol: string;
  price_usd_per_oz: number;
  price_gbp_per_oz: number | null;
  last_updated: string;
}

export interface MetalPricesResponse {
  fx: {
    usd_to_gbp: number | null;
  };
  metals: MetalPriceItem[];
  count: number;
}

export const useMetalPrices = () => {
  return useQuery({
    queryKey: ['metal-prices'],
    queryFn: async () => {
      const res = await api.get<MetalPricesResponse>('/trading/metal-prices/');
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 10,
  });
};
