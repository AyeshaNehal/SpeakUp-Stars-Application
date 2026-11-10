/**
 * CHILD PRIVACY NOTE (Rule 2, Rule 3, Rule 5):
 * - On-Device Text-to-Speech (Read Aloud) Helper
 * - Uses native browser Web Speech API (window.speechSynthesis).
 * - Runs 100% on-device. Zero network requests, zero third-party voice SDKs, zero telemetry.
 */

class SpeechHelper {
  private isSpeaking = false;
  private speechRate = 0.95;

  public setRate(rate: number): void {
    if (rate >= 0.5 && rate <= 2.0) {
      this.speechRate = rate;
    }
  }

  public getRate(): number {
    return this.speechRate;
  }

  public speak(text: string, onEnd?: () => void): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any currently playing audio

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = this.speechRate; // User-configured rate (0.75x, 1x, 1.25x)
      utterance.pitch = 1.15; // Cheerful, friendly tone

      // Try to find a friendly English voice if available
      const voices = window.speechSynthesis.getVoices();
      const friendlyVoice = voices.find(
        (v) => (v.lang.startsWith('en') && v.name.toLowerCase().includes('natural')) ||
               (v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
      );
      if (friendlyVoice) {
        utterance.voice = friendlyVoice;
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    }
  }

  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
    }
  }

  public getSpeakingState(): boolean {
    return this.isSpeaking || (typeof window !== 'undefined' && 'speechSynthesis' in window
      ? window.speechSynthesis.speaking
      : false);
  }
}

export const speechHelper = new SpeechHelper();
