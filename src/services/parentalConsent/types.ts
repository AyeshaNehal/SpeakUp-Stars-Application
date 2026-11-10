/**
 * CHILD PRIVACY NOTE (Rule 1, Rule 5):
 * - Pluggable Verifiable Parental Consent (VPC) Interface
 * - Complies with COPPA & international child safety standards.
 * - Collects verifiable confirmation from the PARENT only.
 */

export type ConsentMethod = 'credit_card' | 'signed_econsent' | 'government_id' | 'mock_provider';

export interface VerificationRequest {
  parentId: string;
  parentEmail: string;
  method: ConsentMethod;
  details?: {
    cardLast4?: string;
    parentFullName?: string; // Only used ephemerally in transit for verification
    signatureData?: string;
  };
}

export interface VerificationResult {
  success: boolean;
  method: ConsentMethod;
  verificationReference: string;
  timestamp: string;
  message: string;
}

export interface ParentalConsentProvider {
  readonly id: string;
  readonly name: string;
  readonly method: ConsentMethod;
  readonly description: string;
  verifyConsent(request: VerificationRequest): Promise<VerificationResult>;
}
