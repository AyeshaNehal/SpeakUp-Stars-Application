import React, { createContext, useContext, useState, useEffect } from 'react';
import { speechHelper } from '../services/speech/tts';
import { soundEffects } from '../services/sound/soundEffects';

export type TextSizeOption = 'normal' | 'large' | 'extra-large';
export type ColorBlindOption = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
export type SpeechSpeedOption = 0.75 | 1.0 | 1.25;

export interface AccessibilitySettings {
  dyslexiaFont: boolean;
  highContrast: boolean;
  colorBlindMode: ColorBlindOption;
  textSize: TextSizeOption;
  speechSpeed: SpeechSpeedOption;
  captions: boolean;
  reducedMotion: boolean;
  soundEffectsEnabled: boolean;
  backgroundMusicEnabled: boolean;
  calmMode: boolean;
}

interface AccessibilityContextType extends AccessibilitySettings {
  setDyslexiaFont: (val: boolean) => void;
  setHighContrast: (val: boolean) => void;
  setColorBlindMode: (val: ColorBlindOption) => void;
  setTextSize: (val: TextSizeOption) => void;
  setSpeechSpeed: (val: SpeechSpeedOption) => void;
  setCaptions: (val: boolean) => void;
  setReducedMotion: (val: boolean) => void;
  setSoundEffectsEnabled: (val: boolean) => void;
  setBackgroundMusicEnabled: (val: boolean) => void;
  setCalmMode: (val: boolean) => void;
  resetToDefaults: () => void;
}

const STORAGE_KEY = 'speakup_accessibility_v1';

const DEFAULT_SETTINGS: AccessibilitySettings = {
  dyslexiaFont: false,
  highContrast: false,
  colorBlindMode: 'none',
  textSize: 'normal',
  speechSpeed: 1.0,
  captions: true,
  reducedMotion: false,
  soundEffectsEnabled: true,
  backgroundMusicEnabled: true,
  calmMode: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      } catch {
        // Fallback
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Sync with document element attributes & audio services
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.setAttribute('data-dyslexia', String(settings.dyslexiaFont));
      root.setAttribute('data-high-contrast', String(settings.highContrast));
      root.setAttribute('data-color-blind', settings.colorBlindMode);
      root.setAttribute('data-text-size', settings.textSize);
      root.setAttribute('data-reduced-motion', String(settings.reducedMotion));
    }

    // Connect to speech synthesis speed
    speechHelper.setRate(settings.speechSpeed);

    // Connect to sound effects
    soundEffects.setSoundEnabled(settings.soundEffectsEnabled);
    soundEffects.setCalmMode(settings.calmMode);

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch {
        // ignore
      }
    }
  }, [settings]);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    val: AccessibilitySettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        ...settings,
        setDyslexiaFont: (v) => updateSetting('dyslexiaFont', v),
        setHighContrast: (v) => updateSetting('highContrast', v),
        setColorBlindMode: (v) => updateSetting('colorBlindMode', v),
        setTextSize: (v) => updateSetting('textSize', v),
        setSpeechSpeed: (v) => updateSetting('speechSpeed', v),
        setCaptions: (v) => updateSetting('captions', v),
        setReducedMotion: (v) => updateSetting('reducedMotion', v),
        setSoundEffectsEnabled: (v) => updateSetting('soundEffectsEnabled', v),
        setBackgroundMusicEnabled: (v) => updateSetting('backgroundMusicEnabled', v),
        setCalmMode: (v) => updateSetting('calmMode', v),
        resetToDefaults,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return ctx;
};
