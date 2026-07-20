'use server';

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { ActionResponse } from './entries';
import { Database } from '@/types/database.types';

type BookerRow = Database['public']['Tables']['bookers']['Row'];

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
 */
export async function createBooker(
  name: string,
  phone: string,
  email: string
): Promise<ActionResponse<{ booker: BookerRow; tempPassword: string }>> {
  try {
    await verifyOwnerRole();

    const supabase = createClient();

    // 1. Create the profile row in public.bookers first to generate the booker_id
    const { data: booker, error: createError } = await supabase
      .from('bookers')
      .insert({
        name,
        phone: phone || null,
        email,
        status: 'active',
      })
      .select()
      .single();

    if (createError || !booker) {
      return { success: false, error: createError?.message || 'Failed to create booker record' };
    }

    // 2. Register the login account in Supabase Auth using Admin Client (via Service Role Key)
    const adminSupabase = getAdminClient();
    const tempPassword = generateTemporaryPassword();

    const { data: authUser, error: authCreateError } = await adminSupabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Confirm email automatically so they can log in right away
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

    // Trigger on_auth_user_created automatically populates public.users with booker_id and role!
    return {
      success: true,
      data: {
        booker,
        tempPassword,
      },
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error' };
  }
}

/**
 * Fetches all active bookers (status = 'active') with basic info.
 * Accessible only to Owners.
 */
export async function fetchBookers(): Promise<ActionResponse<BookerRow[]>> {
  try {
    await verifyOwnerRole();

    const supabase = createClient();
    const { data, error } = await supabase
      .from('bookers')
      .select('*')
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
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
    const { data, error } = await supabase
      .from('bookers')
      .update({
        name: fields.name,
        phone: fields.phone,
        email: fields.email,
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

    // Optional: We can also block their public.users access or deactivate their auth status here if desired
    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error' };
  }
}
