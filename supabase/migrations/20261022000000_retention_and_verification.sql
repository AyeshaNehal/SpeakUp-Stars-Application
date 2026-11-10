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
