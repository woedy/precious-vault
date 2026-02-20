import { z } from 'zod';

/**
 * Centralized validation schemas for all admin forms
 * These schemas define validation rules matching backend requirements
 */

// ============================================================================
// Authentication Schemas
// ============================================================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ============================================================================
// KYC Management Schemas
// ============================================================================

export const kycRejectSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

export type KYCRejectFormData = z.infer<typeof kycRejectSchema>;

export const bulkKYCRejectSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  userIds: z.array(z.number()).min(1, 'At least one user must be selected').max(50, 'Maximum 50 users can be processed at once'),
});

export type BulkKYCRejectFormData = z.infer<typeof bulkKYCRejectSchema>;

// ============================================================================
// Transaction Management Schemas
// ============================================================================

export const transactionRejectSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

export type TransactionRejectFormData = z.infer<typeof transactionRejectSchema>;

export const transactionNoteSchema = z.object({
  note: z.string().min(5, 'Note must be at least 5 characters').max(500, 'Note must not exceed 500 characters'),
});

export type TransactionNoteFormData = z.infer<typeof transactionNoteSchema>;

// ============================================================================
// User Management Schemas
// ============================================================================

export const userSuspendSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

export type UserSuspendFormData = z.infer<typeof userSuspendSchema>;

export const balanceAdjustmentSchema = z.object({
  amount: z.string()
    .refine((val) => !isNaN(parseFloat(val)), {
      message: 'Amount must be a valid number',
    })
    .refine((val) => parseFloat(val) !== 0, {
      message: 'Amount must be a non-zero number',
    })
    .refine((val) => Math.abs(parseFloat(val)) <= 1000000, {
      message: 'Amount must not exceed $1,000,000',
    }),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(200, 'Reason must not exceed 200 characters'),
});

export type BalanceAdjustmentFormData = z.infer<typeof balanceAdjustmentSchema>;

// ============================================================================
// Delivery Management Schemas
// ============================================================================

export const deliveryStatusUpdateSchema = z.object({
  status: z.enum(['requested', 'preparing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'failed']),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional(),
});

export type DeliveryStatusUpdateFormData = z.infer<typeof deliveryStatusUpdateSchema>;

export const carrierAssignmentSchema = z.object({
  carrier: z.string().min(2, 'Carrier name must be at least 2 characters').max(100, 'Carrier name must not exceed 100 characters'),
  tracking_number: z.string().min(5, 'Tracking number must be at least 5 characters').max(100, 'Tracking number must not exceed 100 characters'),
});

export type CarrierAssignmentFormData = z.infer<typeof carrierAssignmentSchema>;

// ============================================================================
// Search and Filter Schemas
// ============================================================================

export const userSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Search query must not exceed 100 characters'),
});

export type UserSearchFormData = z.infer<typeof userSearchSchema>;

export const transactionFilterSchema = z.object({
  status: z.enum(['pending', 'completed', 'failed', 'all']).optional(),
  type: z.enum(['buy', 'sell', 'convert', 'all']).optional(),
  user: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minAmount: z.string()
    .refine((val) => !val || !isNaN(parseFloat(val)), {
      message: 'Minimum amount must be a valid number',
    })
    .optional(),
  maxAmount: z.string()
    .refine((val) => !val || !isNaN(parseFloat(val)), {
      message: 'Maximum amount must be a valid number',
    })
    .optional(),
}).refine((data) => {
  if (data.minAmount && data.maxAmount) {
    return parseFloat(data.minAmount) <= parseFloat(data.maxAmount);
  }
  return true;
}, {
  message: 'Minimum amount must be less than or equal to maximum amount',
  path: ['minAmount'],
});

export type TransactionFilterFormData = z.infer<typeof transactionFilterSchema>;

export const deliveryFilterSchema = z.object({
  status: z.enum(['requested', 'preparing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'all']).optional(),
  user: z.string().optional(),
  carrier: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type DeliveryFilterFormData = z.infer<typeof deliveryFilterSchema>;

export const auditLogFilterSchema = z.object({
  actionType: z.string().optional(),
  adminUser: z.string().optional(),
  targetObject: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type AuditLogFilterFormData = z.infer<typeof auditLogFilterSchema>;

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validates that a date range is valid (from date is before to date)
 */
export const validateDateRange = (dateFrom?: string, dateTo?: string): boolean => {
  if (!dateFrom || !dateTo) return true;
  return new Date(dateFrom) <= new Date(dateTo);
};

/**
 * Validates that an amount is within acceptable range
 */
export const validateAmount = (amount: string, min?: number, max?: number): boolean => {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return false;
  if (min !== undefined && numAmount < min) return false;
  if (max !== undefined && numAmount > max) return false;
  return true;
};

/**
 * Validates email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates that a string contains only alphanumeric characters and common separators
 */
export const validateAlphanumeric = (value: string): boolean => {
  const alphanumericRegex = /^[a-zA-Z0-9\s\-_]+$/;
  return alphanumericRegex.test(value);
};
