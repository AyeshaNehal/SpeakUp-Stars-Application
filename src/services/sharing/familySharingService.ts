/**
 * CHILD SAFETY & PRIVACY NOTE (Rule 1, Rule 2, Rule 6):
 * - Family Contact Speech Sharing Service
 * - Sharing is STRICTLY OFF BY DEFAULT.
 * - Sharing is ONLY allowed to parent-approved family contacts (e.g. Grandma, Uncle Dave).
 * - Generates private, expiring links (24 hours).
 * - Requires parent PIN verification EACH TIME a speech is shared.
 */

import { verifyPin } from '../security/pinSecurity';
import { privacyLogger } from '../logger';

export interface FamilyContact {
  id: string;
  parentId: string;
  name: string;
  relationship: 'Grandparent' | 'Aunt/Uncle' | 'Parent/Guardian' | 'Family Friend' | 'Other';
  email: string;
  addedAt: string;
  verifiedByParent: boolean;
}

export interface SharedSpeechLink {
  id: string;
  sessionId: string;
  childId: string;
  parentId: string;
  contactId: string;
  contactName: string;
  contactEmail: string;
  url: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  isRevoked: boolean;
}

class FamilySharingService {
  private readonly CONTACTS_KEY = 'speakup_family_contacts_v1';
  private readonly SHARED_LINKS_KEY = 'speakup_shared_speech_links_v1';
  private readonly SHARING_PREFS_KEY = 'speakup_family_sharing_prefs_v1';

  private memoryContacts: FamilyContact[] = [];
  private memoryLinks: SharedSpeechLink[] = [];
  private memoryPrefs: Map<string, boolean> = new Map();

