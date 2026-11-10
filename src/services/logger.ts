/**
 * CHILD PRIVACY NOTE (Rule 2, 3, 5, 6):
 * - Data used: Error messages, exception stack traces, and component error contexts.
 * - Purpose: Safely log runtime bugs without exposing child speech transcripts, child nicknames,
 *   audio/video binary blobs, or authentication tokens.
 * - Retention: Temporary console output / sanitized diagnostic logs only. Zero external tracker dispatch.
 */

// Regex patterns to detect and redact sensitive data before logging
const SCRUB_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // Authentication tokens, API keys, Bearer headers, JWTs
  { pattern: /bearer\s+[a-zA-Z0-9_\-\.]+/gi, replacement: 'bearer [REDACTED_TOKEN]' },
  { pattern: /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g, replacement: '[REDACTED_JWT]' },
  { pattern: /(api[_-]?key|secret|token|password|pin)([\s=:"]+)[^\s,;"}]+/gi, replacement: '$1$2[REDACTED_SECRET]' },

  // Base64 audio/video data URIs
  { pattern: /data:(?:audio|video)\/[a-zA-Z0-9]+;base64,[a-zA-Z0-9+/=]+/gi, replacement: '[REDACTED_MEDIA_BLOB]' },

  // Email addresses
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[REDACTED_EMAIL]' },

  // IPv4 Addresses (prohibited by Rule 1 & Privacy Policy)
  { pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, replacement: '[REDACTED_IP]' },

  // Potential transcript / speech content fields in JSON or strings
  { pattern: /"?(?:transcript|spokenText|speechContent|childVoiceText)"?\s*:\s*"[^"]*"/gi, replacement: '"transcript": "[REDACTED_TRANSCRIPT]"' },
];

/**
 * Redacts sensitive tokens, transcripts, media blobs, and personal information from string messages.
 */
export function scrubText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let scrubbed = text;
  for (const { pattern, replacement } of SCRUB_PATTERNS) {
    scrubbed = scrubbed.replace(pattern, replacement);
  }
  return scrubbed;
}

/**
 * Deeply sanitizes any error object, event, or metadata payload.
 */
export function scrubPayload(item: unknown, depth = 0): unknown {
  if (depth > 5) return '[NESTED_OBJECT_TRUNCATED]';
  if (item === null || item === undefined) return item;

  if (typeof item === 'string') {
    return scrubText(item);
  }

  if (item instanceof Error) {
    return {
      name: item.name,
      message: scrubText(item.message),
      stack: scrubText(item.stack || ''),
    };
  }

  if (Array.isArray(item)) {
    return item.map((element) => scrubPayload(element, depth + 1));
  }

  if (typeof item === 'object') {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(item as Record<string, unknown>)) {
      // Blacklist sensitive property keys completely
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('token') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('key') ||
        lowerKey.includes('password') ||
        lowerKey.includes('pin') ||
        lowerKey.includes('transcript') ||
        lowerKey.includes('audio') ||
        lowerKey.includes('video') ||
        lowerKey.includes('fullname')
      ) {
        sanitizedObj[key] = '[REDACTED_SENSITIVE_FIELD]';
      } else {
        sanitizedObj[key] = scrubPayload(value, depth + 1);
      }
    }
    return sanitizedObj;
  }

  return item;
}

/**
 * Privacy-safe logger adhering to SpeakUp Stars child data safety principles.
 */
export const privacyLogger = {
  info: (message: string, context?: unknown) => {
    console.info(`[SpeakUp INFO] ${scrubText(message)}`, context ? scrubPayload(context) : '');
  },

  warn: (message: string, context?: unknown) => {
    console.warn(`[SpeakUp WARN] ${scrubText(message)}`, context ? scrubPayload(context) : '');
  },

  error: (message: string, error?: unknown) => {
    console.error(`[SpeakUp ERROR] ${scrubText(message)}`, error ? scrubPayload(error) : '');
  },

  debug: (message: string, context?: unknown) => {
    if (import.meta.env.DEV) {
      console.debug(`[SpeakUp DEBUG] ${scrubText(message)}`, context ? scrubPayload(context) : '');
    }
  },
};

/**
 * Install global error handlers to automatically sanitize uncaught runtime errors.
 */
export function setupGlobalErrorLogging(): void {
  window.addEventListener('error', (event) => {
    privacyLogger.error('Uncaught Window Error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    privacyLogger.error('Unhandled Promise Rejection', {
      reason: event.reason,
    });
  });
}
