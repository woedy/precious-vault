import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface ShipmentEvent {
    id: string;
    status: string;
    description: string;
    location: string | null;
    timestamp: string;
}

export interface Shipment {
    id: string;
    tracking_number: string | null;
    carrier: string;
    status: string;
    destination_address: {
        street: string;
        city: string;
        zipCode: string; // Map zip_code from backend if necessary or handle in serializer
        country: string;
    };
    estimated_delivery: string | null;
    created_at: string;
    updated_at: string;
    events: ShipmentEvent[];
    items_count: number;
}

export const useShipments = () => {
    return useQuery<Shipment[]>({
        queryKey: ['shipments'],
        queryFn: async () => {
            const response = await api.get('/trading/shipments/');
            return response.data;
        }
    });
};
