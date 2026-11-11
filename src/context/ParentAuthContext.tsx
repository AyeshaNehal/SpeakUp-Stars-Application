/**
 * CHILD PRIVACY NOTE (Rule 1, Rule 5):
 * - Parent Authentication & Family Mode Context
 * - Ensures parent is authenticated, child mode is strictly sandboxed,
 *   and all state transitions follow the server-authoritative state machine.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  parentAuthService,
  ParentAccount,
  ChildRecord,
  ConsentRecord,
  AccountStateResult,
  OnboardingStep,
} from '../services/auth/parentAuthService';
export type { OnboardingStep };
import { AgeGroup } from '../types';

interface ParentAuthContextType {
  parent: ParentAccount | null;
  childrenList: ChildRecord[];
  activeChild: ChildRecord | null;
  activeConsent: ConsentRecord | null;
  accountState: AccountStateResult | null;
  isParentMode: boolean;
  isLoading: boolean;
  refreshAccountState: () => Promise<AccountStateResult>;
  enterParentMode: (pin: string) => Promise<{ success: boolean; message?: string }>;
  exitParentMode: () => void;
  signUpParent: (email: string, pass: string, pin?: string) => Promise<{ success: boolean; message?: string; parent?: ParentAccount }>;
  verifyEmailCode: (code?: string) => Promise<{ success: boolean; message?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  signInWithEmailPassword: (email: string, pass: string) => Promise<{ success: boolean; message?: string; parent?: ParentAccount }>;
  signOut: () => void;
  updateParentProfile: (data: { displayName: string; preferredLanguage: 'en' | 'ur' | 'ar' | 'hi' | 'es'; isLegalGuardian: boolean }) => Promise<{ success: boolean; message?: string }>;
  submitConsent: (
    options: { metricsProcessing: boolean; storeRecordings: boolean; emailSummaries: boolean },
    method?: 'credit_card' | 'signed_econsent' | 'government_id' | 'mock_provider'
  ) => Promise<{ success: boolean; message?: string }>;
  withdrawConsent: () => Promise<{ success: boolean; message: string }>;
  saveParentPin: (pin: string) => Promise<{ success: boolean; message?: string }>;
  saveChildWizardStep: (childData: Partial<ChildRecord> & { id?: string }) => Promise<{ success: boolean; child?: ChildRecord; message?: string }>;
  completeChildWizard: (childId: string) => Promise<{ success: boolean; child?: ChildRecord; message?: string }>;
  updateChildProfile: (childId: string, updates: Partial<ChildRecord>, pin: string) => Promise<{ success: boolean; child?: ChildRecord; message?: string }>;
  deleteChildProfile: (childId: string, pin: string) => Promise<{ success: boolean; message?: string }>;
  selectActiveChild: (child: ChildRecord) => void;
  setActiveChild: React.Dispatch<React.SetStateAction<ChildRecord | null>>;
  resetAllToScratch: () => void;
  createChild: (nickname: string, ageBand: AgeGroup, avatarId: string, mascotId?: string) => Promise<{ success: boolean; message?: string }>;
}

const ParentAuthContext = createContext<ParentAuthContextType | undefined>(undefined);

export const ParentAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [parent, setParent] = useState<ParentAccount | null>(null);
  const [childrenList, setChildrenList] = useState<ChildRecord[]>([]);
  const [activeChild, setActiveChild] = useState<ChildRecord | null>(null);
  const [activeConsent, setActiveConsent] = useState<ConsentRecord | null>(null);
  const [accountState, setAccountState] = useState<AccountStateResult | null>(null);
  const [isParentMode, setIsParentMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshAccountState = useCallback(async (): Promise<AccountStateResult> => {
    const res = await parentAuthService.getAccountState(parent?.id);
    setAccountState(res);
    setParent(res.parent);
    setChildrenList(res.children);
    setActiveConsent(res.consent);

    // Keep activeChild selection if valid, or default to completed child
    if (res.activeChild) {
      setActiveChild((prev) => {
        if (prev && res.children.some((c) => c.id === prev.id)) return prev;
        return res.activeChild;
      });
    } else {
      setActiveChild(null);
    }

    return res;
  }, [parent?.id]);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      setIsLoading(true);
      await refreshAccountState();
      if (isMounted) setIsLoading(false);
    }
    init();

    const sb = parentAuthService.getSupabase();
    if (sb) {
      const { data: { subscription } } = sb.auth.onAuthStateChange(async (_event, session) => {
        if (session && isMounted) {
          await refreshAccountState();
        }
      });
      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }
    return () => {
      isMounted = false;
    };
  }, [refreshAccountState]);

  const signUpParent = async (email: string, pass: string, pin?: string) => {
    const res = await parentAuthService.parentSignUp(email, pass, pin);
    if (res.success && res.parent) {
      setParent(res.parent);
      await refreshAccountState();
    }
    return res;
  };

  const verifyEmailCode = async (code?: string) => {
    if (!parent) return { success: false, message: 'Not signed in.' };
    const res = await parentAuthService.verifyEmailCode(parent.id, code);
    if (res.success) {
      await refreshAccountState();
    }
    return res;
  };

  const signInWithGoogle = async () => {
    const res = await parentAuthService.signInWithGoogle();
    if (res.success) {
      await refreshAccountState();
    }
    return res;
  };

  const signInWithEmailPassword = async (email: string, pass: string) => {
    const res = await parentAuthService.signInWithEmailPassword(email, pass);
    if (res.success && res.parent) {
      setParent(res.parent);
      await refreshAccountState();
    }
    return res;
  };

  const signOut = () => {
    const sb = parentAuthService.getSupabase();
    if (sb) {
      sb.auth.signOut().catch(() => {});
    }
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('speakup_active_parent_id');
    }
    setParent(null);
    setChildrenList([]);
    setActiveChild(null);
    setActiveConsent(null);
    setAccountState({
      step: 'login',
      route: '/login',
      parent: null,
      activeChild: null,
      children: [],
      consent: null,
    });
    setIsParentMode(false);
  };

  const updateParentProfile = async (data: {
    displayName: string;
    preferredLanguage: 'en' | 'ur' | 'ar' | 'hi' | 'es';
    isLegalGuardian: boolean;
  }) => {
    if (!parent) return { success: false, message: 'Not signed in.' };
    const res = await parentAuthService.updateParentProfile(parent.id, data);
    if (res.success) {
      await refreshAccountState();
    }
    return res;
  };

  const submitConsent = async (
    options: { metricsProcessing: boolean; storeRecordings: boolean; emailSummaries: boolean },
    method: 'credit_card' | 'signed_econsent' | 'government_id' | 'mock_provider' = 'signed_econsent'
  ) => {
    if (!parent) return { success: false, message: 'Please create an account first.' };
    const res = await parentAuthService.submitParentalConsent(parent.id, parent.email, options, method);
    if (res.success) {
      await refreshAccountState();
    }
    return res;
  };

  const withdrawConsent = async () => {
    if (!parent || !activeConsent) return { success: false, message: 'No active consent record.' };
    const res = await parentAuthService.withdrawConsent(parent.id, activeConsent.id);
    if (res.success) {
      await refreshAccountState();
    }
    return res;
  };

  const saveParentPin = async (pin: string) => {
    if (!parent) return { success: false, message: 'Not signed in.' };
    const res = await parentAuthService.saveParentPin(parent.id, pin);
    if (res.success) {
      await refreshAccountState();
    }
    return res;
  };

  const saveChildWizardStep = async (childData: Partial<ChildRecord> & { id?: string }) => {
    if (!parent) return { success: false, message: 'Not signed in.' };
    const res = await parentAuthService.saveChildWizardStep(parent.id, childData);
    if (res.success && res.child) {
      await refreshAccountState();
    }
    return res;
  };

  const completeChildWizard = async (childId: string) => {
    if (!parent) return { success: false, message: 'Not signed in.' };
    const res = await parentAuthService.completeChildWizard(parent.id, childId);
    if (res.success && res.child) {
      await refreshAccountState();
    }
    return res;
  };

  const updateChildProfile = async (childId: string, updates: Partial<ChildRecord>, pin: string) => {
    if (!parent) return { success: false, message: 'Not signed in.' };
    const res = await parentAuthService.updateChildProfile(parent.id, childId, updates, pin);
    if (res.success && res.child) {
      await refreshAccountState();
    }
    return res;
  };

  const deleteChildProfile = async (childId: string, pin: string) => {
    if (!parent) return { success: false, message: 'Not signed in.' };
    const res = await parentAuthService.deleteChildProfile(parent.id, childId, pin);
    if (res.success) {
      await refreshAccountState();
    }
    return res;
  };

  const createChild = async (nickname: string, ageBand: AgeGroup, avatarId: string, mascotId?: string) => {
    if (!parent) return { success: false, message: 'No parent account authenticated.' };
    const res = await parentAuthService.createChildProfile(parent.id, nickname, ageBand, avatarId, mascotId || 'sparky');
    if (res.success && res.child) {
      await refreshAccountState();
    }
    return { success: res.success, message: res.message };
  };

  const enterParentMode = async (enteredPin: string) => {
    if (!parent) {
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

  const resetAllToScratch = () => {
    parentAuthService.resetAllToScratch();
    signOut();
  };

  return (
    <ParentAuthContext.Provider
      value={{
        parent,
        childrenList,
        activeChild,
        activeConsent,
        accountState,
        isParentMode,
        isLoading,
        refreshAccountState,
        enterParentMode,
        exitParentMode,
        signUpParent,
        verifyEmailCode,
        signInWithGoogle,
        signInWithEmailPassword,
        signOut,
        updateParentProfile,
        submitConsent,
        withdrawConsent,
        saveParentPin,
        saveChildWizardStep,
        completeChildWizard,
        updateChildProfile,
        deleteChildProfile,
        selectActiveChild,
        setActiveChild,
        resetAllToScratch,
        createChild,
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
