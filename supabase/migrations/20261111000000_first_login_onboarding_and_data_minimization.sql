-- ==============================================================================
-- SpeakUp Stars Migration: Real User Data & First-Login Onboarding
-- Schema upgrades for parents and children tables
-- Enforces strict data minimization (No birthdate, last name, school, address, or photo)
-- ==============================================================================

-- 1. Upgrade parents table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'parents' AND column_name = 'display_name') THEN
        ALTER TABLE public.parents ADD COLUMN display_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'parents' AND column_name = 'preferred_language') THEN
        ALTER TABLE public.parents ADD COLUMN preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'ur', 'ar', 'hi', 'es'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'parents' AND column_name = 'is_legal_guardian') THEN
        ALTER TABLE public.parents ADD COLUMN is_legal_guardian BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'parents' AND column_name = 'pin_set') THEN
        ALTER TABLE public.parents ADD COLUMN pin_set BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- 2. Upgrade children table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'children' AND column_name = 'interests') THEN
        ALTER TABLE public.children ADD COLUMN interests TEXT[] NOT NULL DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'children' AND column_name = 'comfort_level') THEN
        ALTER TABLE public.children ADD COLUMN comfort_level TEXT CHECK (comfort_level IS NULL OR comfort_level IN ('shy', 'nervous', 'okay', 'brave'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'children' AND column_name = 'daily_time_limit_minutes') THEN
        ALTER TABLE public.children ADD COLUMN daily_time_limit_minutes INTEGER NOT NULL DEFAULT 15;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'children' AND column_name = 'gentle_mode') THEN
        ALTER TABLE public.children ADD COLUMN gentle_mode BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'children' AND column_name = 'face_analysis') THEN
        ALTER TABLE public.children ADD COLUMN face_analysis BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'children' AND column_name = 'onboarding_completed') THEN
        ALTER TABLE public.children ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'children' AND column_name = 'onboarding_step') THEN
        ALTER TABLE public.children ADD COLUMN onboarding_step INTEGER NOT NULL DEFAULT 1;
    END IF;
END $$;

-- 3. Row-Level Security Policies Verification
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- Ensure RLS on children restricts access strictly to the authenticated parent
DROP POLICY IF EXISTS "Parents can only view their own children" ON public.children;
CREATE POLICY "Parents can only view their own children"
    ON public.children FOR SELECT
    USING (auth.uid() = parent_id);

DROP POLICY IF EXISTS "Parents can insert children for themselves only" ON public.children;
CREATE POLICY "Parents can insert children for themselves only"
    ON public.children FOR INSERT
    WITH CHECK (auth.uid() = parent_id);

DROP POLICY IF EXISTS "Parents can update their own children only" ON public.children;
CREATE POLICY "Parents can update their own children only"
    ON public.children FOR UPDATE
    USING (auth.uid() = parent_id);

DROP POLICY IF EXISTS "Parents can delete their own children only" ON public.children;
CREATE POLICY "Parents can delete their own children only"
    ON public.children FOR DELETE
    USING (auth.uid() = parent_id);

-- 4. Column-level permissions:
-- Revoke direct client write access to pin_hash, failed_pin_attempts, and pin_locked_until
REVOKE INSERT, UPDATE (pin_hash, failed_pin_attempts, pin_locked_until) ON public.parents FROM authenticated, anon;
GRANT SELECT (id, email, email_verified, display_name, preferred_language, is_legal_guardian, pin_set, consent_given, consent_date, consent_method, created_at, updated_at) ON public.parents TO authenticated;
GRANT ALL ON public.parents TO service_role;
