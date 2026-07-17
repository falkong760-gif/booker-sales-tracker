-- Phase 3 — Audit Logging Table Schema and RLS Policies

-- 1. Create public.entry_audit_log table
CREATE TABLE public.entry_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES public.daily_entries(id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    old_values JSONB NOT NULL,
    new_values JSONB NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.entry_audit_log ENABLE ROW LEVEL SECURITY;

-- 3. Row Level Security Policies for SELECT
CREATE POLICY "Allow owners full SELECT access to audit logs"
    ON public.entry_audit_log FOR SELECT
    TO authenticated
    USING (public.get_user_role() = 'owner');

CREATE POLICY "Allow bookers SELECT access to their own transaction audit logs"
    ON public.entry_audit_log FOR SELECT
    TO authenticated
    USING (
        public.get_user_role() = 'booker'
        AND EXISTS (
            SELECT 1 FROM public.daily_entries de
            WHERE de.id = entry_id
            AND de.booker_id = public.get_user_booker_id()
        )
    );

-- NOTE: No INSERT, UPDATE, or DELETE policies are granted to authenticated roles on entry_audit_log.
-- Insertions are performed on the server side via the security-definer system or server actions.
