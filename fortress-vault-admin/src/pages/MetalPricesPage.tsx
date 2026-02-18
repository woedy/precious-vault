import React, { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type AdminMetalPrice = {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_24h: number;
  last_updated: string;
};

type AdminMetalPricesResponse = {
  metals: AdminMetalPrice[];
  count: number;
};

type TriggerResponse = {
  task_id: string;
  status: string;
};

type TaskStatusResponse = {
  task_id: string;
  status: string;
  result?: unknown;
  error?: string;
};

const MetalPricesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const prices = useQuery<AdminMetalPricesResponse>({
    queryKey: ['admin', 'metal-prices'],
    queryFn: async () => {
      const res = await api.get('/dashboard/metal-prices/');
      return res.data;
    },
    refetchInterval: 30_000,
  });

  const triggerUpdate = useMutation<TriggerResponse>({
    mutationFn: async () => {
      const res = await api.post('/dashboard/metal-prices/trigger-update/');
      return res.data;
    },
    onSuccess: (data) => {
      setActiveTaskId(data.task_id);
      toast.success('Price update started');
    },
    onError: () => {
      toast.error('Failed to start price update');
    },
  });

  const taskStatus = useQuery<TaskStatusResponse>({
    queryKey: ['admin', 'metal-prices', 'task-status', activeTaskId],
    queryFn: async () => {
      const res = await api.get('/dashboard/metal-prices/update-status/', {
        params: { task_id: activeTaskId },
      });
      return res.data;
    },
    enabled: Boolean(activeTaskId),
    refetchInterval: 2_000,
  });

  useEffect(() => {
    if (!activeTaskId) return;
    const status = taskStatus.data?.status;
    if (!status) return;

    if (status === 'SUCCESS') {
      toast.success('Price update completed');
      setActiveTaskId(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'metal-prices'] });
    }

    if (status === 'FAILURE') {
      toast.error(taskStatus.data?.error || 'Price update failed');
      setActiveTaskId(null);
    }
  }, [activeTaskId, queryClient, taskStatus.data?.error, taskStatus.data?.status]);

  const sortedMetals = useMemo(() => {
    const list = prices.data?.metals ?? [];
    return [...list].sort((a, b) => a.symbol.localeCompare(b.symbol));
  }, [prices.data?.metals]);

  const isBusy = triggerUpdate.isPending || (activeTaskId !== null && taskStatus.isFetching);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Metal Prices</h1>
          <p className="text-sm text-muted-foreground">View current spot prices and manually trigger a refresh.</p>
        </div>

        <Button onClick={() => triggerUpdate.mutate()} disabled={isBusy} className="gap-2">
          {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Trigger Update
        </Button>
      </div>

      {activeTaskId && (
        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground">Task ID</span>
                <div className="font-mono break-all">{activeTaskId}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Status</span>
                <div className="font-semibold">{taskStatus.data?.status ?? '...'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current Prices</CardTitle>
        </CardHeader>
        <CardContent>
          {prices.isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : prices.isError ? (
            <div className="text-sm text-destructive">Failed to load prices.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2">Metal</th>
                    <th className="py-2">Symbol</th>
                    <th className="py-2">Price (USD / oz)</th>
                    <th className="py-2">24h Change (%)</th>
                    <th className="py-2">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMetals.map((m) => (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{m.name}</td>
                      <td className="py-2">{m.symbol}</td>
                      <td className="py-2">${m.current_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="py-2">{m.price_change_24h.toFixed(2)}</td>
                      <td className="py-2">{new Date(m.last_updated).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MetalPricesPage;
