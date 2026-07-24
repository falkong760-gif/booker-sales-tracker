import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import BookerDetailClientView from './BookerDetailClientView';
import { Database } from '@/types/database.types';

export const dynamic = 'force-dynamic';

type DailyEntryRow = Database['public']['Tables']['daily_entries']['Row'];
type BookerRow = Database['public']['Tables']['bookers']['Row'];

interface BookerDetailPageProps {
  params: {
    bookerId: string;
  };
}

export default async function BookerDetailPage({ params }: BookerDetailPageProps) {
  const { bookerId } = params;
  const supabase = createClient();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isDummy = !url || url.includes('placeholder') || url.includes('dummy');

  let profile = null;

  if (isDummy) {
    profile = { role: 'owner' };
  } else {
    // 1. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      redirect('/login');
    }

    // 2. Fetch user role and profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      redirect('/login');
    }
    profile = userProfile;
  }

  // Defensive fallback check: only owners should view this page
  if (profile.role !== 'owner') {
    redirect('/dashboard');
  }

  let booker: BookerRow | null = null;
  let entries: DailyEntryRow[] = [];

  if (isDummy) {
    // Mock data for development / testing without live DB
    booker = {
      id: bookerId,
      name: 'Hammad Khan (Demo)',
      phone: '+92 300 1234567',
      email: 'hammad.khan@example.com',
      status: 'active',
      created_at: new Date().toISOString(),
    };

    entries = [
      {
        id: 'e1',
        booker_id: bookerId,
        entry_date: '2024-10-10',
        sale_amount: 150000,
        deposit_amount: 120000,
        shortfall: 30000,
        remarks: 'Partial deposit made',
        created_at: new Date().toISOString(),
      },
      {
        id: 'e2',
        booker_id: bookerId,
        entry_date: '2024-10-11',
        sale_amount: 200000,
        deposit_amount: 220000,
        shortfall: -20000,
        remarks: 'Paid extra to adjust balance',
        created_at: new Date().toISOString(),
      },
    ];
  } else {
    // Fetch from live database
    const { data: bookerData, error: bookerError } = await supabase
      .from('bookers')
      .select('*')
      .eq('id', bookerId)
      .maybeSingle();

    if (bookerError || !bookerData) {
      redirect('/bookers');
    }

    booker = bookerData;

    const { data: entriesData, error: entriesError } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('booker_id', bookerId)
      .order('entry_date', { ascending: false });

    entries = entriesError || !entriesData ? [] : entriesData;
  }

  return (
    <BookerDetailClientView
      booker={booker}
      initialEntries={entries}
    />
  );
}
