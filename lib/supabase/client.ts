import { createBrowserClient } from '@supabase/ssr';

// TODO: Implement actual Supabase browser initialization in Phase 2/3
export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
  );
};
