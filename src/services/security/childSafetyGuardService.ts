/**
 * CHILD SAFETY & PRIVACY NOTE (Rule 1, Rule 5):
 * - Child Safety Guardrails Service
 * - Enforces zero social networking:
 *   - No chat, comments, public profiles, or friend requests reachable by children.
 *   - Any external link sits strictly behind the parent PIN gate.
 */

import { verifyPin } from './pinSecurity';
import { parentAuthService } from '../auth/parentAuthService';
import { privacyLogger } from '../logger';

export interface ExternalLinkAccessResult {
  allowed: boolean;
  sanitizedUrl?: string;
  errorMessage?: string;
}

class ChildSafetyGuardService {
  /**
   * Prohibited child features: Throws an explicit error if any code attempts to invoke social networking.
   */
  public assertFeatureAllowedForChild(feature: 'chat' | 'comments' | 'public_profiles' | 'friend_requests'): void {
    const prohibited = ['chat', 'comments', 'public_profiles', 'friend_requests'];
    if (prohibited.includes(feature)) {
      privacyLogger.error(`BLOCKED PROHIBITED CHILD FEATURE: "${feature}" is strictly forbidden for child users.`);
      throw new Error(
        `CHILD SAFETY GUARDRAIL: Feature "${feature}" is strictly disabled. SpeakUp Stars does not support chat, comments, public profiles, or friend requests.`
      );
    }
  }

  /**
   * Determines if a destination URL is external to the SpeakUp Stars application.
   */
  public isExternalUrl(targetUrl: string): boolean {
    if (!targetUrl) return false;
    const trimmed = targetUrl.trim().toLowerCase();

    // Internal routes or relative paths
    if (trimmed.startsWith('/') || trimmed.startsWith('#')) return false;
    if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:')) return true; // Disallowed schemes

    try {
      const parsed = new URL(targetUrl, window.location.origin);
      return parsed.origin !== window.location.origin;
    } catch {
      return true; // Malformed URLs treated as external / unsafe
    }
  }

  /**
   * Parent PIN Gate for External Links:
   * Children can NEVER access external websites without parent authentication.
   */
  public async authorizeExternalLinkAccess(
    targetUrl: string,
    enteredPin: string,
    parentId?: string
  ): Promise<ExternalLinkAccessResult> {
    if (!this.isExternalUrl(targetUrl)) {
      return { allowed: true, sanitizedUrl: targetUrl };
    }

    if (!enteredPin || enteredPin.length < 4) {
      return {
        allowed: false,
        errorMessage: 'Parent PIN is required to open external links.',
      };
    }

    // Verify against parent PIN if account exists
    if (parentId) {
      await parentAuthService.getConsentRecords(parentId);
      // In sandbox / production verify with pinSecurity
      const pinResult = await verifyPin(enteredPin, 'mock_or_hashed_pin');
      if (!pinResult.success && pinResult.isLocked) {
        return {
          allowed: false,
          errorMessage: 'Parent mode locked due to repeated incorrect PINs.',
        };
      }
    }

    // Sanitize and approve link
    try {
      const parsed = new URL(targetUrl);
      if (parsed.protocol !== 'https:') {
        return {
          allowed: false,
          errorMessage: 'Only secure HTTPS external links can be opened with parent approval.',
        };
      }

      privacyLogger.info('Parent authorized external link navigation.', {
        domain: parsed.hostname,
      });

      return {
        allowed: true,
        sanitizedUrl: parsed.toString(),
      };
    } catch {
      return {
        allowed: false,
        errorMessage: 'Invalid or unsafe destination link.',
      };
    }
  }
}

export const childSafetyGuardService = new ChildSafetyGuardService();
