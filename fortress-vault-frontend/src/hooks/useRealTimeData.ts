
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export const useRealTimeData = () => {
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const pricesWsRef = useRef<WebSocket | null>(null);
    const portfolioWsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Price WebSocket - Connect regardless of auth (if public) but usually we might want it always
        // Assuming prices are public or require auth. If public, no token needed.
        // But our middleware might try to parse token if present.
        // Let's assume prices are public for now, or just send token if we have it.
        const token = localStorage.getItem('access_token');
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsBaseUrl = `${wsProtocol}//${window.location.hostname}:9000/ws`;

        // Connect to Prices
        const connectPrices = () => {
            if (pricesWsRef.current?.readyState === WebSocket.OPEN) return;

            const url = `${wsBaseUrl}/prices/`;
            const ws = new WebSocket(url);

            ws.onopen = () => {
                console.log('Connected to Price WebSocket');
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'price_update') {
                        queryClient.setQueryData(['metals'], data.prices);
                        if (data.metal_prices) {
                            queryClient.setQueryData(['metal-prices'], data.metal_prices);
                        }
                    }
                } catch (e) {
                    console.error('Error parsing price update', e);
                }
            };

            ws.onerror = (error) => {
                console.error('Price WebSocket error', error);
            };

            ws.onclose = () => {
                console.log('Price WebSocket closed');
                // Simple reconnect logic could go here
                // setTimeout(connectPrices, 5000);
            };

            pricesWsRef.current = ws;
        };

        connectPrices();

        return () => {
            pricesWsRef.current?.close();
        };
    }, [queryClient]);

    useEffect(() => {
        if (!isAuthenticated) return;

        const token = localStorage.getItem('access_token');
        if (!token) return;

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsBaseUrl = `${wsProtocol}//${window.location.hostname}:9000/ws`;

        const connectPortfolio = () => {
            if (portfolioWsRef.current?.readyState === WebSocket.OPEN) return;

            // Pass token in query string for our custom middleware
            const url = `${wsBaseUrl}/portfolio/?token=${token}`;
            const ws = new WebSocket(url);

            ws.onopen = () => {
                console.log('Connected to Portfolio WebSocket');
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'portfolio_update') {
                        // Invalidate dashboard queries to refetch or update directly
                        // If backend sends full portfolio object:
                        if (data.data) {
                            queryClient.setQueryData(['dashboard'], data.data);
                        } else {
                            // Otherwise just invalidate
                            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
                        }
                    }
                } catch (e) {
                    console.error('Error parsing portfolio update', e);
                }
            };

            ws.onerror = (error) => {
                console.error('Portfolio WebSocket error', error);
            };

            ws.onclose = (e) => {
                console.log('Portfolio WebSocket closed', e.code, e.reason);
            };

            portfolioWsRef.current = ws;
        };

        connectPortfolio();

        return () => {
            portfolioWsRef.current?.close();
        };

    }, [isAuthenticated, queryClient]);
};
