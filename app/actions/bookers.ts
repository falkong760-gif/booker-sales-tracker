'use server';

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { ActionResponse } from './entries';
import { Database } from '@/types/database.types';

type BookerRow = Database['public']['Tables']['bookers']['Row'];

export type BookerWithAuthInfo = BookerRow & {
  has_auth_link: boolean;
  balance: number;
};

interface SupabaseUserJoin {
  id: string;
}

interface SupabaseDailyEntryJoin {
  sale_amount: number;
  deposit_amount: number;
}

interface SupabaseBookerWithUsers {
  id: string;
  name: string;
  phone: string | null;
  email: string;
  status: 'active' | 'inactive';
  created_at: string;
  users: SupabaseUserJoin | SupabaseUserJoin[] | null;
  daily_entries: SupabaseDailyEntryJoin[] | null;
}

/**
 * Helper to retrieve current user session and role.
 */
async function verifyOwnerRole() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'owner') {
    throw new Error('Access Denied: Owner role required');
  }

  return user;
}

/**
 * Generates a random secure temporary password.
 */
function generateTemporaryPassword(length = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Creates a new Booker profile and registers a corresponding login account in Supabase Auth via Admin API.
 * Handles simulated login gracefully if service role key is missing.
 */
export async function createBooker(
  name: string,
  phone: string,
  email: string
): Promise<ActionResponse<{ booker: BookerRow; tempPassword: string; authSimulated: boolean }>> {
  try {
    await verifyOwnerRole();

    const supabase = createClient();

    // Clean input email
    const cleanEmail = email.trim().toLowerCase();

    // 1. Server-side validation
    if (!name || name.trim().length < 2) {
      return { success: false, error: 'Name must be at least 2 characters long.' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (phone) {
      const phoneRegex = /^[0-9\s+\-()]{7,}$/;
      if (!phoneRegex.test(phone)) {
        return { success: false, error: 'Phone number must be at least 7 characters and contain only digits, spaces, +, -, or parentheses.' };
      }
    }

    // Check if email already exists in public.bookers
    const { data: existingBooker } = await supabase
      .from('bookers')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingBooker) {
      return { success: false, error: 'Email address is already in use by another booker.' };
    }

    // 2. Create the profile row in public.bookers first to generate the booker_id
    const { data: booker, error: createError } = await supabase
      .from('bookers')
      .insert({
        name: name.trim(),
        phone: phone ? phone.trim() : null,
        email: cleanEmail,
        status: 'active',
      })
      .select()
      .single();

    if (createError || !booker) {
      return { success: false, error: createError?.message || 'Failed to create booker record' };
    }

    // 3. Register the login account in Supabase Auth
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const tempPassword = generateTemporaryPassword();
    let authSimulated = false;

    if (!serviceRoleKey) {
      // Graceful fallback for local development / testing without Service Role Key
      authSimulated = true;
    } else {
      try {
        const adminSupabase = getAdminClient();
        const { data: authUser, error: authCreateError } = await adminSupabase.auth.admin.createUser({
          email: cleanEmail,
          password: tempPassword,
          email_confirm: true, // Confirm email automatically
          user_metadata: {
            role: 'booker',
            booker_id: booker.id,
          },
        });

        if (authCreateError || !authUser.user) {
          // Rollback booker creation if Auth fails
          await supabase.from('bookers').delete().eq('id', booker.id);
          return { success: false, error: authCreateError?.message || 'Failed to register auth user' };
        }
      } catch (adminErr: unknown) {
        // Rollback and fail if service role was defined but client creation failed
        await supabase.from('bookers').delete().eq('id', booker.id);
        const errMsg = adminErr instanceof Error ? adminErr.message : 'Unknown admin client error';
        return { success: false, error: errMsg || 'Failed to initialize admin client' };
      }
    }

    return {
      success: true,
      data: {
        booker,
        tempPassword,
        authSimulated,
      },
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error' };
  }
}

/**
 * Fetches all bookers (active and inactive) with has_auth_link checking.
 * Accessible only to Owners.
 */
export async function fetchBookers(): Promise<ActionResponse<BookerWithAuthInfo[]>> {
  try {
    await verifyOwnerRole();

    const supabase = createClient();

    // Fetch bookers and join users to see if an auth link exists, and fetch daily entries to calculate pending balance
    const { data, error } = await supabase
      .from('bookers')
      .select('*, users(id), daily_entries(sale_amount, deposit_amount)')
      .order('name', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    const rawData = (data as unknown) as SupabaseBookerWithUsers[];

    const bookersWithAuth: BookerWithAuthInfo[] = (rawData || []).map((b) => {
      let hasAuth = false;
      if (b.users) {
        if (Array.isArray(b.users)) {
          hasAuth = b.users.length > 0;
        } else {
          hasAuth = typeof b.users === 'object' && b.users !== null;
        }
      }

      // Calculate all-time running balance (Shortfall: Sales - Deposits)
      const balance = (b.daily_entries || []).reduce(
        (acc, curr) => acc + (Number(curr.sale_amount || 0) - Number(curr.deposit_amount || 0)),
        0
      );

      return {
        id: b.id,
        name: b.name,
        phone: b.phone,
        email: b.email,
        status: b.status,
        created_at: b.created_at,
        has_auth_link: hasAuth,
        balance,
      };
    });

    return { success: true, data: bookersWithAuth };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error' };
  }
}

/**
 * Edits booker details.
 */
export async function updateBooker(
  bookerId: string,
  fields: { name?: string; phone?: string; email?: string }
): Promise<ActionResponse<BookerRow>> {
  try {
    await verifyOwnerRole();

    const supabase = createClient();

    const cleanEmail = fields.email ? fields.email.trim().toLowerCase() : undefined;

    // Server-side validation
    if (fields.name !== undefined && fields.name.trim().length < 2) {
      return { success: false, error: 'Name must be at least 2 characters long.' };
    }
    if (cleanEmail !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return { success: false, error: 'Please enter a valid email address.' };
      }

      // Check if email already exists in another booker
      const { data: existingBooker } = await supabase
        .from('bookers')
        .select('id')
        .eq('email', cleanEmail)
        .neq('id', bookerId)
        .maybeSingle();

      if (existingBooker) {
        return { success: false, error: 'Email address is already in use by another booker.' };
      }
    }
    if (fields.phone) {
      const phoneRegex = /^[0-9\s+\-()]{7,}$/;
      if (!phoneRegex.test(fields.phone)) {
        return { success: false, error: 'Phone number must be at least 7 characters and contain only digits, spaces, +, -, or parentheses.' };
      }
    }

    const { data, error } = await supabase
      .from('bookers')
      .update({
        name: fields.name ? fields.name.trim() : undefined,
        phone: fields.phone !== undefined ? (fields.phone ? fields.phone.trim() : null) : undefined,
        email: cleanEmail,
      })
      .eq('id', bookerId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error' };
  }
}

/**
 * Soft deactivates a booker (set status = 'inactive' instead of hard deleting).
 */
export async function deactivateBooker(bookerId: string): Promise<ActionResponse<BookerRow>> {
  try {
    await verifyOwnerRole();

    const supabase = createClient();
    const { data, error } = await supabase
      .from('bookers')
      .update({ status: 'inactive' })
      .eq('id', bookerId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error' };
  }
}

/**
 * Reactivates a booker (set status = 'active').
 */
export async function reactivateBooker(bookerId: string): Promise<ActionResponse<BookerRow>> {
  try {
    await verifyOwnerRole();

    const supabase = createClient();
    const { data, error } = await supabase
      .from('bookers')
      .update({ status: 'active' })
      .eq('id', bookerId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error' };
  }
}
