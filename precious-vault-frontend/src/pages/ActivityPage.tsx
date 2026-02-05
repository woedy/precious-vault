import { Layout } from '@/components/layout/Layout';
import { transactions } from '@/data/mockData';
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
import { ArrowUpRight, ArrowDownRight, Building2, Banknote, Wallet } from 'lucide-react';

const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
  buy: { icon: ArrowDownRight, color: 'text-success', label: 'Buy' },
  sell: { icon: ArrowUpRight, color: 'text-destructive', label: 'Sell' },
  storage: { icon: Building2, color: 'text-muted-foreground', label: 'Storage' },
  cashout: { icon: Banknote, color: 'text-primary', label: 'Cash Out' },
  deposit: { icon: Wallet, color: 'text-success', label: 'Deposit' },
};

export default function ActivityPage() {
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
            <p className="text-2xl font-bold text-foreground">{transactions.length}</p>
            <p className="text-sm text-muted-foreground">Total Transactions</p>
          </div>
          <div className="card-premium text-center">
            <p className="text-2xl font-bold text-success">
              {transactions.filter(t => t.type === 'buy').length}
            </p>
            <p className="text-sm text-muted-foreground">Purchases</p>
          </div>
          <div className="card-premium text-center">
            <p className="text-2xl font-bold text-destructive">
              {transactions.filter(t => t.type === 'sell').length}
            </p>
            <p className="text-sm text-muted-foreground">Sales</p>
          </div>
          <div className="card-premium text-center">
            <p className="text-2xl font-bold text-primary">
              {transactions.filter(t => t.type === 'cashout').length}
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
              {transactions.map((txn) => {
                const config = typeConfig[txn.type];
                const Icon = config.icon;
                return (
                  <TableRow key={txn.id}>
                    <TableCell className="font-medium">{txn.date}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-4 w-4", config.color)} />
                        <span className="capitalize">{config.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>{txn.asset}</TableCell>
                    <TableCell>{txn.amount}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${txn.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {transactions.map((txn) => {
            const config = typeConfig[txn.type];
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
                    <span className="text-foreground">{txn.asset}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="text-foreground">{txn.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Value</span>
                    <span className="font-medium text-foreground">
                      ${txn.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="text-foreground">{txn.date}</span>
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
