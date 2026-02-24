import { Layout } from '@/components/layout/Layout';
import { Transaction, useOutstandingDebts, useTransactionsPage } from '@/hooks/useDashboardData';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpRight, ArrowDownRight, Building2, Banknote, Wallet, Loader2, ReceiptText } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
  buy: { icon: ArrowDownRight, color: 'text-success', label: 'Buy' },
  sell: { icon: ArrowUpRight, color: 'text-destructive', label: 'Sell' },
  storage_fee: { icon: Building2, color: 'text-muted-foreground', label: 'Storage Fee' },
  tax: { icon: ReceiptText, color: 'text-amber-500', label: 'Tax' },
  withdrawal: { icon: Banknote, color: 'text-primary', label: 'Withdrawal' },
  convert: { icon: ArrowUpRight, color: 'text-primary', label: 'Convert' },
  deposit: { icon: Wallet, color: 'text-success', label: 'Deposit' },
};

export default function ActivityPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const { data: transactionsPage, isLoading } = useTransactionsPage(currentPage);
  const { data: outstandingDebts, isLoading: debtsLoading } = useOutstandingDebts();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const settleDebts = useMutation({
    mutationFn: async () => {
      const response = await api.post('/trading/transactions/settle_outstanding_debts/');
      return response.data;
    },
    onSuccess: (data) => {
      toast({ title: 'Outstanding debts settled', description: `Paid $${Number(data.total_paid || 0).toFixed(2)} successfully.` });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['outstanding-debts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Unable to settle debts',
        description: error?.response?.data?.error || 'Please check your cash balance and try again.',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const txns: Transaction[] = transactionsPage?.items || [];
  const totalCount = transactionsPage?.count || 0;
  const pageSize = txns.length || 20;
  const totalPages = Math.max(1, Math.ceil(totalCount / Math.max(pageSize, 1)));

  const formatAmount = (value: number) => Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Transaction History</h1>
          <p className="text-muted-foreground">
            View all your account activity and transaction details.
          </p>
        </div>

        <div className="card-premium mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Outstanding Debts</h2>
            <p className="text-sm text-muted-foreground">
              Accumulated unpaid storage fees and taxes.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Due</p>
            <p className="text-2xl font-bold text-amber-500">${formatAmount(outstandingDebts?.total_due || 0)}</p>
            <p className="text-xs text-muted-foreground">{outstandingDebts?.count || 0} unpaid items</p>
          </div>
          <Button
            onClick={() => settleDebts.mutate()}
            disabled={debtsLoading || settleDebts.isPending || !outstandingDebts || outstandingDebts.count === 0}
          >
            {settleDebts.isPending ? 'Settling...' : 'Settle Now'}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card-premium text-center">
            <p className="text-2xl font-bold text-foreground">{txns.length}</p>
            <p className="text-sm text-muted-foreground">Total Transactions</p>
          </div>
          <div className="card-premium text-center">
            <p className="text-2xl font-bold text-success">
              {txns.filter(t => t.transaction_type === 'buy').length}
            </p>
            <p className="text-sm text-muted-foreground">Purchases</p>
          </div>
          <div className="card-premium text-center">
            <p className="text-2xl font-bold text-destructive">
              {txns.filter(t => t.transaction_type === 'sell').length}
            </p>
            <p className="text-sm text-muted-foreground">Sales</p>
          </div>
          <div className="card-premium text-center">
            <p className="text-2xl font-bold text-primary">
              {txns.filter(t => t.transaction_type === 'withdrawal').length}
            </p>
            <p className="text-sm text-muted-foreground">Cash Outs</p>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block card-premium">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txns.map((txn) => {
                const config = typeConfig[txn.transaction_type] || typeConfig['buy'];
                const Icon = config.icon;
                return (
                  <TableRow key={txn.id}>
                    <TableCell className="font-medium">{new Date(txn.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-4 w-4", config.color)} />
                        <span className="capitalize">{config.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>{txn.metal?.name || '-'}</TableCell>
                    <TableCell>{txn.amount_oz ? `${txn.amount_oz} oz` : '-'}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${formatAmount(txn.total_value)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className={cn(
                          txn.status === 'completed'
                            ? "border-success/50 text-success bg-success/10"
                            : "border-muted text-muted-foreground"
                        )}
                      >
                        {txn.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {txns.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-4">No transactions found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>


        <div className="hidden md:flex items-center justify-between mt-4 mb-6">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} • {totalCount} total transactions
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage <= 1}>First</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>Next</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages}>Last</Button>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {txns.map((txn) => {
            const config = typeConfig[txn.transaction_type] || typeConfig['buy'];
            const Icon = config.icon;
            return (
              <div key={txn.id} className="card-premium">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-5 w-5", config.color)} />
                    <span className="font-medium capitalize">{config.label}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      txn.status === 'completed'
                        ? "border-success/50 text-success bg-success/10"
                        : "border-muted text-muted-foreground"
                    )}
                  >
                    {txn.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Asset</span>
                    <span className="text-foreground">{txn.metal?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="text-foreground">{txn.amount_oz ? `${txn.amount_oz} oz` : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Value</span>
                    <span className="font-medium text-foreground">
                      ${formatAmount(txn.total_value)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="text-foreground">{new Date(txn.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="md:hidden flex items-center justify-between mt-4">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>Previous</Button>
          <p className="text-xs text-muted-foreground">Page {currentPage} / {totalPages}</p>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>Next</Button>
        </div>

      </div>
    </Layout>
  );
}
