'use server';

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { Database } from '@/types/database.types';
import { revalidatePath } from 'next/cache';

type DailyEntryRow = Database['public']['Tables']['daily_entries']['Row'];

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Helper to retrieve the current user and their profile role.
 */
async function getUserSession() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role, booker_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('User profile not found');
  }

  return { user, profile };
}

/**
 * Creates a daily entry or updates it if one already exists for that date (edit-if-exists).
 */
export async function createEntry(
  bookerId: string,
  entryDate: string,
  saleAmount: number,
  depositAmount: number,
  remarks?: string
): Promise<ActionResponse<DailyEntryRow>> {
  try {
    const { profile } = await getUserSession();

    // RLS Boundaries check
    if (profile.role === 'booker' && profile.booker_id !== bookerId) {
      return { success: false, error: 'Access Denied: Bookers can only record entries for themselves' };
    }

    // Server-side validation
    if (!entryDate) {
      return { success: false, error: 'Date is required.' };
    }
    const todayLocalStr = new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD'
    if (entryDate > todayLocalStr) {
      return { success: false, error: 'Entry date cannot be in the future.' };
    }
    if (saleAmount < 0) {
      return { success: false, error: 'Sale amount cannot be negative.' };
    }
    if (depositAmount < 0) {
      return { success: false, error: 'Deposit amount cannot be negative.' };
    }

    const supabase = createClient();

    // Perform UPSERT
    const { data, error } = await supabase
      .from('daily_entries')
      .upsert(
        {
          booker_id: bookerId,
          entry_date: entryDate,
          sale_amount: saleAmount,
          deposit_amount: depositAmount,
          remarks: remarks || null,
        },
        {
          onConflict: 'booker_id,entry_date',
        }
      )
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Cache Revalidation
    revalidatePath('/dashboard');
    revalidatePath('/bookers');
    revalidatePath(`/bookers/${bookerId}`);

    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error' };
  }
}

/**
 * Updates an entry and logs an audit trail record of old vs new values.
 */
export async function updateEntry(
  entryId: string,
  saleAmount: number,
  depositAmount: number,
  remarks?: string
): Promise<ActionResponse<DailyEntryRow>> {
  try {
    const { user, profile } = await getUserSession();
    const supabase = createClient();

    // 1. Fetch old record first to verify access and record audit baseline
    const { data: oldEntry, error: fetchError } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('id', entryId)
      .single();

    if (fetchError || !oldEntry) {
      return { success: false, error: 'Entry not found or unauthorized' };
    }

    // Role check: bookers can only edit their own entries
    if (profile.role === 'booker' && profile.booker_id !== oldEntry.booker_id) {
      return { success: false, error: 'Access Denied: Cannot edit other bookers entries' };
    }

    // Server-side validation
    if (saleAmount < 0) {
      return { success: false, error: 'Sale amount cannot be negative.' };
    }
    if (depositAmount < 0) {
      return { success: false, error: 'Deposit amount cannot be negative.' };
    }

    // 2. Perform transaction update
    const { data: newEntry, error: updateError } = await supabase
      .from('daily_entries')
      .update({
        sale_amount: saleAmount,
        deposit_amount: depositAmount,
        remarks: remarks || null,
      })
      .eq('id', entryId)
      .select()
      .single();

    if (updateError || !newEntry) {
      return { success: false, error: updateError?.message || 'Update failed' };
    }

    // 3. Insert audit log record. Since users cannot insert audit logs directly, we use the Admin client
    const adminSupabase = getAdminClient();
    const { error: auditError } = await adminSupabase
      .from('entry_audit_log')
      .insert({
        entry_id: entryId,
        changed_by: user.id,
        old_values: oldEntry,
        new_values: newEntry,
      });

    if (auditError) {
      console.error('Audit logging failed:', auditError);
      // We don't crash the transaction edit even if audit fails, but logging is vital
    }

    // Cache Revalidation
    revalidatePath('/dashboard');
    revalidatePath('/bookers');
    revalidatePath(`/bookers/${newEntry.booker_id}`);

    return { success: true, data: newEntry };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error' };
  }
}

/**
 * Deletes an entry. Only allowed for Owners.
 */
export async function deleteEntry(entryId: string): Promise<ActionResponse<null>> {
  try {
    const { profile } = await getUserSession();
    if (profile.role !== 'owner') {
      return { success: false, error: 'Access Denied: Only Owners can delete entries' };
    }

    const supabase = createClient();

    // Fetch the entry first to find out which booker it belongs to for cache revalidation
    const { data: entryData } = await supabase
      .from('daily_entries')
      .select('booker_id')
      .eq('id', entryId)
      .maybeSingle();

    const bookerId = entryData?.booker_id;

    const { error } = await supabase
      .from('daily_entries')
      .delete()
      .eq('id', entryId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Cache Revalidation
    revalidatePath('/dashboard');
    revalidatePath('/bookers');
    if (bookerId) {
      revalidatePath(`/bookers/${bookerId}`);
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error' };
  }
}

/**
 * Fetches entries for a specific booker within a date range (ordered by entry_date).
 */
export async function fetchEntries(
  bookerId: string,
  dateRangeStart: string,
  dateRangeEnd: string
): Promise<ActionResponse<DailyEntryRow[]>> {
  try {
    const { profile } = await getUserSession();

    // RLS boundary check
    if (profile.role === 'booker' && profile.booker_id !== bookerId) {
      return { success: false, error: 'Access Denied: Cannot view other bookers records' };
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('booker_id', bookerId)
      .gte('entry_date', dateRangeStart)
      .lte('entry_date', dateRangeEnd)
      .order('entry_date', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error' };
  }
}

/**
 * Owner-only: fetches entries across all bookers.
 */
export async function fetchAllEntries(
  dateRangeStart: string,
  dateRangeEnd: string,
  bookerIdFilter?: string
): Promise<ActionResponse<(DailyEntryRow & { bookers: { name: string } | null })[]>> {
  try {
    const { profile } = await getUserSession();
    if (profile.role !== 'owner') {
      return { success: false, error: 'Access Denied: Owner privilege required' };
    }

    const supabase = createClient();
    let query = supabase
      .from('daily_entries')
      .select('*, bookers(name)')
      .gte('entry_date', dateRangeStart)
      .lte('entry_date', dateRangeEnd);

    if (bookerIdFilter) {
      query = query.eq('booker_id', bookerIdFilter);
    }

    const { data, error } = await query.order('entry_date', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    const typedData = (data as unknown) as (DailyEntryRow & { bookers: { name: string } | null })[];
    return { success: true, data: typedData || [] };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error' };
  }
}
