import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchBookers } from '@/app/actions/bookers';
import { fetchAllEntries } from '@/app/actions/entries';
import ComparisonClientView from './ComparisonClientView';
import { Database } from '@/types/database.types';

export const dynamic = 'force-dynamic';

type DailyEntryRow = Database['public']['Tables']['daily_entries']['Row'];
type BookerRow = Database['public']['Tables']['bookers']['Row'];
type ComparisonEntry = DailyEntryRow & { bookers: { name: string } | null };

async function ComparisonLoader() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isDummy = !url || url.includes('placeholder') || url.includes('dummy');

  let allEntries: ComparisonEntry[] = [];
  let bookers: BookerRow[] = [];

  if (isDummy) {
    // Generate mock high-fidelity dataset for offline sandbox development and test environment checks
    bookers = [
      { id: 'b1', name: 'John Doe', phone: '+92 300 1234567', email: 'john@ledger.com', status: 'active', created_at: new Date().toISOString() },
      { id: 'b2', name: 'Sarah Connor', phone: '+92 312 9876543', email: 'sarah@skynet.com', status: 'active', created_at: new Date().toISOString() },
      { id: 'b3', name: 'Bruce Wayne', phone: '+92 321 4567890', email: 'bruce@waynecorp.com', status: 'active', created_at: new Date().toISOString() },
      { id: 'b4', name: 'Clark Kent', phone: '+92 322 1112223', email: 'clark@dailyplanet.com', status: 'inactive', created_at: new Date().toISOString() },
    ];

    allEntries = [
      // John Doe (Active, Outstanding Balance)
      { id: 'e1', booker_id: 'b1', entry_date: '2024-10-10', sale_amount: 150000, deposit_amount: 120000, shortfall: 30000, remarks: 'Partial deposit', created_at: new Date().toISOString(), bookers: { name: 'John Doe' } },
      { id: 'e2', booker_id: 'b1', entry_date: '2024-10-15', sale_amount: 220000, deposit_amount: 180000, shortfall: 40000, remarks: 'Delivery delays', created_at: new Date().toISOString(), bookers: { name: 'John Doe' } },

      // Sarah Connor (Active, Settled or Excess)
      { id: 'e3', booker_id: 'b2', entry_date: '2024-10-10', sale_amount: 120000, deposit_amount: 120000, shortfall: 0, remarks: 'Exact payment', created_at: new Date().toISOString(), bookers: { name: 'Sarah Connor' } },
      { id: 'e4', booker_id: 'b2', entry_date: '2024-10-15', sale_amount: 80000, deposit_amount: 100000, shortfall: -20000, remarks: 'Extra deposit made', created_at: new Date().toISOString(), bookers: { name: 'Sarah Connor' } },

      // Bruce Wayne (Active, Settled)
      { id: 'e5', booker_id: 'b3', entry_date: '2024-10-15', sale_amount: 500000, deposit_amount: 500000, shortfall: 0, remarks: 'All clear', created_at: new Date().toISOString(), bookers: { name: 'Bruce Wayne' } },

      // Clark Kent (Inactive, Still holds outstanding balance)
      { id: 'e6', booker_id: 'b4', entry_date: '2024-10-01', sale_amount: 100000, deposit_amount: 60000, shortfall: 40000, remarks: 'Unresolved shortfall', created_at: new Date().toISOString(), bookers: { name: 'Clark Kent' } },
    ];
  } else {
    try {
      const [allEntriesRes, bookersRes] = await Promise.all([
        fetchAllEntries('1970-01-01', '2099-12-31'),
        fetchBookers(),
      ]);

      allEntries = allEntriesRes.success && allEntriesRes.data ? allEntriesRes.data : [];
      bookers = bookersRes.success && bookersRes.data ? bookersRes.data : [];
    } catch {
      allEntries = [];
      bookers = [];
    }
  }

  return (
    <ComparisonClientView
      allEntries={allEntries}
      bookers={bookers}
    />
  );
}

export default async function ComparisonPage() {
  const supabase = createClient();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isDummy = !url || url.includes('placeholder') || url.includes('dummy');

  let profile = null;

  if (isDummy) {
    profile = { role: 'owner', booker_id: null };
  } else {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      redirect('/login');
    }

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

  if (profile.role !== 'owner') {
    redirect('/login');
  }

  return (
    <Suspense
      fallback={
        <div className="p-8 space-y-6 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[500px]">
          <div className="w-10 h-10 border-4 border-teal border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-gray dark:text-gray-400">Loading Bookers Comparison Dashboard...</p>
        </div>
      }
    >
      <ComparisonLoader />
    </Suspense>
  );
}
