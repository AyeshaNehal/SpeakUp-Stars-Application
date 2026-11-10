-- ==============================================================================
-- SpeakUp Stars Migration: Secure Server-Side Parent PIN & Column Isolation
-- Purpose:
-- 1. Drops pin_salt completely.
-- 2. Standardizes pin_hash, failed_pin_attempts, and pin_locked_until.
-- 3. Revokes client SELECT and UPDATE on PIN columns.
-- ==============================================================================

-- 1. Drop pin_salt if present
ALTER TABLE public.parents DROP COLUMN IF EXISTS pin_salt;

-- 2. Align pin_hash and failed_pin_attempts columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'parents' AND column_name = 'pin_hash') THEN
        ALTER TABLE public.parents ADD COLUMN pin_hash TEXT;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'parents' AND column_name = 'hashed_pin') THEN
            UPDATE public.parents SET pin_hash = hashed_pin;
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'parents' AND column_name = 'failed_pin_attempts') THEN
        ALTER TABLE public.parents ADD COLUMN failed_pin_attempts INTEGER NOT NULL DEFAULT 0;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'parents' AND column_name = 'pin_failed_attempts') THEN
            UPDATE public.parents SET failed_pin_attempts = pin_failed_attempts;
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'parents' AND column_name = 'consent_given') THEN
        ALTER TABLE public.parents ADD COLUMN consent_given BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'parents' AND column_name = 'consent_date') THEN
        ALTER TABLE public.parents ADD COLUMN consent_date TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'parents' AND column_name = 'consent_method') THEN
        ALTER TABLE public.parents ADD COLUMN consent_method TEXT;
    END IF;
END $$;

-- 3. Column-level permissions:
-- Authenticated client can ONLY SELECT non-sensitive columns.
-- pin_hash, hashed_pin, failed_pin_attempts, pin_failed_attempts, and pin_locked_until are strictly forbidden.
REVOKE ALL ON public.parents FROM authenticated, anon;
GRANT SELECT (id, email, email_verified, consent_given, consent_date, consent_method, created_at, updated_at) ON public.parents TO authenticated;

-- Service role retains full access for Edge Functions
GRANT ALL ON public.parents TO service_role;
