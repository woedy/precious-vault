import React, { useState } from 'react';
import { useUserManagement } from '@/hooks/useUserManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StatusBadge from '@/components/StatusBadge';
import { 
  X, 
  User as UserIcon, 
  Mail, 
  Calendar, 
  Wallet, 
  Activity,
  Ban,
  CheckCircle,
  DollarSign,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  userSuspendSchema, 
  balanceAdjustmentSchema,
  type UserSuspendFormData,
  type BalanceAdjustmentFormData
} from '@/lib/validationSchemas';

interface UserDetailModalProps {
  userId: number;
  onClose: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ userId, onClose }) => {
  const { 
    useUserDetails, 
    useUserActivity, 
    suspendUser, 
    activateUser, 
    adjustBalance 
  } = useUserManagement();
  
  const userDetails = useUserDetails(userId);
  const userActivity = useUserActivity(userId);
  
  const [showSuspendForm, setShowSuspendForm] = useState(false);
  const [showBalanceForm, setShowBalanceForm] = useState(false);

  const suspendForm = useForm<UserSuspendFormData>({
    resolver: zodResolver(userSuspendSchema),
  });

  const balanceForm = useForm<BalanceAdjustmentFormData>({
    resolver: zodResolver(balanceAdjustmentSchema),
  });

  const handleSuspend = async (data: UserSuspendFormData) => {
    if (!window.confirm('Are you sure you want to suspend this user account?')) {
      return;
    }

    try {
      await suspendUser.mutateAsync({ userId, reason: data.reason });
      suspendForm.reset();
      setShowSuspendForm(false);
    } catch (error) {
      console.error('Failed to suspend user:', error);
      alert('Failed to suspend user. Please try again.');
    }
  };

  const handleActivate = async () => {
    if (!window.confirm('Are you sure you want to activate this user account?')) {
      return;
    }

    try {
      await activateUser.mutateAsync({ userId });
    } catch (error) {
      console.error('Failed to activate user:', error);
      alert('Failed to activate user. Please try again.');
    }
  };

  const handleBalanceAdjustment = async (data: BalanceAdjustmentFormData) => {
    const amount = parseFloat(data.amount);
    const confirmMessage = amount > 0
      ? `Are you sure you want to add $${Math.abs(amount).toFixed(2)} to this user's balance?`
      : `Are you sure you want to deduct $${Math.abs(amount).toFixed(2)} from this user's balance?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await adjustBalance.mutateAsync({ 
        userId, 
        amount, 
        reason: data.reason 
      });
      balanceForm.reset();
      setShowBalanceForm(false);
    } catch (error) {
      console.error('Failed to adjust balance:', error);
      alert('Failed to adjust balance. Please try again.');
    }
  };

  // Helper function to mask sensitive data
  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return email;
    return `${local.substring(0, 2)}${'*'.repeat(local.length - 2)}@${domain}`;
  };

  if (userDetails.isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!userDetails.data) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-5xl w-full mx-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Failed to load user details</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  }

  const user = userDetails.data;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">User Details</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Complete user information and account management
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">User Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <UserIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-muted-foreground">
                    {user.first_name} {user.last_name}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Email (Masked)</p>
                  <p className="text-sm text-muted-foreground">{maskEmail(user.email)}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Join Date</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Last Login</p>
                  <p className="text-sm text-muted-foreground">
                    {user.last_login
                      ? new Date(user.last_login).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Never'}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">KYC Status</p>
                  <StatusBadge status={user.kyc_status} />
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Account Status</p>
                  <StatusBadge status={user.is_active ? 'active' : 'suspended'} />
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Balance */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Wallet Balance</h3>
              {!showBalanceForm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBalanceForm(true)}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Adjust Balance
                </Button>
              )}
            </div>
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center space-x-3">
                <Wallet className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-3xl font-bold">
                    ${parseFloat(user.wallet_balance).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Balance Adjustment Form */}
            {showBalanceForm && (
              <form
                onSubmit={balanceForm.handleSubmit(handleBalanceAdjustment)}
                className="rounded-lg border bg-muted/50 p-4 space-y-4"
              >
                <div>
                  <Label htmlFor="amount">
                    Amount (use negative for deduction) *
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 100.00 or -50.00"
                    {...balanceForm.register('amount')}
                    className="mt-1"
                  />
                  {balanceForm.formState.errors.amount && (
                    <p className="text-sm text-red-600 mt-1">
                      {balanceForm.formState.errors.amount.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="balance-reason">Reason *</Label>
                  <Input
                    id="balance-reason"
                    {...balanceForm.register('reason')}
                    placeholder="Enter reason for balance adjustment"
                    className="mt-1"
                  />
                  {balanceForm.formState.errors.reason && (
                    <p className="text-sm text-red-600 mt-1">
                      {balanceForm.formState.errors.reason.message}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowBalanceForm(false);
                      balanceForm.reset();
                    }}
                    disabled={adjustBalance.isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={adjustBalance.isPending}>
                    {adjustBalance.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adjusting...
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Confirm Adjustment
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Portfolio Holdings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Portfolio Holdings</h3>
            {user.portfolio && user.portfolio.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.portfolio.map((item, index) => (
                  <div key={index} className="rounded-lg border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.metal_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {parseFloat(item.quantity).toFixed(4)} oz
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ${parseFloat(item.current_value).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">Current Value</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                No portfolio holdings
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
            {user.recent_transactions && user.recent_transactions.length > 0 ? (
              <div className="space-y-3">
                {user.recent_transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="border rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      <TrendingUp className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium capitalize">
                          {tx.transaction_type} {tx.metal_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {parseFloat(tx.quantity).toFixed(4)} oz
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ${parseFloat(tx.total_amount).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <div className="flex items-center space-x-2">
                        <StatusBadge status={tx.status} />
                        <span className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                No recent transactions
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Activity Timeline</h3>
            {userActivity.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : userActivity.data && userActivity.data.length > 0 ? (
              <div className="space-y-3">
                {userActivity.data.map((activity) => (
                  <div
                    key={activity.id}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">
                        {activity.event_type.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                No activity recorded
              </div>
            )}
          </div>

          {/* Account Management Actions */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold">Account Management</h3>
            
            {user.is_active ? (
              <>
                {!showSuspendForm ? (
                  <Button
                    variant="destructive"
                    onClick={() => setShowSuspendForm(true)}
                    disabled={suspendUser.isPending}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Suspend Account
                  </Button>
                ) : (
                  <form
                    onSubmit={suspendForm.handleSubmit(handleSuspend)}
                    className="rounded-lg border bg-muted/50 p-4 space-y-4"
                  >
                    <div>
                      <Label htmlFor="suspend-reason">Suspension Reason *</Label>
                      <Input
                        id="suspend-reason"
                        {...suspendForm.register('reason')}
                        placeholder="Enter reason for suspension (minimum 10 characters)"
                        className="mt-1"
                      />
                      {suspendForm.formState.errors.reason && (
                        <p className="text-sm text-red-600 mt-1">
                          {suspendForm.formState.errors.reason.message}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-end space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowSuspendForm(false);
                          suspendForm.reset();
                        }}
                        disabled={suspendUser.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="destructive"
                        disabled={suspendUser.isPending}
                      >
                        {suspendUser.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Suspending...
                          </>
                        ) : (
                          <>
                            <Ban className="h-4 w-4 mr-2" />
                            Confirm Suspension
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </>
            ) : (
              <Button
                variant="default"
                onClick={handleActivate}
                disabled={activateUser.isPending}
              >
                {activateUser.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Activating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Activate Account
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
