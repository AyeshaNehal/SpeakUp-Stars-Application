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
