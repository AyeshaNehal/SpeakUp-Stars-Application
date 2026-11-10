/**
 * CHILD PRIVACY NOTE (Rule 1, Rule 2, Rule 5):
 * - Parent Settings & Privacy Preferences Service
 * - Enforces parental controls:
 *   - "Turn off face analysis" (Voice-Only Mode)
 *   - Recording storage opt-in (Defaults to OFF)
 *   - Auto-deletion retention period (Defaults to 30 days)
 *   - Gentle Mode default
 * - Provides non-legalese explanations for families.
 */

import { assertNoBiometricPersistence } from '../security/biometricGuards';

export interface ParentSettings {
  faceAnalysisEnabled: boolean;
  storeRecordingsOptIn: boolean;
  emailSummariesOptIn: boolean;
  retentionDays: number; // 7, 14, 30, or 60 days
  transcriptRetentionMonths: number; // 3, 6, 12, or 24 months (default: 12)
  gentleModeDefault: boolean;
  dailyTimeLimitMinutes: number; // 0 = unlimited, 5, 10, 15, 20, 30
  disabledCategories: string[]; // e.g. ['Fantasy & Magic']
  lastExportDate: string | null;
  lastDeletionDate: string | null;
  lastDeletionDetails: string | null;
  updatedAt: string;
}

export const PARENT_EXPLANATION = {
  title: 'How Face & Expression Analysis Works',
  shortSummary:
    'Sparky gives encouraging feedback on smiles and eye contact. All processing happens in device memory and is never saved.',
  bulletPoints: [
    {
      title: 'Positive-Only Signals',
      text: 'We only look for cheerful smiles, head steadiness, and looking at the screen. A serious or neutral face is NEVER penalized.',
    },
    {
      title: 'Instant Frame Discard',
      text: 'Video frames are sampled at ~2 frames per second in your browser memory and immediately erased. No face photos or video frames are ever saved.',
    },
    {
      title: 'Zero Biometric Identification',
      text: 'We never create face models, 3D meshes, facial embeddings, or voiceprints. Nothing in SpeakUp Stars can recognize or identify your child.',
    },
    {
      title: 'Full Parental Control',
      text: 'You can turn off face analysis at any time below. The app will work seamlessly in Voice-Only Mode using only microphone audio.',
    },
  ],
};

class ParentSettingsService {
  private readonly SETTINGS_KEY = 'speakup_parent_settings_v1';
  private memorySettings: Map<string, ParentSettings> = new Map();

  private isStorageAvailable(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private defaultSettings: ParentSettings = {
    faceAnalysisEnabled: true,
    storeRecordingsOptIn: false, // DEFAULTS STRICTLY TO OFF
    emailSummariesOptIn: false,
    retentionDays: 30,
    transcriptRetentionMonths: 12,
    gentleModeDefault: false,
    dailyTimeLimitMinutes: 0, // 0 = Unlimited
    disabledCategories: [],
    lastExportDate: null,
    lastDeletionDate: null,
    lastDeletionDetails: null,
    updatedAt: new Date().toISOString(),
  };

  private getStorageKey(parentId?: string): string {
    return parentId ? `${this.SETTINGS_KEY}_${parentId}` : this.SETTINGS_KEY;
  }

  public hasCustomSettings(parentId?: string): boolean {
    const key = this.getStorageKey(parentId);
    if (this.isStorageAvailable()) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) return true;
      } catch {
        // ignore
      }
    }
    const memKey = parentId || 'default';
    return this.memorySettings.has(memKey);
  }

  public getSettings(parentId?: string): ParentSettings {
    const key = this.getStorageKey(parentId);
    if (this.isStorageAvailable()) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          return { ...this.defaultSettings, ...JSON.parse(raw) };
        }
      } catch {
        // Fall back to memory
      }
    }
    const memKey = parentId || 'default';
    const mem = this.memorySettings.get(memKey);
    return mem ? { ...this.defaultSettings, ...mem } : { ...this.defaultSettings };
  }

  public updateSettings(partial: Partial<ParentSettings>, parentId?: string): ParentSettings {
    const current = this.getSettings(parentId);
    const updated: ParentSettings = {
      ...current,
      ...partial,
      updatedAt: new Date().toISOString(),
    };

    // Strict security check: ensure no biometric data is smuggled in settings
    assertNoBiometricPersistence(updated);

    const memKey = parentId || 'default';
    this.memorySettings.set(memKey, updated);
    const key = this.getStorageKey(parentId);
    if (this.isStorageAvailable()) {
      try {
        localStorage.setItem(key, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
    return updated;
  }

  public isFaceAnalysisEnabled(): boolean {
    return this.getSettings().faceAnalysisEnabled;
  }

  public setFaceAnalysisEnabled(enabled: boolean): void {
    this.updateSettings({ faceAnalysisEnabled: enabled });
  }

  public recordExport(): void {
    this.updateSettings({ lastExportDate: new Date().toISOString() });
  }

  public recordDeletion(details: string): void {
    this.updateSettings({
      lastDeletionDate: new Date().toISOString(),
      lastDeletionDetails: details,
    });
  }

  public getExplanation() {
    return PARENT_EXPLANATION;
  }
}

export const parentSettingsService = new ParentSettingsService();
