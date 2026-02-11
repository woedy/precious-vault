import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useDashboard } from '@/hooks/useDashboard';
import MetricCard from '@/components/MetricCard';
import CardSkeleton from '@/components/CardSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  UserCheck, 
  FileCheck, 
  CreditCard, 
  Truck,
  AlertCircle,
  Clock,
  Activity
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { metrics, recentActions, alerts } = useDashboard();

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  // Format action type for display
  const formatActionType = (actionType: string) => {
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {user?.first_name || user?.email}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {metrics.isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              title="Total Users"
              value={metrics.data?.total_users ?? 0}
              icon={Users}
              trend={
                metrics.data?.trends?.total_users !== undefined
                  ? {
                      value: metrics.data.trends.total_users,
                      isPositive: true,
                    }
                  : undefined
              }
              description="from last period"
            />

            <MetricCard
              title="Active Users (30d)"
              value={metrics.data?.active_users_30d ?? 0}
              icon={UserCheck}
              trend={
                metrics.data?.trends?.active_users_30d !== undefined
                  ? {
                      value: metrics.data.trends.active_users_30d,
                      isPositive: true,
                    }
                  : undefined
              }
              description="from last period"
            />

            <MetricCard
              title="Pending KYC"
              value={metrics.data?.pending_kyc ?? 0}
              icon={FileCheck}
              trend={
                metrics.data?.trends?.pending_kyc !== undefined
                  ? {
                      value: metrics.data.trends.pending_kyc,
                      isPositive: false,
                    }
                  : undefined
              }
              description="awaiting review"
              onClick={() => navigate('/kyc')}
              className="cursor-pointer"
            />

            <MetricCard
              title="Pending Transactions"
              value={metrics.data?.pending_transactions ?? 0}
              icon={CreditCard}
              trend={
                metrics.data?.trends?.pending_transactions !== undefined
                  ? {
                      value: metrics.data.trends.pending_transactions,
                      isPositive: false,
                    }
                  : undefined
              }
              description="awaiting approval"
              onClick={() => navigate('/transactions')}
              className="cursor-pointer"
            />

            <MetricCard
              title="Active Deliveries"
              value={metrics.data?.active_deliveries ?? 0}
              icon={Truck}
              trend={
                metrics.data?.trends?.active_deliveries !== undefined
                  ? {
                      value: metrics.data.trends.active_deliveries,
                      isPositive: true,
                    }
                  : undefined
              }
              description="in progress"
              onClick={() => navigate('/deliveries')}
              className="cursor-pointer"
            />
          </>
        )}
      </div>

      {/* Transaction Volume */}
      {metrics.data?.total_transaction_volume_30d !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Transaction Volume (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(metrics.data.total_transaction_volume_30d)}
            </div>
            {metrics.data.trends?.total_transaction_volume_30d !== undefined && (
              <p className="text-sm text-muted-foreground mt-2">
                {metrics.data.trends.total_transaction_volume_30d > 0 ? '+' : ''}
                {metrics.data.trends.total_transaction_volume_30d}% from last period
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Alerts Section */}
      {alerts.data && alerts.data.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertCircle className="h-5 w-5" />
              Items Requiring Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.data.map((alert) => (
                <div
                  key={`${alert.type}-${alert.id}`}
                  className="flex items-start justify-between p-3 bg-white rounded-lg border border-orange-200 hover:border-orange-300 transition-colors cursor-pointer"
                  onClick={() => navigate(alert.link)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <h4 className="font-medium text-orange-900">{alert.title}</h4>
                    </div>
                    <p className="text-sm text-orange-700 mt-1">{alert.description}</p>
                  </div>
                  <div className="text-xs text-orange-600 font-medium whitespace-nowrap ml-4">
                    {alert.age_hours}h old
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Admin Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActions.isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          )}

          {recentActions.isError && (
            <div className="text-center py-8 text-red-600">
              Failed to load recent actions
            </div>
          )}

          {recentActions.data && recentActions.data.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No recent actions
            </div>
          )}

          {recentActions.data && recentActions.data.length > 0 && (
            <div className="space-y-3">
              {recentActions.data.map((action) => (
                <div
                  key={action.id}
                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {action.admin_user.first_name || action.admin_user.email}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        {formatActionType(action.action_type)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {action.target_model} #{action.target_id}
                      {action.details && Object.keys(action.details).length > 0 && (
                        <span className="ml-2">
                          {JSON.stringify(action.details).substring(0, 50)}
                          {JSON.stringify(action.details).length > 50 && '...'}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    {formatTimestamp(action.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {recentActions.data && recentActions.data.length > 0 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => navigate('/audit-log')}
                className="text-sm text-primary hover:underline"
              >
                View all audit logs →
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error State */}
      {metrics.isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-8">
            <div className="text-center text-red-600">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p className="font-medium">Failed to load dashboard metrics</p>
              <p className="text-sm mt-2">Please try refreshing the page</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
