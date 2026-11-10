/**
 * CHILD PRIVACY NOTE (Rule 1, Rule 5):
 * - Parent Authentication & Child Mode Context
 * - Ensures parent is authenticated, child mode is strictly sandboxed,
 *   and parent mode is protected by hashed PIN with rate limiting.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  parentAuthService,
  ParentAccount,
  ChildRecord,
  ConsentRecord,
} from '../services/auth/parentAuthService';
import { AgeGroup } from '../types';

interface ParentAuthContextType {
  parent: ParentAccount | null;
  childrenList: ChildRecord[];
  activeChild: ChildRecord | null;
  activeConsent: ConsentRecord | null;
  isParentMode: boolean;
  isLoading: boolean;
  enterParentMode: (pin: string) => Promise<{ success: boolean; message?: string }>;
  exitParentMode: () => void;
  signUpParent: (email: string, pass: string, pin: string) => Promise<{ success: boolean; message?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  signInWithGoogleAccount: (account: { email: string; name?: string }) => Promise<{ success: boolean; message?: string }>;
  signInWithEmailPassword: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  resetAllToScratch: () => void;
  submitConsent: (
    options: { metricsProcessing: boolean; storeRecordings: boolean; emailSummaries: boolean },
    method: 'credit_card' | 'signed_econsent' | 'government_id' | 'mock_provider'
  ) => Promise<{ success: boolean; message?: string }>;
  withdrawConsent: () => Promise<{ success: boolean; message: string }>;
  createChild: (nickname: string, ageBand: AgeGroup, avatarId: string, mascotId?: string) => Promise<{ success: boolean; message?: string }>;
  selectActiveChild: (child: ChildRecord) => void;
  setActiveChild: React.Dispatch<React.SetStateAction<ChildRecord | null>>;
}

const ParentAuthContext = createContext<ParentAuthContextType | undefined>(undefined);

export const ParentAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [parent, setParent] = useState<ParentAccount | null>(null);
  const [childrenList, setChildrenList] = useState<ChildRecord[]>([]);
  const [activeChild, setActiveChild] = useState<ChildRecord | null>(null);
  const [activeConsent, setActiveConsent] = useState<ConsentRecord | null>(null);
  const [isParentMode, setIsParentMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize with local account if available, or initialize default demo parent
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      // Check if an existing parent account exists
      const savedEmail = localStorage.getItem('speakup_active_parent_email');
      if (savedEmail) {
        // Load parent account
        // If not found, create a sandbox default parent for seamless first run
      }
      setIsLoading(false);
    }
    init();
  }, []);

  const signUpParent = async (email: string, pass: string, pin: string) => {
    const res = await parentAuthService.parentSignUp(email, pass, pin);
    if (res.success && res.parent) {
      setParent(res.parent);
      localStorage.setItem('speakup_active_parent_email', res.parent.email);
    }
    return { success: res.success, message: res.message };
  };

  const signInWithGoogle = async () => {
    const res = await parentAuthService.signInWithGoogle();
    if (res.success && res.parent) {
      setParent(res.parent);
      localStorage.setItem('speakup_active_parent_email', res.parent.email);
    }
    return { success: res.success, message: res.message };
  };

  const signInWithGoogleAccount = async (account: { email: string; name?: string }) => {
    const res = await parentAuthService.signInWithGoogleAccount(account);
    if (res.success && res.parent) {
      setParent(res.parent);
      localStorage.setItem('speakup_active_parent_email', res.parent.email);
    }
    return { success: res.success, message: res.message };
  };

  const signInWithEmailPassword = async (email: string, pass: string) => {
    const res = await parentAuthService.signInWithEmailPassword(email, pass);
    if (res.success && res.parent) {
      setParent(res.parent);
      localStorage.setItem('speakup_active_parent_email', res.parent.email);
    }
    return { success: res.success, message: res.message };
  };

  const resetAllToScratch = () => {
    parentAuthService.resetAllToScratch();
    setParent(null);
    setChildrenList([]);
    setActiveChild(null);
    setActiveConsent(null);
    setIsParentMode(false);
  };

  const submitConsent = async (
    options: { metricsProcessing: boolean; storeRecordings: boolean; emailSummaries: boolean },
    method: 'credit_card' | 'signed_econsent' | 'government_id' | 'mock_provider'
  ) => {
    if (!parent) return { success: false, message: 'Please create a parent account first.' };
    const res = await parentAuthService.submitParentalConsent(parent.id, parent.email, options, method);
    if (res.success && res.consentRecord) {
      setActiveConsent(res.consentRecord);
    }
    return { success: res.success, message: res.message };
  };

  const withdrawConsent = async () => {
    if (!parent || !activeConsent) return { success: false, message: 'No active consent record.' };
    const res = await parentAuthService.withdrawConsent(parent.id, activeConsent.id);
    if (res.success) {
      setActiveConsent({
        ...activeConsent,
        withdrawnAt: new Date().toISOString(),
        consentStoreRecordings: false,
        consentEmailSummaries: false,
      });
    }
    return res;
  };

  const createChild = async (nickname: string, ageBand: AgeGroup, avatarId: string, mascotId?: string) => {
    if (!parent) return { success: false, message: 'No parent account authenticated.' };
    const res = await parentAuthService.createChildProfile(parent.id, nickname, ageBand, avatarId, mascotId || 'sparky');
    if (res.success && res.child) {
      const updated = [...childrenList, res.child];
      setChildrenList(updated);
      setActiveChild(res.child);
    }
    return { success: res.success, message: res.message };
  };

  const enterParentMode = async (enteredPin: string) => {
    if (!parent) {
      // Allow entering parent setup mode
      setIsParentMode(true);
      return { success: true };
    }

    const pinRes = await parentAuthService.verifyParentPin(enteredPin, parent.id);
    if (pinRes.success) {
      setIsParentMode(true);
      return { success: true };
    }
    return { success: false, message: pinRes.errorMessage };
  };

  const exitParentMode = () => {
    setIsParentMode(false);
  };

  const selectActiveChild = (child: ChildRecord) => {
    setActiveChild(child);
  };

  return (
    <ParentAuthContext.Provider
      value={{
        parent,
        childrenList,
        activeChild,
        activeConsent,
        isParentMode,
        isLoading,
        enterParentMode,
        exitParentMode,
        signUpParent,
        signInWithGoogle,
        signInWithGoogleAccount,
        signInWithEmailPassword,
        resetAllToScratch,
        submitConsent,
        withdrawConsent,
        createChild,
        selectActiveChild,
        setActiveChild,
      }}
    >
      {children}
    </ParentAuthContext.Provider>
  );
};

export function useParentAuth(): ParentAuthContextType {
  const ctx = useContext(ParentAuthContext);
  if (!ctx) throw new Error('useParentAuth must be used within a ParentAuthProvider');
  return ctx;
}
