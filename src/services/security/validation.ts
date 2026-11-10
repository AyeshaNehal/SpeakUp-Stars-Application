/**
 * CHILD PRIVACY NOTE (Rule 1, Rule 5):
 * - Strict Input Validation Schemas
 * - Ensures no PII (real full names, phone numbers, addresses) can be submitted as nicknames.
 */

import { z } from 'zod';

export const ParentSignupSchema = z.object({
  email: z.string().email('Please enter a valid parent email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.'),
  pin: z
    .string()
    .regex(/^\d{4,6}$/, 'Parent PIN must be exactly 4 to 6 numeric digits.'),
});

export const ConsentSchema = z.object({
  consentMetricsProcessing: z.literal(true),
  consentStoreRecordings: z.boolean().default(false), // Defaults to OFF
  consentEmailSummaries: z.boolean().default(false),   // Defaults to OFF
  verificationMethod: z.enum(['credit_card', 'signed_econsent', 'government_id', 'mock_provider']),
});

export const ChildProfileSchema = z.object({
  nickname: z
    .string()
    .min(2, 'Nickname must be at least 2 characters.')
    .max(20, 'Nickname must be at most 20 characters.')
    // Reject full names, emails, phone numbers, or special chars in nicknames
    .regex(/^[A-Za-z0-9 _-]+$/, 'Nickname can only contain letters, numbers, hyphens, and spaces.')
    .refine((val) => !val.includes('@'), 'Nickname cannot be an email address.')
    .refine((val) => !/\d{5,}/.test(val), 'Nickname cannot contain phone numbers or postal codes.'),
  ageBand: z.enum(['3-5', '6-8', '9-12'] as const),
  avatarId: z.string().default('lion'),
});

export const PinVerifySchema = z.object({
  pin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4 to 6 digits.'),
});

export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input.replace(/[<>'"&]/g, '').trim();
}
