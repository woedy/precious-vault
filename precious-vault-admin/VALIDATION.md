# Form Validation Documentation

## Overview

The admin frontend uses **Zod** for schema validation and **React Hook Form** for form state management. All validation schemas are centralized in `src/lib/validationSchemas.ts` for consistency and maintainability.

## Architecture

### Centralized Validation Schemas

All validation schemas are defined in a single file: `src/lib/validationSchemas.ts`

This approach provides:
- **Consistency**: All forms use the same validation rules
- **Maintainability**: Easy to update validation rules in one place
- **Type Safety**: TypeScript types are automatically inferred from schemas
- **Reusability**: Schemas can be composed and extended

### Integration with React Hook Form

Each form component uses the `zodResolver` to integrate Zod schemas with React Hook Form:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/lib/validationSchemas';

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
});
```

## Available Validation Schemas

### Authentication

#### `loginSchema`
- **email**: Valid email address (required)
- **password**: Non-empty string (required)

### KYC Management

#### `kycRejectSchema`
- **reason**: Minimum 10 characters (required)

#### `bulkKYCRejectSchema`
- **reason**: Minimum 10 characters (required)
- **userIds**: Array of 1-50 user IDs (required)

### Transaction Management

#### `transactionRejectSchema`
- **reason**: Minimum 10 characters (required)

#### `transactionNoteSchema`
- **note**: 5-500 characters (required)

### User Management

#### `userSuspendSchema`
- **reason**: Minimum 10 characters (required)

#### `balanceAdjustmentSchema`
- **amount**: Non-zero number, max ±$1,000,000 (required)
- **reason**: 10-200 characters (required)

### Delivery Management

#### `deliveryStatusUpdateSchema`
- **status**: One of: processing, shipped, in_transit, customs, out_for_delivery, delivered, failed (required)
- **description**: Max 500 characters (optional)

#### `carrierAssignmentSchema`
- **carrier**: 2-100 characters (required)
- **tracking_number**: 5-100 characters (required)

### Search and Filters

#### `userSearchSchema`
- **query**: 1-100 characters (required)

#### `transactionFilterSchema`
- **status**: Enum (optional)
- **type**: Enum (optional)
- **user**: String (optional)
- **dateFrom**: Date string (optional)
- **dateTo**: Date string (optional)
- **minAmount**: Valid number (optional)
- **maxAmount**: Valid number, must be >= minAmount (optional)

#### `deliveryFilterSchema`
- **status**: Enum (optional)
- **user**: String (optional)
- **carrier**: String (optional)
- **dateFrom**: Date string (optional)
- **dateTo**: Date string (optional)

#### `auditLogFilterSchema`
- **actionType**: String (optional)
- **adminUser**: String (optional)
- **targetObject**: String (optional)
- **dateFrom**: Date string (optional)
- **dateTo**: Date string (optional)

## Validation Helper Functions

### `validateDateRange(dateFrom?, dateTo?): boolean`
Validates that a date range is valid (from date is before to date).

### `validateAmount(amount, min?, max?): boolean`
Validates that an amount is within acceptable range.

### `validateEmail(email): boolean`
Validates email format using regex.

### `validateAlphanumeric(value): boolean`
Validates that a string contains only alphanumeric characters and common separators.

## Usage Examples

### Basic Form with Validation

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { kycRejectSchema, type KYCRejectFormData } from '@/lib/validationSchemas';

const MyComponent = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<KYCRejectFormData>({
    resolver: zodResolver(kycRejectSchema),
  });

  const onSubmit = (data: KYCRejectFormData) => {
    // Form data is validated and type-safe
    console.log(data.reason);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('reason')} />
      {errors.reason && (
        <p className="text-sm text-red-600">{errors.reason.message}</p>
      )}
      <button type="submit">Submit</button>
    </form>
  );
};
```

### Displaying Validation Errors

All forms follow a consistent pattern for displaying validation errors:

```typescript
{errors.fieldName && (
  <p className="text-sm text-red-600 mt-1">
    {errors.fieldName.message}
  </p>
)}
```

### Preventing Invalid Form Submission

React Hook Form automatically prevents form submission when validation fails. The `handleSubmit` function only calls your submit handler if all validations pass.

## Form Components Using Validation

### Pages
- `LoginPage.tsx` - Login form with email and password validation

### Modals
- `KYCDetailModal.tsx` - KYC rejection form
- `TransactionDetailModal.tsx` - Transaction rejection and note forms
- `UserDetailModal.tsx` - User suspension and balance adjustment forms
- `DeliveryDetailModal.tsx` - Delivery status update and carrier assignment forms

## Best Practices

1. **Always use centralized schemas**: Import from `validationSchemas.ts` instead of defining inline
2. **Display field-specific errors**: Show validation messages next to the relevant input field
3. **Use TypeScript types**: Infer form data types from schemas using `z.infer<typeof schema>`
4. **Disable submit during validation**: Use `formState.isSubmitting` to disable submit buttons
5. **Reset forms after success**: Call `reset()` to clear form state after successful submission
6. **Provide clear error messages**: Write user-friendly validation messages that explain what's wrong

## Validation Rules Matching Backend

All validation rules are designed to match backend requirements:

- **Minimum lengths**: Ensure sufficient detail in text fields (e.g., reasons must be at least 10 characters)
- **Maximum lengths**: Prevent database overflow and ensure reasonable input sizes
- **Numeric ranges**: Balance adjustments limited to ±$1,000,000
- **Enum values**: Status fields match backend enum definitions exactly
- **Required fields**: All critical fields are marked as required

## Testing Validation

Validation schemas can be tested independently:

```typescript
import { loginSchema } from '@/lib/validationSchemas';

const result = loginSchema.safeParse({
  email: 'test@example.com',
  password: 'password123',
});

if (result.success) {
  console.log('Valid data:', result.data);
} else {
  console.log('Validation errors:', result.error);
}
```

## Future Enhancements

Potential improvements to the validation system:

1. **Custom error messages per field**: More specific error messages based on field context
2. **Async validation**: Validate against backend (e.g., check if email exists)
3. **Cross-field validation**: Validate relationships between multiple fields
4. **Conditional validation**: Different rules based on form state
5. **Localization**: Support multiple languages for error messages
