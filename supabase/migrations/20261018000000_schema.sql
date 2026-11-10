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
