import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  kycRejectSchema,
  transactionRejectSchema,
  transactionNoteSchema,
  userSuspendSchema,
  balanceAdjustmentSchema,
  deliveryStatusUpdateSchema,
  carrierAssignmentSchema,
  validateEmail,
  validateAmount,
} from './validationSchemas';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const result = loginSchema.safeParse({
        email: 'admin@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({
        email: 'admin@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('kycRejectSchema', () => {
    it('should validate correct rejection reason', () => {
      const result = kycRejectSchema.safeParse({
        reason: 'Documents are not clear enough to verify identity',
      });
      expect(result.success).toBe(true);
    });

    it('should reject reason shorter than 10 characters', () => {
      const result = kycRejectSchema.safeParse({
        reason: 'Too short',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('transactionNoteSchema', () => {
    it('should validate correct note', () => {
      const result = transactionNoteSchema.safeParse({
        note: 'This is a valid note',
      });
      expect(result.success).toBe(true);
    });

    it('should reject note shorter than 5 characters', () => {
      const result = transactionNoteSchema.safeParse({
        note: 'Hi',
      });
      expect(result.success).toBe(false);
    });

    it('should reject note longer than 500 characters', () => {
      const result = transactionNoteSchema.safeParse({
        note: 'a'.repeat(501),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('balanceAdjustmentSchema', () => {
    it('should validate positive amount', () => {
      const result = balanceAdjustmentSchema.safeParse({
        amount: '100.50',
        reason: 'Compensation for service issue',
      });
      expect(result.success).toBe(true);
    });

    it('should validate negative amount', () => {
      const result = balanceAdjustmentSchema.safeParse({
        amount: '-50.00',
        reason: 'Correction for overpayment',
      });
      expect(result.success).toBe(true);
    });

    it('should reject zero amount', () => {
      const result = balanceAdjustmentSchema.safeParse({
        amount: '0',
        reason: 'This should fail',
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-numeric amount', () => {
      const result = balanceAdjustmentSchema.safeParse({
        amount: 'not-a-number',
        reason: 'This should fail',
      });
      expect(result.success).toBe(false);
    });

    it('should reject amount exceeding limit', () => {
      const result = balanceAdjustmentSchema.safeParse({
        amount: '1000001',
        reason: 'This should fail',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short reason', () => {
      const result = balanceAdjustmentSchema.safeParse({
        amount: '100',
        reason: 'Short',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('deliveryStatusUpdateSchema', () => {
    it('should validate valid status', () => {
      const result = deliveryStatusUpdateSchema.safeParse({
        status: 'shipped',
      });
      expect(result.success).toBe(true);
    });

    it('should validate status with description', () => {
      const result = deliveryStatusUpdateSchema.safeParse({
        status: 'delivered',
        description: 'Package delivered successfully',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const result = deliveryStatusUpdateSchema.safeParse({
        status: 'invalid-status',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('carrierAssignmentSchema', () => {
    it('should validate correct carrier assignment', () => {
      const result = carrierAssignmentSchema.safeParse({
        carrier: 'FedEx',
        tracking_number: '1234567890',
      });
      expect(result.success).toBe(true);
    });

    it('should reject short carrier name', () => {
      const result = carrierAssignmentSchema.safeParse({
        carrier: 'A',
        tracking_number: '1234567890',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short tracking number', () => {
      const result = carrierAssignmentSchema.safeParse({
        carrier: 'FedEx',
        tracking_number: '123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Helper Functions', () => {
    describe('validateEmail', () => {
      it('should validate correct email', () => {
        expect(validateEmail('user@example.com')).toBe(true);
      });

      it('should reject invalid email', () => {
        expect(validateEmail('invalid-email')).toBe(false);
      });
    });

    describe('validateAmount', () => {
      it('should validate amount within range', () => {
        expect(validateAmount('100', 0, 1000)).toBe(true);
      });

      it('should reject amount below minimum', () => {
        expect(validateAmount('50', 100, 1000)).toBe(false);
      });

      it('should reject amount above maximum', () => {
        expect(validateAmount('1500', 0, 1000)).toBe(false);
      });

      it('should reject non-numeric amount', () => {
        expect(validateAmount('not-a-number')).toBe(false);
      });
    });
  });
});
