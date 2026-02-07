import { Layout } from '@/components/layout/Layout';
import { StatCard } from '@/components/cards/StatCard';
import { MetalCard } from '@/components/cards/MetalCard';
import { useDashboardData, useTransactions, useMetals } from '@/hooks/useDashboardData';
import { Wallet, TrendingUp, Building2, Coins, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { chartData } from '@/data/mockData';

import { useRealTimeData } from '@/hooks/useRealTimeData';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  useRealTimeData(); // Initialize real-time updates
  const { data: dashboard, isLoading: isDashboardLoading } = useDashboardData();
  const { data: transactions, isLoading: isTransactionsLoading } = useTransactions();
  const { data: metals, isLoading: isMetalsLoading } = useMetals();

  if (isDashboardLoading || isTransactionsLoading || isMetalsLoading || isAuthLoading) {
    return (
      <Layout>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Calculate holdings values
  const goldHolding = Array.isArray(dashboard?.holdings) ? dashboard?.holdings.find(h => h.metal.symbol === 'Au') : undefined;
  const silverHolding = Array.isArray(dashboard?.holdings) ? dashboard?.holdings.find(h => h.metal.symbol === 'Ag') : undefined;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your portfolio overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Portfolio Value"
            value={dashboard?.total_value || 0}
            icon={Wallet}
            trend={{ value: 5.2, isPositive: true }}
          />
          <StatCard
            title="Gold Holdings"
            value={goldHolding?.total_value || 0}
            subtitle={`${goldHolding?.total_oz || 0} oz`}
            icon={Coins}
          />
          <StatCard
            title="Silver Holdings"
            value={silverHolding?.total_value || 0}
            subtitle={`${silverHolding?.total_oz || 0} oz`}
            icon={TrendingUp}
          />
          <StatCard
            title="Cash Balance"
            value={dashboard?.cash_balance || 0}
            icon={Building2}
          />
        </div>

        {/* Active Shipments */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-foreground">Active Shipments</h2>
            <Link to="/track">
              <Button variant="outline" size="sm">
                View All Tracking
              </Button>
            </Link>
          </div>
          {/* Active shipments from API would go here */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-2 card-premium">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Portfolio Performance</h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-muted-foreground">1W</Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">1M</Button>
                <Button variant="secondary" size="sm">6M</Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">1Y</Button>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`$${value}`, '']}
                  />
                  <Line
                    type="monotone"
                    dataKey="gold"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                    name="Gold"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card-premium">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
              <Link to="/activity">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {Array.isArray(transactions) && transactions.slice(0, 10).map((txn) => (
                <div key={txn.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-foreground capitalize">{txn.transaction_type}</p>
                    <p className="text-sm text-muted-foreground">
                      {txn.metal?.name || txn.transaction_type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">
                      ${txn.total_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(txn.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {(!transactions || transactions.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No recent transactions</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.isArray(metals) && metals.slice(0, 4).map((metal) => (
              <Link key={metal.id} to="/buy">
                {/* Map API metal data to MetalCard props */}
                <MetalCard
                  id={metal.id}
                  name={metal.name}
                  symbol={metal.symbol}
                  price={metal.current_price}
                  change={metal.price_change_24h}
                  unit="oz"
                  color={metal.symbol === 'Au' ? "from-yellow-400 to-amber-500" : "from-slate-300 to-slate-400"}
                  icon={metal.symbol === 'Au' ? "🥇" : (metal.symbol === 'Ag' ? "🥈" : "⚪")}
                  showActions={false}
                />
              </Link>
            ))}
            <Link to="/deposit">
              <div className="card-premium h-full flex flex-col items-center justify-center p-6 border-dashed border-2 hover:border-gold hover:bg-gold/5 transition-all group">
                <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Wallet className="h-6 w-6 text-gold" />
                </div>
                <h3 className="font-bold text-lg text-foreground">Deposit Cash</h3>
                <p className="text-sm text-muted-foreground text-center mt-2">Fund your wallet to make new purchases</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
