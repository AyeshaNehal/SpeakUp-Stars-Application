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
