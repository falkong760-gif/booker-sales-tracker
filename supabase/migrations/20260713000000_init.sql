-- Phase 2 — Database Initialization & Migrations

-- 1. Create public.bookers table
CREATE TABLE public.bookers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create public.daily_entries table
CREATE TABLE public.daily_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booker_id UUID NOT NULL REFERENCES public.bookers(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    sale_amount NUMERIC NOT NULL DEFAULT 0,
    deposit_amount NUMERIC NOT NULL DEFAULT 0,
    shortfall NUMERIC GENERATED ALWAYS AS (sale_amount - deposit_amount) STORED,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_booker_entry_date UNIQUE (booker_id, entry_date)
);

-- 3. Create public.users table (extends auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'booker')),
    booker_id UUID REFERENCES public.bookers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create secure role and booker definition functions to bypass policy recursion
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN (SELECT role FROM public.users WHERE id = auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_booker_id()
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN (SELECT booker_id FROM public.users WHERE id = auth.uid());
END;
$$;

-- 5. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.bookers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 6. Row Level Security Policies for public.users
CREATE POLICY "Allow public.users read access for authenticated users"
    ON public.users FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow owners full access to public.users"
    ON public.users FOR ALL
    TO authenticated
    USING (public.get_user_role() = 'owner');

-- 7. Row Level Security Policies for public.bookers
CREATE POLICY "Allow owners full access to public.bookers"
    ON public.bookers FOR ALL
    TO authenticated
    USING (public.get_user_role() = 'owner');

CREATE POLICY "Allow bookers to view their own booker row"
    ON public.bookers FOR SELECT
    TO authenticated
    USING (
        public.get_user_role() = 'booker'
        AND id = public.get_user_booker_id()
    );

-- 8. Row Level Security Policies for public.daily_entries
CREATE POLICY "Allow owners full access to public.daily_entries"
    ON public.daily_entries FOR ALL
    TO authenticated
    USING (public.get_user_role() = 'owner');

CREATE POLICY "Allow bookers SELECT access to their own daily_entries"
    ON public.daily_entries FOR SELECT
    TO authenticated
    USING (
        public.get_user_role() = 'booker'
        AND booker_id = public.get_user_booker_id()
    );

CREATE POLICY "Allow bookers INSERT access to their own daily_entries"
    ON public.daily_entries FOR INSERT
    TO authenticated
    WITH CHECK (
        public.get_user_role() = 'booker'
        AND booker_id = public.get_user_booker_id()
    );

CREATE POLICY "Allow bookers UPDATE access to their own daily_entries"
    ON public.daily_entries FOR UPDATE
    TO authenticated
    USING (
        public.get_user_role() = 'booker'
        AND booker_id = public.get_user_booker_id()
    )
    WITH CHECK (
        public.get_user_role() = 'booker'
        AND booker_id = public.get_user_booker_id()
    );

-- NOTE: Bookers cannot DELETE entries. (No DELETE policy is defined for role = 'booker')

-- 9. Create a trigger that automatically populates public.users on auth signups
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.users (id, role, booker_id)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'role', 'booker'),
        (new.raw_user_meta_data->>'booker_id')::uuid
    );
    RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
