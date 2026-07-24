'use server';

import { createClient } from '@/lib/supabase/server';
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
 * Creates a new Booker profile row in public.bookers.
 * No Auth account creation needed since bookers do not log in.
 */
export async function createBooker(
  name: string,
  phone: string,
  email: string
): Promise<ActionResponse<{ booker: BookerRow }>> {
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

    // 2. Create the profile row in public.bookers
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

    return {
      success: true,
      data: {
        booker,
      },
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error' };
  }
}

/**
 * Fetches all bookers (active and inactive).
 * Accessible only to Owners.
 */
export async function fetchBookers(): Promise<ActionResponse<BookerRow[]>> {
  try {
    await verifyOwnerRole();

    const supabase = createClient();

    const { data, error } = await supabase
      .from('bookers')
      .select('*')
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
