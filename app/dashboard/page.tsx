import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchBookers } from '@/app/actions/bookers';
import { fetchAllEntries } from '@/app/actions/entries';
import OwnerDashboardView from './OwnerDashboardView';
import BookerDashboardView from './BookerDashboardView';
import DashboardSkeleton from './DashboardSkeleton';

// Force dynamic rendering to prevent static building failures
export const dynamic = 'force-dynamic';

import { Database } from '@/types/database.types';

type DailyEntryRow = Database['public']['Tables']['daily_entries']['Row'];
type BookerRow = Database['public']['Tables']['bookers']['Row'];
type DashboardEntry = DailyEntryRow & { bookers: { name: string } | null };

async function OwnerDashboardLoader() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isDummy = !url || url.includes('placeholder') || url.includes('dummy');

  let monthData: DashboardEntry[] = [];
  let allTimeData: DashboardEntry[] = [];
  let bookersData: BookerRow[] = [];

  if (isDummy) {
    // Generate high-fidelity demo dataset to safely showcase the Owner Dashboard in testing
    bookersData = [
      { id: 'b1', name: 'John Doe', phone: '+92 300 1234567', email: 'john@ledger.com', status: 'active', created_at: new Date().toISOString() },
      { id: 'b2', name: 'Sarah Connor', phone: '+92 312 9876543', email: 'sarah@skynet.com', status: 'active', created_at: new Date().toISOString() },
      { id: 'b3', name: 'Bruce Wayne', phone: '+92 321 4567890', email: 'bruce@waynecorp.com', status: 'active', created_at: new Date().toISOString() },
    ];

    // John Doe: Shortfall balance + Issue on last entry (sale_amount > deposit_amount)
    // Sarah Connor: Good standing / overpaid, no issue on last entry
    // Bruce Wayne: Exact match, no issue on last entry
    allTimeData = [
      // John Doe
      { id: 'e1', booker_id: 'b1', entry_date: '2024-10-10', sale_amount: 150000, deposit_amount: 120000, shortfall: 30000, remarks: 'Partial deposit', created_at: new Date().toISOString(), bookers: { name: 'John Doe' } },
      { id: 'e2', booker_id: 'b1', entry_date: '2024-10-15', sale_amount: 220000, deposit_amount: 180000, shortfall: 40000, remarks: 'Delivery delays', created_at: new Date().toISOString(), bookers: { name: 'John Doe' } },
      // Sarah Connor
      { id: 'e3', booker_id: 'b2', entry_date: '2024-10-10', sale_amount: 120000, deposit_amount: 120000, shortfall: 0, remarks: 'Exact', created_at: new Date().toISOString(), bookers: { name: 'Sarah Connor' } },
      { id: 'e4', booker_id: 'b2', entry_date: '2024-10-15', sale_amount: 80000, deposit_amount: 90000, shortfall: -10000, remarks: 'Extra deposit made', created_at: new Date().toISOString(), bookers: { name: 'Sarah Connor' } },
      // Bruce Wayne
      { id: 'e5', booker_id: 'b3', entry_date: '2024-10-15', sale_amount: 500000, deposit_amount: 500000, shortfall: 0, remarks: 'All clear', created_at: new Date().toISOString(), bookers: { name: 'Bruce Wayne' } },
    ];

    // Month data is a subset representing the current calendar month entries
    monthData = [
      { id: 'e2', booker_id: 'b1', entry_date: '2024-10-15', sale_amount: 220000, deposit_amount: 180000, shortfall: 40000, remarks: 'Delivery delays', created_at: new Date().toISOString(), bookers: { name: 'John Doe' } },
      { id: 'e4', booker_id: 'b2', entry_date: '2024-10-15', sale_amount: 80000, deposit_amount: 90000, shortfall: -10000, remarks: 'Extra deposit made', created_at: new Date().toISOString(), bookers: { name: 'Sarah Connor' } },
      { id: 'e5', booker_id: 'b3', entry_date: '2024-10-15', sale_amount: 500000, deposit_amount: 500000, shortfall: 0, remarks: 'All clear', created_at: new Date().toISOString(), bookers: { name: 'Bruce Wayne' } },
    ];
  } else {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const [monthRes, allTimeRes, bookersRes] = await Promise.all([
        fetchAllEntries(firstDayOfMonth, lastDayOfMonth),
        fetchAllEntries('1970-01-01', '2099-12-31'),
        fetchBookers(),
      ]);

      monthData = monthRes.success && monthRes.data ? monthRes.data : [];
      allTimeData = allTimeRes.success && allTimeRes.data ? allTimeRes.data : [];
      bookersData = bookersRes.success && bookersRes.data ? bookersRes.data : [];
    } catch {
      // Degrade gracefully on any database failure
      bookersData = [];
      allTimeData = [];
      monthData = [];
    }
  }

  return (
    <OwnerDashboardView
      monthEntries={monthData}
      allTimeEntries={allTimeData}
      bookers={bookersData}
    />
  );
}

export default async function DashboardPage() {
  const supabase = createClient();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isDummy = !url || url.includes('placeholder') || url.includes('dummy');

  let profile = null;

  if (isDummy) {
    // Under local development or testing with placeholder variables, mock an owner user profile
    profile = { role: 'owner', booker_id: null };
  } else {
    // 1. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      redirect('/login');
    }

    // 2. Fetch user role and profile from public.users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, booker_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      redirect('/login');
    }
    profile = userProfile;
  }

  if (profile.role === 'owner') {
    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <OwnerDashboardLoader />
      </Suspense>
    );
  } else if (profile.role === 'booker') {
    return <BookerDashboardView bookerId={profile.booker_id} />;
  } else {
    redirect('/login');
  }
}
