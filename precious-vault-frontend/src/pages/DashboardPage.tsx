import { Layout } from '@/components/layout/Layout';
import { StatCard } from '@/components/cards/StatCard';
import { MetalCard } from '@/components/cards/MetalCard';
import { portfolio, metals, transactions, chartData } from '@/data/mockData';
import { Wallet, TrendingUp, Building2, Coins } from 'lucide-react';
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

import { useMockApp } from '@/context/MockAppContext';

export default function DashboardPage() {
  const { transactions: contextTransactions, deliveries: contextDeliveries } = useMockApp();
  // Combine mock data with new context data
  const allTransactions = [...contextTransactions, ...transactions].slice(0, 10);

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
            value={portfolio.totalValue}
            icon={Wallet}
            trend={{ value: 5.2, isPositive: true }}
          />
          <StatCard
            title="Gold Holdings"
            value={portfolio.holdings.find(h => h.metalId === 'gold')?.value || 0}
            subtitle={`${portfolio.holdings.find(h => h.metalId === 'gold')?.amount || 0} oz`}
            icon={Coins}
          />
          <StatCard
            title="Silver Holdings"
            value={portfolio.holdings.find(h => h.metalId === 'silver')?.value || 0}
            subtitle={`${portfolio.holdings.find(h => h.metalId === 'silver')?.amount || 0} oz`}
            icon={TrendingUp}
          />
          <StatCard
            title="Cash Balance"
            value={portfolio.cashBalance}
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
          {/* We can access context here to show delivery count or latest status */}
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
              {allTransactions.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-foreground capitalize">{txn.type}</p>
                    <p className="text-sm text-muted-foreground">{txn.asset}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">
                      ${txn.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">{txn.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metals.slice(0, 4).map((metal) => (
              <Link key={metal.id} to="/buy">
                <MetalCard
                  {...metal}
                  showActions={false}
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
