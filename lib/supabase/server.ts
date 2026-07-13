import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// TODO: Implement actual Supabase server initialization in Phase 2/3
export const createClient = () => {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Under Server Component context, it is fine to ignore cookies.set call
          }
        },
      },
    }
  );
};