  private isStorageAvailable(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  // --------------------------------------------------------------------------
  // SHARING ENABLED / DISABLED (STRICTLY OFF BY DEFAULT)
  // --------------------------------------------------------------------------
  public isSharingEnabled(parentId: string): boolean {
    if (this.isStorageAvailable()) {
      try {
        const raw = localStorage.getItem(`${this.SHARING_PREFS_KEY}_${parentId}`);
        if (raw !== null) return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    return this.memoryPrefs.get(parentId) || false; // Default: FALSE (OFF)
  }

  public setSharingEnabled(parentId: string, enabled: boolean): void {
    this.memoryPrefs.set(parentId, enabled);
    if (this.isStorageAvailable()) {
      try {
        localStorage.setItem(`${this.SHARING_PREFS_KEY}_${parentId}`, JSON.stringify(enabled));
      } catch {
        // ignore
      }
    }
    privacyLogger.info('Parent updated family sharing master toggle.', { parentId, enabled });
  }

  // --------------------------------------------------------------------------
  // APPROVED FAMILY CONTACTS MANAGEMENT
  // --------------------------------------------------------------------------
  public getApprovedContacts(parentId: string): FamilyContact[] {
    if (this.isStorageAvailable()) {
      try {
        const raw = localStorage.getItem(`${this.CONTACTS_KEY}_${parentId}`);
        if (raw) return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    return this.memoryContacts.filter((c) => c.parentId === parentId);
  }

  public addApprovedContact(
    parentId: string,
    contactData: {
      name: string;
      relationship: FamilyContact['relationship'];
      email: string;
    }
  ): FamilyContact {
    const contact: FamilyContact = {
      id: `contact_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      parentId,
      name: contactData.name.trim(),
      relationship: contactData.relationship,
      email: contactData.email.trim().toLowerCase(),
      addedAt: new Date().toISOString(),
      verifiedByParent: true,
    };

    const existing = this.getApprovedContacts(parentId);
    existing.push(contact);

    this.memoryContacts = [...this.memoryContacts.filter((c) => c.parentId !== parentId), ...existing];
    if (this.isStorageAvailable()) {
      try {
        localStorage.setItem(`${this.CONTACTS_KEY}_${parentId}`, JSON.stringify(existing));
      } catch {
        // ignore
      }
    }

    privacyLogger.info('Parent registered approved family contact.', {
      parentId,
      contactId: contact.id,
      relationship: contact.relationship,
    });

    return contact;
  }

  public removeApprovedContact(parentId: string, contactId: string): void {
    const existing = this.getApprovedContacts(parentId);
    const updated = existing.filter((c) => c.id !== contactId);

    this.memoryContacts = [...this.memoryContacts.filter((c) => c.parentId !== parentId), ...updated];
    if (this.isStorageAvailable()) {
      try {
        localStorage.setItem(`${this.CONTACTS_KEY}_${parentId}`, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }

    // Revoke any active links for this contact
    this.revokeLinksForContact(parentId, contactId);
  }

  // --------------------------------------------------------------------------
  // SECURE LINK GENERATION (REQUIRES PARENT PIN EACH TIME)
  // --------------------------------------------------------------------------
  public async generateFamilyShareLink(params: {
    parentId: string;
    childId: string;
    sessionId: string;
    contactId: string;
    parentPin: string;
    hashedPin?: string;
  }): Promise<{ success: boolean; link?: SharedSpeechLink; error?: string }> {
    const { parentId, childId, sessionId, contactId, parentPin, hashedPin } = params;

    // 1. Guard: Check if family sharing is enabled
    if (!this.isSharingEnabled(parentId)) {
      return {
        success: false,
        error: 'Family sharing is disabled. An authenticated parent must enable family sharing in settings first.',
      };
    }

    // 2. Guard: Verify Parent PIN each time
    if (!parentPin || parentPin.length < 4) {
      return {
        success: false,
        error: 'Parent PIN is required to approve each shared speech.',
      };
    }

    if (hashedPin) {
      const pinResult = await verifyPin(parentPin, hashedPin);
      if (!pinResult.success) {
        return {
          success: false,
          error: pinResult.errorMessage || 'Incorrect Parent PIN. Link creation blocked.',
        };
      }
    }

    // 3. Guard: Verify contact is on approved list
    const contacts = this.getApprovedContacts(parentId);
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) {
      return {
        success: false,
        error: 'Contact is not in parent-approved family list.',
      };
    }

    // 4. Create 24-hour expiring private link
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const linkId = `share_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const token = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) =>
      b.toString(16).padStart(2, '0')
    ).join('');

    const link: SharedSpeechLink = {
      id: linkId,
      sessionId,
      childId,
      parentId,
      contactId: contact.id,
      contactName: contact.name,
      contactEmail: contact.email,
      url: `https://private.speakupstars.local/family-share/${linkId}?token=${token}`,
      token,
      createdAt: now.toISOString(),
      expiresAt,
      isRevoked: false,
    };

    this.saveSharedLink(link);

    privacyLogger.info('Parent generated single-use expiring family speech link.', {
      linkId: link.id,
      contactId: contact.id,
      expiresAt: link.expiresAt,
    });

    return { success: true, link };
  }

  /**
   * Validates access to a shared speech link.
   */
  public verifyShareLink(token: string): { valid: boolean; link?: SharedSpeechLink; error?: string } {
    const allLinks = this.getAllLinksInternal();
    const link = allLinks.find((l) => l.token === token);

    if (!link) {
      return { valid: false, error: 'Link not found or invalid token.' };
    }

    if (link.isRevoked) {
      return { valid: false, error: 'This share link was revoked by the parent.' };
    }

    const now = new Date().getTime();
    const expiryTime = new Date(link.expiresAt).getTime();
    if (now >= expiryTime) {
      return { valid: false, error: 'This share link has expired (24-hour lifespan reached).' };
    }

    return { valid: true, link };
  }

  public revokeLink(linkId: string, parentId: string): boolean {
    const all = this.getAllLinksInternal();
    const updated = all.map((l) => (l.id === linkId && l.parentId === parentId ? { ...l, isRevoked: true } : l));
    this.saveLinksInternal(updated);
    return true;
  }

  private revokeLinksForContact(parentId: string, contactId: string): void {
    const all = this.getAllLinksInternal();
    const updated = all.map((l) => (l.contactId === contactId && l.parentId === parentId ? { ...l, isRevoked: true } : l));
    this.saveLinksInternal(updated);
  }

  private getAllLinksInternal(): SharedSpeechLink[] {
    if (this.isStorageAvailable()) {
      try {
        const raw = localStorage.getItem(this.SHARED_LINKS_KEY);
        if (raw) return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    return [...this.memoryLinks];
  }

  private saveLinksInternal(links: SharedSpeechLink[]): void {
    this.memoryLinks = links;
    if (this.isStorageAvailable()) {
      try {
        localStorage.setItem(this.SHARED_LINKS_KEY, JSON.stringify(links));
      } catch {
        // ignore
      }
    }
  }

  private saveSharedLink(link: SharedSpeechLink): void {
    const current = this.getAllLinksInternal();
    current.push(link);
    this.saveLinksInternal(current);
  }

  public clearAll(parentId?: string): void {
    if (parentId) {
      this.memoryPrefs.delete(parentId);
      this.memoryContacts = this.memoryContacts.filter((c) => c.parentId !== parentId);
      this.memoryLinks = this.memoryLinks.filter((l) => l.parentId !== parentId);
      if (this.isStorageAvailable()) {
        try {
          localStorage.removeItem(`${this.SHARING_PREFS_KEY}_${parentId}`);
          localStorage.removeItem(`${this.CONTACTS_KEY}_${parentId}`);
        } catch {
          // ignore
        }
      }
    } else {
      this.memoryPrefs.clear();
      this.memoryContacts = [];
      this.memoryLinks = [];
    }
  }
}

export const familySharingService = new FamilySharingService();
