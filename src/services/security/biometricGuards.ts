/**
 * CHILD PRIVACY NOTE (Rule 1, Rule 2, Rule 5):
 * - Biometric Privacy Safeguards & Anti-Persistence Runtime Guard
 * - STRICT POLICY:
 *   1. NEVER store face images, video frames, landmarks, 3D meshes, facial embeddings, or voiceprints.
 *   2. NEVER use visual or acoustic models for identification, recognition, or classification of children.
 *   3. Extract ONLY temporary scalar numbers (e.g. eyeContactRatio: 0.85, smileEnergy: 0.70).
 *   4. Discard all raw frames, landmarks, and coordinates immediately from device memory.
 */

export class BiometricStorageViolationError extends Error {
  constructor(message: string, public readonly detectedKey?: string) {
    super(`[BIOMETRIC SAFEGUARD VIOLATION]: ${message}`);
    this.name = 'BiometricStorageViolationError';
  }
}

// Prohibited biometric property names that must NEVER be written to storage or payloads
export const FORBIDDEN_BIOMETRIC_KEYS = [
  'landmarks',
  'facelandmarks',
  'facemesh',
  'embedding',
  'faceembedding',
  'facialembedding',
  'voiceprint',
  'faceframe',
  'rawimage',
  'rawframe',
  'imagedata',
  'facetensor',
  'meshcoordinates',
  'biometricdata',
];

/**
 * Function-level security guard.
 * Inspects any object before saving to localStorage, IndexedDB, or sending over network.
 * Throws BiometricStorageViolationError if any raw biometric or landmark data is found.
 */
export function assertNoBiometricPersistence(target: unknown, depth = 0): void {
  if (!target || typeof target !== 'object' || depth > 6) {
    return;
  }

  if (Array.isArray(target)) {
    // Check if this looks like a raw landmark array (e.g. [{x, y, z}, ...])
    if (
      target.length > 5 &&
      target[0] &&
      typeof target[0] === 'object' &&
      'x' in target[0] &&
      'y' in target[0]
    ) {
      throw new BiometricStorageViolationError(
        'Detected raw facial landmark coordinate array. Storing landmarks is strictly prohibited by PRIVACY_RULES.md.',
        'landmark_coordinates_array'
      );
    }

    for (const item of target) {
      assertNoBiometricPersistence(item, depth + 1);
    }
    return;
  }

  const record = target as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) {
    const lowerKey = key.toLowerCase().replace(/[^a-z]/g, '');

    // Check forbidden keys
    if (FORBIDDEN_BIOMETRIC_KEYS.some((forbidden) => lowerKey.includes(forbidden))) {
      throw new BiometricStorageViolationError(
        `Attempted to persist forbidden biometric key '${key}'. Raw frames, landmarks, and embeddings must be discarded immediately.`,
        key
      );
    }

    // Inspect nested values
    if (value && typeof value === 'object') {
      assertNoBiometricPersistence(value, depth + 1);
    }
  }
}

export interface CleanVisualMetrics {
  faceDetected: boolean;
  eyeContactRatio: number;   // 0.0 - 1.0 (positive-only)
  headSteadiness: number;    // 0.0 - 1.0 (positive-only)
  smileEnergy: number;       // 0.0 - 1.0 (positive-only)
  sampledFramesCount: number;
  faceAnalysisEnabled: boolean;
}

/**
 * Sanitizes visual analysis results, guaranteeing no coordinates, arrays,
 * or frames escape into the application state.
 */
export function sanitizeVisualMetrics(raw: {
  faceDetected?: boolean;
  eyeContactRatio?: number;
  headSteadiness?: number;
  smileEnergy?: number;
  sampledFramesCount?: number;
  faceAnalysisEnabled?: boolean;
  [key: string]: unknown;
}): CleanVisualMetrics {
  const sanitized: CleanVisualMetrics = {
    faceDetected: Boolean(raw.faceDetected),
    eyeContactRatio: Math.min(Math.max(Number(raw.eyeContactRatio) || 0, 0), 1),
    headSteadiness: Math.min(Math.max(Number(raw.headSteadiness) || 0, 0), 1),
    smileEnergy: Math.min(Math.max(Number(raw.smileEnergy) || 0, 0), 1),
    sampledFramesCount: Math.max(Number(raw.sampledFramesCount) || 0, 0),
    faceAnalysisEnabled: raw.faceAnalysisEnabled !== false,
  };

  // Run the runtime guard to guarantee no leaked biometric properties
  assertNoBiometricPersistence(sanitized);

  return sanitized;
}
