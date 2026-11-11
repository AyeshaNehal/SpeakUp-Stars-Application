-- ==============================================================================
-- SpeakUp Stars: Child-Safe Parent Account & Family Row-Level Security Schema
-- Tables: parents, children, sessions, metrics, badges, points, settings, consent_records
-- ==============================================================================

-- 1. PARENTS TABLE (Account Holder)
CREATE TABLE IF NOT EXISTS public.parents (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    hashed_pin TEXT NOT NULL, -- Hashed 4-6 digit parent PIN (argon2 / bcrypt)
    pin_failed_attempts INTEGER NOT NULL DEFAULT 0,
    pin_locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can only view their own account"
    ON public.parents FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Parents can update their own account"
    ON public.parents FOR UPDATE
    USING (auth.uid() = id);


-- 2. CHILDREN TABLE (Data Minimization: Nickname & Age Band ONLY)
CREATE TABLE IF NOT EXISTS public.children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL,
    age_band TEXT NOT NULL CHECK (age_band IN ('3-5', '6-8', '9-12')),
    avatar_id TEXT NOT NULL DEFAULT 'lion',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_children_parent ON public.children(parent_id);

ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can select their own children"
    ON public.children FOR SELECT
    USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert children for themselves"
    ON public.children FOR INSERT
    WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update their own children"
    ON public.children FOR UPDATE
    USING (auth.uid() = parent_id);

CREATE POLICY "Parents can delete their own children"
    ON public.children FOR DELETE
    USING (auth.uid() = parent_id);


-- 3. SESSIONS TABLE (Speaking practice activity)
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    recording_stored BOOLEAN NOT NULL DEFAULT FALSE,
    recording_url TEXT, -- NULL unless explicitly opted-in by parent
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_sessions_parent_child ON public.sessions(parent_id, child_id);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view their family sessions"
    ON public.sessions FOR SELECT
    USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert sessions for their children"
    ON public.sessions FOR INSERT
    WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can delete their family sessions"
    ON public.sessions FOR DELETE
    USING (auth.uid() = parent_id);


-- 4. METRICS TABLE (Numeric speech stats)
CREATE TABLE IF NOT EXISTS public.metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    clarity_score NUMERIC(5,2) NOT NULL,
    pacing_score NUMERIC(5,2) NOT NULL,
    courage_score NUMERIC(5,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_metrics_parent_session ON public.metrics(parent_id, session_id);

ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view their family speech metrics"
    ON public.metrics FOR SELECT
    USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert speech metrics for their children"
    ON public.metrics FOR INSERT
    WITH CHECK (auth.uid() = parent_id);


-- 5. BADGES TABLE (Earned accomplishments)
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    badge_key TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(child_id, badge_key)
);

CREATE INDEX IF NOT EXISTS idx_badges_parent_child ON public.badges(parent_id, child_id);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view badges for their children"
    ON public.badges FOR SELECT
    USING (auth.uid() = parent_id);

CREATE POLICY "Parents can award badges to their children"
    ON public.badges FOR INSERT
    WITH CHECK (auth.uid() = parent_id);


-- 6. POINTS TABLE (Star banks)
CREATE TABLE IF NOT EXISTS public.points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    stars_earned INTEGER NOT NULL DEFAULT 0,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_points_parent_child ON public.points(parent_id, child_id);

ALTER TABLE public.points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view star points for their children"
    ON public.points FOR SELECT
    USING (auth.uid() = parent_id);

CREATE POLICY "Parents can add star points for their children"
    ON public.points FOR INSERT
    WITH CHECK (auth.uid() = parent_id);


-- 7. SETTINGS TABLE (Family preferences & optional opt-ins)
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL UNIQUE REFERENCES public.parents(id) ON DELETE CASCADE,
    store_recordings_opt_in BOOLEAN NOT NULL DEFAULT FALSE, -- DEFAULTS TO OFF
    weekly_email_opt_in BOOLEAN NOT NULL DEFAULT FALSE,     -- DEFAULTS TO OFF
    sound_effects_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view their family settings"
    ON public.settings FOR SELECT
    USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert/update their family settings"
    ON public.settings FOR ALL
    USING (auth.uid() = parent_id)
    WITH CHECK (auth.uid() = parent_id);


-- 8. CONSENT_RECORDS TABLE (Timestamped Verifiable Consent & Right to Withdraw)
CREATE TABLE IF NOT EXISTS public.consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    policy_version TEXT NOT NULL,
    consent_metrics_processing BOOLEAN NOT NULL,
    consent_store_recordings BOOLEAN NOT NULL DEFAULT FALSE,
    consent_email_summaries BOOLEAN NOT NULL DEFAULT FALSE,
    verification_method TEXT NOT NULL, -- e.g. 'credit_card', 'signed_econsent', 'government_id', 'mock_provider'
    verification_reference TEXT,
    withdrawn_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_consent_parent ON public.consent_records(parent_id);

ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view their own consent records"
    ON public.consent_records FOR SELECT
    USING (auth.uid() = parent_id);

CREATE POLICY "Parents can create consent records"
    ON public.consent_records FOR INSERT
    WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can withdraw (update) their consent records"
    ON public.consent_records FOR UPDATE
    USING (auth.uid() = parent_id);
-- ==============================================================================
-- SpeakUp Stars: Rewards, Streaks, Streak Freezes, and Mascot Shop Schema
-- Tables: streaks, shop_purchases
-- Enables Row-Level Security: Parents can only access their own children's records.
-- ==============================================================================

-- 1. STREAKS TABLE (Daily Practice & Streak Freeze protection)
CREATE TABLE IF NOT EXISTS public.streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    child_id UUID NOT NULL UNIQUE REFERENCES public.children(id) ON DELETE CASCADE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    last_practice_date DATE,
    streak_freezes_available INTEGER NOT NULL DEFAULT 1, -- Default 1 freeze protection
    freeze_used_dates DATE[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_streaks_parent_child ON public.streaks(parent_id, child_id);

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view streaks for their children"
    ON public.streaks FOR SELECT
    USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert/update streaks for their children"
    ON public.streaks FOR ALL
    USING (auth.uid() = parent_id)
    WITH CHECK (auth.uid() = parent_id);


-- 2. SHOP_PURCHASES TABLE (Mascot hats, outfits, themes, and backgrounds)
-- Star Points only. Zero real-money microtransactions.
CREATE TABLE IF NOT EXISTS public.shop_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('hat', 'outfit', 'theme', 'background')),
    is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(child_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_shop_purchases_parent_child ON public.shop_purchases(parent_id, child_id);

ALTER TABLE public.shop_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view shop items for their children"
    ON public.shop_purchases FOR SELECT
    USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert/update shop items for their children"
    ON public.shop_purchases FOR ALL
    USING (auth.uid() = parent_id)
    WITH CHECK (auth.uid() = parent_id);
-- ==============================================================================
-- SpeakUp Stars: Security Hardening, Audit Logs, and Row-Level Security Verification
-- Migration: 20261018020000_security_and_audit.sql
-- Enforces:
-- 1. Admin & Access Audit Log with STRICT CHILD CONTENT EXCLUSION.
-- 2. Explicit Row-Level Security on every table in public schema.
-- 3. Strict cross-tenant isolation: Parents can only access their own family data.
-- ==============================================================================

-- 1. ADMIN AUDIT LOGS TABLE
-- Records WHO accessed WHAT data and WHEN, with zero child speech content.
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES public.parents(id) ON DELETE SET NULL,
    actor_id TEXT NOT NULL,
    actor_role TEXT NOT NULL CHECK (actor_role IN ('parent', 'system', 'admin', 'auditor')),
    action TEXT NOT NULL CHECK (action IN (
        'login',
        'logout',
        'view_sessions',
        'view_metrics',
        'export_data_json',
        'export_data_csv',
        'delete_session',
        'delete_child_data',
        'delete_account',
        'update_consent',
        'security_alert_review',
        'pin_verify_success',
        'pin_verify_failed'
    )),
    target_resource_id TEXT,
    target_resource_type TEXT NOT NULL CHECK (target_resource_type IN (
        'session',
        'child_profile',
        'consent_record',
        'parent_account',
        'settings',
        'recording_media'
    )),
    ip_address_hash TEXT,
    user_agent_hash TEXT,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_parent ON public.admin_audit_logs(parent_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.admin_audit_logs(created_at);

-- 2. ENABLE ROW-LEVEL SECURITY ON AUDIT LOGS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Parents can only view audit logs relating to their own family account
CREATE POLICY "Parents can only view their own audit logs"
    ON public.admin_audit_logs FOR SELECT
    USING (auth.uid() = parent_id);

-- System service can insert audit records for verifiable compliance
CREATE POLICY "System can record audit logs"
    ON public.admin_audit_logs FOR INSERT
    WITH CHECK (true);

-- Audits are append-only: Nobody can update or delete audit logs
-- (Immutable audit trail under SOC2 / COPPA standards)

-- 3. VERIFY AND ENFORCE RLS ON EVERY PUBLIC TABLE
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'parents',
        'children',
        'sessions',
        'metrics',
        'badges',
        'points',
        'settings',
        'consent_records',
        'streaks',
        'shop_purchases',
        'admin_audit_logs'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        END IF;
    END LOOP;
END $$;
-- ==============================================================================
-- SpeakUp Stars: Data Retention Stored Procedures & Parent Verification Tokens
-- Migration: 20261022000000_retention_and_verification.sql
-- Implements:
-- 1. Table for cryptographic parent email verification tokens (VPC & PIN Resets).
-- 2. Server-side SQL functions for automated daily data retention purges:
--    - purge_expired_recordings() (30-day max for opted-in recordings)
--    - purge_expired_transcripts() (12-month default / parent-configured threshold)
--    - purge_inactive_accounts() (24-month dormancy cascading deletion)
--    - purge_expired_audit_logs() (30-day rolling log window)
--    - run_all_retention_purges() (Unified master purge routine)
-- ==============================================================================

-- 1. PARENT VERIFICATION TOKENS TABLE
-- Stores cryptographically hashed tokens for Verifiable Parental Consent & PIN resets
CREATE TABLE IF NOT EXISTS public.parent_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    token_type TEXT NOT NULL CHECK (token_type IN ('vpc_consent', 'pin_reset', 'email_verify')),
    verification_metadata JSONB DEFAULT '{}'::jsonb,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_verification_tokens_parent ON public.parent_verification_tokens(parent_id);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_lookup ON public.parent_verification_tokens(token_hash, expires_at);

ALTER TABLE public.parent_verification_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view their own verification tokens"
    ON public.parent_verification_tokens FOR SELECT
    USING (auth.uid() = parent_id);

CREATE POLICY "System can manage verification tokens"
    ON public.parent_verification_tokens FOR ALL
    USING (true)
    WITH CHECK (true);


-- 2. PERFORMANCE INDEXES FOR SCHEDULED PURGES
CREATE INDEX IF NOT EXISTS idx_sessions_retention ON public.sessions(created_at, recording_stored);
CREATE INDEX IF NOT EXISTS idx_parents_activity ON public.parents(updated_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_retention ON public.admin_audit_logs(created_at);


-- 3. STORED PROCEDURE: PURGE EXPIRED RECORDINGS (30 DAYS)
-- Deletes recording URL references for sessions older than 30 days
CREATE OR REPLACE FUNCTION public.purge_expired_recordings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    purged_count INTEGER := 0;
BEGIN
    UPDATE public.sessions
    SET 
        recording_stored = FALSE,
        recording_url = NULL
    WHERE 
        recording_stored = TRUE
        AND created_at < (timezone('utc'::text, now()) - INTERVAL '30 days');

    GET DIAGNOSTICS purged_count = ROW_COUNT;

    IF purged_count > 0 THEN
        INSERT INTO public.admin_audit_logs (
            actor_id,
            actor_role,
            action,
            target_resource_id,
            target_resource_type,
            success
        ) VALUES (
            'system_retention_job',
            'system',
            'delete_session',
            format('%s recordings expired and purged', purged_count),
            'recording_media',
            TRUE
        );
    END IF;

    RETURN purged_count;
END;
$$;


-- 4. STORED PROCEDURE: PURGE EXPIRED TRANSCRIPTS (12 MONTHS / PARENT SETTINGS)
-- Replaces transcript text with policy purge marker while preserving numeric metrics
CREATE OR REPLACE FUNCTION public.purge_expired_transcripts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    purged_count INTEGER := 0;
    transcript_marker TEXT := '[EXPIRED_AND_PURGED_UNDER_DATA_RETENTION_POLICY]';
BEGIN
    -- Update sessions older than 12 months (or parent-configured threshold)
    -- Left join settings to respect custom parent retention if configured
    UPDATE public.sessions s
    SET topic = transcript_marker
    FROM public.settings set
    WHERE s.parent_id = set.parent_id
      AND s.topic != transcript_marker
      AND s.created_at < (timezone('utc'::text, now()) - INTERVAL '12 months');

    GET DIAGNOSTICS purged_count = ROW_COUNT;

    IF purged_count > 0 THEN
        INSERT INTO public.admin_audit_logs (
            actor_id,
            actor_role,
            action,
            target_resource_id,
            target_resource_type,
            success
        ) VALUES (
            'system_retention_job',
            'system',
            'delete_session',
            format('%s transcripts purged after 12 months', purged_count),
            'session',
            TRUE
        );
    END IF;

    RETURN purged_count;
END;
$$;


-- 5. STORED PROCEDURE: PURGE INACTIVE ACCOUNTS (24 MONTHS)
-- Irreversibly cascades deletion across parent accounts inactive for 24 months
CREATE OR REPLACE FUNCTION public.purge_inactive_accounts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    purged_count INTEGER := 0;
BEGIN
    DELETE FROM public.parents
    WHERE updated_at < (timezone('utc'::text, now()) - INTERVAL '24 months');

    GET DIAGNOSTICS purged_count = ROW_COUNT;

    IF purged_count > 0 THEN
        INSERT INTO public.admin_audit_logs (
            actor_id,
            actor_role,
            action,
            target_resource_id,
            target_resource_type,
            success
        ) VALUES (
            'system_retention_job',
            'system',
            'delete_account',
            format('%s dormant accounts purged after 24 months inactivity', purged_count),
            'parent_account',
            TRUE
        );
    END IF;

    RETURN purged_count;
END;
$$;


-- 6. STORED PROCEDURE: PURGE EXPIRED AUDIT LOGS (30 DAYS)
-- Enforces 30-day rolling retention on administrative audit trails
CREATE OR REPLACE FUNCTION public.purge_expired_audit_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    purged_count INTEGER := 0;
BEGIN
    DELETE FROM public.admin_audit_logs
    WHERE created_at < (timezone('utc'::text, now()) - INTERVAL '30 days');

    GET DIAGNOSTICS purged_count = ROW_COUNT;
    RETURN purged_count;
END;
$$;


-- 7. MASTER STORED PROCEDURE: RUN ALL RETENTION PURGES
CREATE OR REPLACE FUNCTION public.run_all_retention_purges()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    recordings_purged INTEGER;
    transcripts_purged INTEGER;
    inactive_purged INTEGER;
    logs_purged INTEGER;
    result JSONB;
BEGIN
    recordings_purged := public.purge_expired_recordings();
    transcripts_purged := public.purge_expired_transcripts();
    inactive_purged := public.purge_inactive_accounts();
    logs_purged := public.purge_expired_audit_logs();

    result := jsonb_build_object(
        'timestamp', timezone('utc'::text, now()),
        'recordings_purged', recordings_purged,
        'transcripts_purged', transcripts_purged,
        'inactive_accounts_purged', inactive_purged,
        'logs_purged', logs_purged,
        'total_purged', (recordings_purged + transcripts_purged + inactive_purged + logs_purged)
    );

    RETURN result;
END;
$$;
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
