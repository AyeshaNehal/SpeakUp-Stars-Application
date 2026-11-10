/**
 * CHILD PRIVACY NOTE (Rule 6):
 * - CSRF (Cross-Site Request Forgery) Protection Module
 * - Protects parent settings, consent modifications, and child data updates from unauthorized cross-site requests.
 */

const CSRF_STORAGE_KEY = 'speakup_csrf_token_v1';

export function getOrCreateCsrfToken(): string {
  try {
    let token = sessionStorage.getItem(CSRF_STORAGE_KEY);
    if (!token) {
      const array = new Uint8Array(24);
      window.crypto.getRandomValues(array);
      token = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
      sessionStorage.setItem(CSRF_STORAGE_KEY, token);
    }
    return token;
  } catch {
    // Fallback if sessionStorage is restricted
    return 'fallback_secure_csrf_token';
  }
}

export function validateCsrfToken(submittedToken: string): boolean {
  try {
    const currentToken = sessionStorage.getItem(CSRF_STORAGE_KEY);
    if (!currentToken || !submittedToken) return false;
    return currentToken === submittedToken;
  } catch {
    return false;
  }
}

export function getCsrfHeaders(): Record<string, string> {
  return {
    'X-CSRF-Token': getOrCreateCsrfToken(),
    'X-Requested-With': 'XMLHttpRequest',
  };
}
