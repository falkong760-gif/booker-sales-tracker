import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

// Admin Supabase client utilizing service_role bypass.
// Must ONLY be imported and executed inside Server Actions or Server Routes.
export const getAdminClient = () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables.');
  }
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
};
