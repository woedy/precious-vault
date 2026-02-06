import { Layout } from '@/components/layout/Layout';
import { useTransactions } from '@/hooks/useDashboardData';
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
import { ArrowUpRight, ArrowDownRight, Building2, Banknote, Wallet, Loader2 } from 'lucide-react';

const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
  buy: { icon: ArrowDownRight, color: 'text-success', label: 'Buy' },
  sell: { icon: ArrowUpRight, color: 'text-destructive', label: 'Sell' },
  storage: { icon: Building2, color: 'text-muted-foreground', label: 'Storage' },
  withdraw: { icon: Banknote, color: 'text-primary', label: 'Withdraw' }, // Changed to 'withdraw' to match API
  convert: { icon: ArrowUpRight, color: 'text-primary', label: 'Convert' },
  deposit: { icon: Wallet, color: 'text-success', label: 'Deposit' },
};

export default function ActivityPage() {
  const { data: transactions, isLoading } = useTransactions();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const txns = Array.isArray(transactions) ? transactions : [];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Transaction History</h1>
          <p className="text-muted-foreground">
            View all your account activity and transaction details.
          </p>
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
              {txns.filter(t => t.transaction_type === 'withdraw').length}
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
                        <span className="capitalize">{txn.transaction_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>{txn.metal?.name || '-'}</TableCell>
                    <TableCell>{txn.amount_oz ? `${txn.amount_oz} oz` : '-'}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${txn.total_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                    <span className="font-medium capitalize">{txn.transaction_type}</span>
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
                      ${txn.total_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
      </div>
    </Layout>
  );
}
