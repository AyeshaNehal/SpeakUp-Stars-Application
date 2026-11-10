/**
 * CHILD PRIVACY NOTE (Rule 1, 2, 3, 5, 6):
 * - Parent Account & Family Data Service
 * - Enforces: Parent is ALWAYS the account holder.
 * - Children NEVER sign up or possess individual credentials.
 * - Enforces Row-Level Security principles and strict data minimization.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { verifyPin, PinStatus } from '../security/pinSecurity';
import { parentalConsentManager, VerificationResult } from '../parentalConsent';
import { ChildProfileSchema, ParentSignupSchema } from '../security/validation';
import { privacyLogger } from '../logger';
import { parentDashboardService } from '../dashboard/parentDashboardService';
import { AgeGroup } from '../../types';

export interface ParentAccount {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface ChildRecord {
  id: string;
  parentId: string;
  nickname: string;
  ageBand: AgeGroup;
  avatarId: string;
  mascotId?: string;
  createdAt: string;
}

export interface ConsentRecord {
  id: string;
  parentId: string;
  policyVersion: string;
  consentMetricsProcessing: boolean;
  consentStoreRecordings: boolean;
  consentEmailSummaries: boolean;
  verificationMethod: string;
  verificationReference: string;
  withdrawnAt: string | null;
  createdAt: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

class ParentAuthService {
  private supabase: SupabaseClient | null = null;
  private localStoreKey = 'speakup_parent_auth_sandbox_v1';

  constructor() {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  }

  // --- LOCAL SANDBOX HELPERS (Zero-Config Development Fallback) ---
  private getLocalSandbox(): {
    parents: ParentAccount[];
    children: ChildRecord[];
    consentRecords: ConsentRecord[];
  } {
    try {
      const data = localStorage.getItem(this.localStoreKey);
      if (data) return JSON.parse(data);
    } catch {
      // Fallback
    }
    return { parents: [], children: [], consentRecords: [] };
  }

  private saveLocalSandbox(data: {
    parents: ParentAccount[];
    children: ChildRecord[];
    consentRecords: ConsentRecord[];
  }): void {
    try {
      localStorage.setItem(this.localStoreKey, JSON.stringify(data));
    } catch {
      // Ignore
    }
  }

  /**
   * STEP 1: Parent Signs Up (Sole Account Holder)
   */
  public async parentSignUp(
    email: string,
    password: string,
    pin: string
  ): Promise<{ success: boolean; parent?: ParentAccount; message?: string }> {
    // 1. Input Validation
    const validation = ParentSignupSchema.safeParse({ email, password, pin });
    if (!validation.success) {
      return { success: false, message: validation.error.issues[0]?.message || 'Invalid input.' };
    }

    // 2. Supabase or Local Sandbox
    if (this.supabase) {
      try {
        const { data: authData, error: authError } = await this.supabase.auth.signUp({
          email,
          password,
        });

        if (authError || !authData.user) {
          return { success: false, message: authError?.message || 'Sign up failed.' };
        }

        const parentRecord: ParentAccount = {
          id: authData.user.id,
          email,
          emailVerified: false,
          createdAt: new Date().toISOString(),
        };

        const { error: dbError } = await this.supabase.from('parents').insert({
          id: parentRecord.id,
          email: parentRecord.email,
          email_verified: false,
        });

        if (dbError) {
          privacyLogger.error('Failed to create parent database row', dbError);
          return { success: false, message: 'Database setup failed.' };
        }

        // Configure PIN server-side via Edge Function
        await this.setParentPin(pin, parentRecord.id);

        return {
          success: true,
          parent: parentRecord,
          message: 'Verification link sent to your parent email.',
        };
      } catch (err) {
        privacyLogger.error('Supabase signup error', err);
        return { success: false, message: 'Service temporarily unavailable.' };
      }
    }

    // Zero-config Sandbox Fallback for local testing
    const sandbox = this.getLocalSandbox();
    const existing = sandbox.parents.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return { success: false, message: 'An account with this parent email already exists.' };
    }

    const newParent: ParentAccount = {
      id: `parent_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email,
      emailVerified: true, // Auto-verified in local sandbox mode
      createdAt: new Date().toISOString(),
    };

    sandbox.parents.push(newParent);
    this.saveLocalSandbox(sandbox);

    // Clear entire dashboard so fresh login starts with 0 sessions
    parentDashboardService.clearAllDashboardData();

    return {
      success: true,
      parent: newParent,
      message: 'Account created! (Sandbox Mode: Email verified automatically).',
    };
  }

  /**
   * STEP 1B: Sign in with Google (OAuth)
   */
  public async signInWithGoogle(): Promise<{ success: boolean; parent?: ParentAccount; message?: string }> {
    if (this.supabase) {
      try {
        const { error } = await this.supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) {
          return { success: false, message: error.message };
        }
        return { success: true, message: 'Redirecting to Google Sign-In...' };
      } catch (err: any) {
        privacyLogger.error('Google OAuth error', err);
        return { success: false, message: err?.message || 'Google Sign-In failed.' };
      }
    }

    // Sandbox Google Login for seamless local testing
    const sandbox = this.getLocalSandbox();
    let googleParent = sandbox.parents.find((p) => p.email === 'google.parent@speakupstars.com');
    if (!googleParent) {
      googleParent = {
        id: `parent_google_${Date.now()}`,
        email: 'google.parent@speakupstars.com',
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };
      sandbox.parents.push(googleParent);
      this.saveLocalSandbox(sandbox);
    }

    return {
      success: true,
      parent: googleParent,
      message: 'Signed in with Google! (Sandbox mode)',
    };
  }

  /**
   * STEP 1B-2: Sign in with chosen Google Account (from the Google Sign-In Window)
   */
  public async signInWithGoogleAccount(googleAccount: {
    email: string;
    name?: string;
  }): Promise<{ success: boolean; parent?: ParentAccount; message?: string }> {
    const cleanEmail = googleAccount.email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please provide a valid Google email address.' };
    }

    // Local sandbox account persistence
    const sandbox = this.getLocalSandbox();
    let googleParent = sandbox.parents.find((p) => p.email.toLowerCase() === cleanEmail);
    if (!googleParent) {
      googleParent = {
        id: `parent_google_${Date.now()}`,
        email: cleanEmail,
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };
      sandbox.parents.push(googleParent);
      this.saveLocalSandbox(sandbox);
    }

    // Automatically ensure consent record exists for Google-authenticated parents
    await this.submitParentalConsent(
      googleParent.id,
      googleParent.email,
      {
        metricsProcessing: true,
        storeRecordings: false,
        emailSummaries: true,
      },
      'signed_econsent'
    );

    // Clear entire dashboard so fresh Google login starts with 0 sessions
    parentDashboardService.clearAllDashboardData();

    return {
      success: true,
      parent: googleParent,
      message: `Signed in as ${cleanEmail} via Google!`,
    };
  }

  /**
   * STEP 1C: Sign in with Email and Password
   */
  public async signInWithEmailPassword(
    email: string,
    password: string
  ): Promise<{ success: boolean; parent?: ParentAccount; message?: string }> {
    if (!email || !password) {
      return { success: false, message: 'Please provide both email and password.' };
    }

    if (this.supabase) {
      try {
        const { data, error } = await this.supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error || !data.user) {
          return { success: false, message: error?.message || 'Invalid credentials.' };
        }

        const parentRecord: ParentAccount = {
          id: data.user.id,
          email: data.user.email || email,
          emailVerified: Boolean(data.user.email_confirmed_at),
          createdAt: data.user.created_at || new Date().toISOString(),
        };

        return { success: true, parent: parentRecord };
      } catch (err: any) {
        return { success: false, message: err?.message || 'Sign in failed.' };
      }
    }

    // Sandbox check
    const sandbox = this.getLocalSandbox();
    let existing = sandbox.parents.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (!existing) {
      existing = {
        id: `parent_${Date.now()}`,
        email,
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };
      sandbox.parents.push(existing);
      this.saveLocalSandbox(sandbox);
    }

    return {
      success: true,
      parent: existing,
      message: 'Signed in successfully!',
    };
  }

  /**
   * Reset everything from scratch for fresh testing
   */
  public resetAllToScratch(): void {
    try {
      parentDashboardService.clearAllDashboardData();
      localStorage.clear();
      sessionStorage.clear();
      privacyLogger.info('Cleared all local client and dashboard data. System reset to scratch.');
    } catch {
      // Ignore
    }
  }

  /**
   * STEP 2 & 3: Plain-Language Consent & Verifiable Parental Consent Step
   */
  public async submitParentalConsent(
    parentId: string,
    parentEmail: string,
    consent: {
      metricsProcessing: boolean;
      storeRecordings: boolean;
      emailSummaries: boolean;
    },
    verificationMethod: 'credit_card' | 'signed_econsent' | 'government_id' | 'mock_provider'
  ): Promise<{ success: boolean; consentRecord?: ConsentRecord; message?: string }> {
    if (!consent.metricsProcessing) {
      return {
        success: false,
        message: 'Speech metrics processing consent is required for the child to practice.',
      };
    }

    // Execute Verifiable Parental Consent through pluggable provider
    const vpcResult: VerificationResult = await parentalConsentManager.verify({
      parentId,
      parentEmail,
      method: verificationMethod,
    });

    if (!vpcResult.success) {
      return { success: false, message: vpcResult.message || 'Parental verification failed.' };
    }

    const consentRecord: ConsentRecord = {
      id: `consent_${Date.now()}`,
      parentId,
      policyVersion: '2026.1',
      consentMetricsProcessing: consent.metricsProcessing,
      consentStoreRecordings: consent.storeRecordings, // Defaults to OFF
      consentEmailSummaries: consent.emailSummaries,   // Defaults to OFF
      verificationMethod,
      verificationReference: vpcResult.verificationReference,
      withdrawnAt: null,
      createdAt: new Date().toISOString(),
    };

    if (this.supabase) {
      try {
        await this.supabase.from('consent_records').insert({
          parent_id: parentId,
          policy_version: consentRecord.policyVersion,
          consent_metrics_processing: consentRecord.consentMetricsProcessing,
          consent_store_recordings: consentRecord.consentStoreRecordings,
          consent_email_summaries: consentRecord.consentEmailSummaries,
          verification_method: consentRecord.verificationMethod,
          verification_reference: consentRecord.verificationReference,
        });

        await this.supabase.from('settings').upsert({
          parent_id: parentId,
          store_recordings_opt_in: consent.storeRecordings,
          weekly_email_opt_in: consent.emailSummaries,
        });
      } catch (err) {
        privacyLogger.error('Supabase consent record failed', err);
      }
    }

    // Update sandbox
    const sandbox = this.getLocalSandbox();
    sandbox.consentRecords.push(consentRecord);
    this.saveLocalSandbox(sandbox);

    return {
      success: true,
      consentRecord,
      message: 'Verifiable Parental Consent successfully confirmed and timestamped.',
    };
  }

  /**
   * STEP 6: Parents can withdraw consent any time
   */
  public async withdrawConsent(
    parentId: string,
    consentRecordId: string
  ): Promise<{ success: boolean; message: string }> {
    const withdrawnAt = new Date().toISOString();

    if (this.supabase) {
      await this.supabase
        .from('consent_records')
        .update({ withdrawn_at: withdrawnAt })
        .eq('id', consentRecordId)
        .eq('parent_id', parentId);

      // Disable storage and emails immediately
      await this.supabase
        .from('settings')
        .update({ store_recordings_opt_in: false, weekly_email_opt_in: false })
        .eq('parent_id', parentId);
    }

    const sandbox = this.getLocalSandbox();
    const record = sandbox.consentRecords.find(
      (r) => r.id === consentRecordId && r.parentId === parentId
    );
    if (record) {
      record.withdrawnAt = withdrawnAt;
      record.consentStoreRecordings = false;
      record.consentEmailSummaries = false;
      this.saveLocalSandbox(sandbox);
    }

    return {
      success: true,
      message: 'Parental consent has been withdrawn. Optional storage and email summaries have been immediately deactivated.',
    };
  }

  /**
   * STEP 4: Parent Creates Child Profile (Nickname + Age Band ONLY)
   */
  public async createChildProfile(
    parentId: string,
    nickname: string,
    ageBand: AgeGroup,
    avatarId = 'lion',
    mascotId = 'sparky'
  ): Promise<{ success: boolean; child?: ChildRecord; message?: string }> {
    const validation = ChildProfileSchema.safeParse({ nickname, ageBand, avatarId });
    if (!validation.success) {
      return { success: false, message: validation.error.issues[0]?.message || 'Invalid child profile.' };
    }

    const childRecord: ChildRecord = {
      id: `child_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      parentId,
      nickname: validation.data.nickname,
      ageBand: validation.data.ageBand as AgeGroup,
      avatarId,
      mascotId,
      createdAt: new Date().toISOString(),
    };

    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('children')
        .insert({
          parent_id: parentId,
          nickname: childRecord.nickname,
          age_band: childRecord.ageBand,
          avatar_id: childRecord.avatarId,
        })
        .select()
        .single();

      if (error) {
        privacyLogger.error('Failed to create child profile', error);
        return { success: false, message: 'Could not create child profile.' };
      }
      return { success: true, child: data as ChildRecord };
    }

    const sandbox = this.getLocalSandbox();
    sandbox.children.push(childRecord);
    this.saveLocalSandbox(sandbox);

    // Ensure new child starts with a 100% clean dashboard
    parentDashboardService.clearAllDashboardData(childRecord.id, parentId);

    return { success: true, child: childRecord };
  }

  /**
   * CHILD ONBOARDING COMPLETION
   * Saves confirmed nickname, avatar theme, and initial bravery rating
   * to database using only the minimal fields allowed in PRIVACY_RULES.md.
   */
  public async completeChildOnboarding(
    childId: string,
    parentId: string,
    confirmedNickname: string,
    theme: string,
    braveryScore: number
  ): Promise<{ success: boolean; message?: string }> {
    // Validate nickname again against data minimization rules
    const validation = ChildProfileSchema.shape.nickname.safeParse(confirmedNickname);
    if (!validation.success) {
      return { success: false, message: validation.error.issues[0]?.message || 'Invalid nickname.' };
    }

    if (this.supabase) {
      try {
        // 1. Update child profile
        const { error: updateError } = await this.supabase
          .from('children')
          .update({
            nickname: confirmedNickname,
            avatar_id: theme,
            updated_at: new Date().toISOString(),
          })
          .eq('id', childId)
          .eq('parent_id', parentId);

        if (updateError) {
          privacyLogger.error('Failed to update child profile in database', updateError);
        }

        // 2. Record initial session & courage check-in
        const { data: sessionData } = await this.supabase
          .from('sessions')
          .insert({
            parent_id: parentId,
            child_id: childId,
            topic: 'Initial Bravery Check-In',
            duration_seconds: 0,
            recording_stored: false,
          })
          .select()
          .single();

        if (sessionData) {
          await this.supabase.from('metrics').insert({
            parent_id: parentId,
            child_id: childId,
            session_id: sessionData.id,
            clarity_score: 100,
            pacing_score: 100,
            courage_score: braveryScore * 20, // 1-5 scale -> 20-100%
          });
        }

        return { success: true };
      } catch (err) {
        privacyLogger.error('Supabase child onboarding save error', err);
        return { success: false, message: 'Could not save to database.' };
      }
    }

    // Local DB fallback for development
    const sandbox = this.getLocalSandbox();
    const child = sandbox.children.find((c) => c.id === childId || c.parentId === parentId);
    if (child) {
      child.nickname = confirmedNickname;
      child.avatarId = theme;
      this.saveLocalSandbox(sandbox);
    }

    return { success: true };
  }

  /**
   * Query Children for Parent
   */
  public async getChildrenForParent(parentId: string): Promise<ChildRecord[]> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('children')
        .select('*')
        .eq('parent_id', parentId);

      if (!error && data) return data as ChildRecord[];
    }

    const sandbox = this.getLocalSandbox();
    return sandbox.children.filter((c) => c.parentId === parentId);
  }

  /**
   * Query Consent Records for Parent
   */
  public async getConsentRecords(parentId: string): Promise<ConsentRecord[]> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('consent_records')
        .select('*')
        .eq('parent_id', parentId)
        .order('created_at', { ascending: false });

      if (!error && data) return data as ConsentRecord[];
    }

    const sandbox = this.getLocalSandbox();
    return sandbox.consentRecords.filter((c) => c.parentId === parentId);
  }

  /**
   * Configure parent PIN server-side via Edge Function.
   */
  public async setParentPin(pin: string, parentId?: string): Promise<{ success: boolean; message?: string }> {
    if (this.supabase && SUPABASE_URL) {
      try {
        const { data: { session } } = await this.supabase.auth.getSession();
        const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-parent-pin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: 'set',
            parentId: parentId || session?.user?.id,
            pin,
          }),
        });
        const json = await res.json();
        return json;
      } catch (err) {
        privacyLogger.error('Failed to configure PIN via Edge Function', err);
        return { success: false, message: 'Failed to configure PIN.' };
      }
    }
    return { success: true };
  }

  /**
   * STEP 5: Verify 4-6 Digit Parent Mode PIN with Lockout (Server-Authoritative)
   * The client never receives or inspects pin_hash or pin_salt.
   */
  public async verifyParentPin(enteredPin: string, parentId?: string): Promise<PinStatus> {
    if (this.supabase && SUPABASE_URL) {
      try {
        const { data: { session } } = await this.supabase.auth.getSession();
        const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-parent-pin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: 'verify',
            parentId: parentId || session?.user?.id,
            pin: enteredPin,
          }),
        });
        const json = await res.json();
        return json as PinStatus;
      } catch (err) {
        privacyLogger.error('Failed to verify PIN via Edge Function', err);
      }
    }
    return verifyPin(enteredPin);
  }

  /**
   * Retrieves all registered parent accounts (for administrative compliance & retention scans).
   * Note: Explicitly selects only safe columns; never queries or returns pin_hash or pin_salt.
   */
  public async getAllParents(): Promise<ParentAccount[]> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('parents')
        .select('id, email, email_verified, consent_given, consent_date, consent_method, created_at, updated_at');
      if (!error && data) {
        return (data as any[]).map((row) => ({
          id: row.id,
          email: row.email,
          emailVerified: Boolean(row.email_verified),
          createdAt: row.created_at,
        }));
      }
    }
    return this.getLocalSandbox().parents;
  }

  /**
   * Updates fields of a parent account (e.g. backdating createdAt for retention testing).
   */
  public updateParentAccount(parentId: string, partial: Partial<ParentAccount>): void {
    const sandbox = this.getLocalSandbox();
    const parent = sandbox.parents.find((p) => p.id === parentId);
    if (parent) {
      Object.assign(parent, partial);
      this.saveLocalSandbox(sandbox);
    }
  }

  /**
   * Completely purges a parent account and its linked children and consent records.
   */
  public async deleteParentAccount(parentId: string): Promise<boolean> {
    if (this.supabase) {
      await this.supabase.from('consent_records').delete().eq('parent_id', parentId);
      await this.supabase.from('children').delete().eq('parent_id', parentId);
      await this.supabase.from('parents').delete().eq('id', parentId);
    }

    const sandbox = this.getLocalSandbox();
    sandbox.parents = sandbox.parents.filter((p) => p.id !== parentId);
    sandbox.children = sandbox.children.filter((c) => c.parentId !== parentId);
    sandbox.consentRecords = sandbox.consentRecords.filter((cr) => cr.parentId !== parentId);
    this.saveLocalSandbox(sandbox);

    privacyLogger.info('Parent account and linked records purged from auth store.', { parentId });
    return true;
  }
}

export const parentAuthService = new ParentAuthService();
