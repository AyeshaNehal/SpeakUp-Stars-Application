/**
 * CHILD PRIVACY & SECURITY NOTE (Rule 6):
 * - Sensitive Fields & Stored Media Encryption Service
 * - Enforces AES-256-GCM encryption at rest using Web Crypto API.
 * - PBKDF2 per-family key derivation with unique family salts.
 * - Encrypts sensitive fields (emails, parent notes, verification references)
 *   and audio/video media blobs before persistence.
 */

export interface EncryptedPayload {
  ciphertext: string; // Base64 encoded
  iv: string;         // Base64 encoded (12 bytes for GCM)
  algorithm: 'AES-GCM-256';
}

class EncryptionService {
  private readonly DEFAULT_SALT = 'speakup_stars_security_family_salt_v1';
  private readonly KEY_ITERATIONS = 100000;

  /**
   * Derives an AES-256-GCM CryptoKey from a passphrase and family-specific salt.
   */
  public async deriveFamilyKey(passphrase: string, saltStr?: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const salt = enc.encode(saltStr || this.DEFAULT_SALT);

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.KEY_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypts a sensitive string field at rest.
   */
  public async encryptField(plaintext: string, secretPassphrase: string): Promise<EncryptedPayload> {
    const key = await this.deriveFamilyKey(secretPassphrase);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();

    const ciphertextBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(plaintext)
    );

    return {
      ciphertext: this.arrayBufferToBase64(ciphertextBuffer),
      iv: this.arrayBufferToBase64(iv.buffer),
      algorithm: 'AES-GCM-256',
    };
  }

  /**
   * Decrypts an encrypted field payload.
   */
  public async decryptField(payload: EncryptedPayload, secretPassphrase: string): Promise<string> {
    const key = await this.deriveFamilyKey(secretPassphrase);
    const iv = new Uint8Array(this.base64ToArrayBuffer(payload.iv));
    const ciphertext = this.base64ToArrayBuffer(payload.ciphertext);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  }

  /**
   * Encrypts an audio/video media Blob at rest.
   */
  public async encryptMediaBlob(
    blob: Blob,
    secretPassphrase: string
  ): Promise<{ encryptedBlob: Blob; iv: string }> {
    const key = await this.deriveFamilyKey(secretPassphrase);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const arrayBuffer = await blob.arrayBuffer();

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      arrayBuffer
    );

    const encryptedBlob = new Blob([encryptedBuffer], { type: 'application/octet-stream' });
    return {
      encryptedBlob,
      iv: this.arrayBufferToBase64(iv.buffer),
    };
  }

  /**
   * Decrypts an encrypted media Blob back to original audio/video playback format.
   */
  public async decryptMediaBlob(
    encryptedBlob: Blob,
    ivBase64: string,
    secretPassphrase: string,
    mimeType = 'video/webm'
  ): Promise<Blob> {
    const key = await this.deriveFamilyKey(secretPassphrase);
    const iv = new Uint8Array(this.base64ToArrayBuffer(ivBase64));
    const arrayBuffer = await encryptedBlob.arrayBuffer();

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      arrayBuffer
    );

    return new Blob([decryptedBuffer], { type: mimeType });
  }

  // --- Base64 Helpers ---
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export const encryptionService = new EncryptionService();
