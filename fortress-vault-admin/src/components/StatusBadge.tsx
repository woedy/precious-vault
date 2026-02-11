import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        // KYC statuses
        unverified: 'bg-gray-100 text-gray-800 border border-gray-300',
        pending: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
        verified: 'bg-green-100 text-green-800 border border-green-300',
        rejected: 'bg-red-100 text-red-800 border border-red-300',
        
        // Transaction statuses
        completed: 'bg-green-100 text-green-800 border border-green-300',
        failed: 'bg-red-100 text-red-800 border border-red-300',
        
        // Delivery statuses
        processing: 'bg-blue-100 text-blue-800 border border-blue-300',
        shipped: 'bg-purple-100 text-purple-800 border border-purple-300',
        delivered: 'bg-green-100 text-green-800 border border-green-300',
        cancelled: 'bg-gray-100 text-gray-800 border border-gray-300',
        
        // User account statuses
        active: 'bg-green-100 text-green-800 border border-green-300',
        suspended: 'bg-red-100 text-red-800 border border-red-300',
        
        // Generic statuses
        default: 'bg-gray-100 text-gray-800 border border-gray-300',
        success: 'bg-green-100 text-green-800 border border-green-300',
        warning: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
        error: 'bg-red-100 text-red-800 border border-red-300',
        info: 'bg-blue-100 text-blue-800 border border-blue-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  status?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  className,
  variant,
  status,
  children,
  ...props
}) => {
  // Auto-detect variant from status string if not explicitly provided
  const statusLower = status?.toLowerCase();
  const validVariants = [
    'unverified', 'pending', 'verified', 'rejected', 'completed', 'failed',
    'processing', 'shipped', 'delivered', 'cancelled', 'active', 'suspended',
    'default', 'success', 'warning', 'error', 'info'
  ];
  const autoVariant = variant || (statusLower && validVariants.includes(statusLower) ? statusLower : 'default');
  
  // Format the display text
  const displayText = children || (status ? formatStatus(status) : '');

  return (
    <div className={cn(badgeVariants({ variant: autoVariant as typeof variant }), className)} {...props}>
      {displayText}
    </div>
  );
};

// Helper function to format status strings
function formatStatus(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default StatusBadge;
