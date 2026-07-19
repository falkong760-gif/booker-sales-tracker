'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createEntry, updateEntry, deleteEntry, fetchEntries, fetchAllEntries } from '@/app/actions/entries';
import { createBooker } from '@/app/actions/bookers';
import { calculateRunningBalance, getShortfallStatus } from '@/lib/calculations';
import { User } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

// Force dynamic rendering to prevent prerendering failure when environment variables are missing during build.
export const dynamic = 'force-dynamic';

type UserProfile = Database['public']['Tables']['users']['Row'];
type DailyEntryRow = Database['public']['Tables']['daily_entries']['Row'] & {
  bookers?: { name: string } | null;
  running_balance?: number;
};

interface CreateBookerSuccessData {
  booker: Database['public']['Tables']['bookers']['Row'];
  tempPassword: string;
}

export default function BackendTestPage() {
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);

  // Authentication Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Create Booker Fields
  const [bookerName, setBookerName] = useState('');
  const [bookerPhone, setBookerPhone] = useState('');
  const [bookerEmail, setBookerEmail] = useState('');
  const [createdBookerResult, setCreatedBookerResult] = useState<unknown | null>(null);

  // Daily Entry Fields
  const [entryBookerId, setEntryBookerId] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [saleAmount, setSaleAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [entryRemarks, setEntryRemarks] = useState('');
  const [entryResult, setEntryResult] = useState<unknown | null>(null);

  // Fetch List Fields
  const [fetchBookerId, setFetchBookerId] = useState('');
  const [fetchStart, setFetchStart] = useState('2023-10-01');
  const [fetchEnd, setFetchEnd] = useState('2023-10-31');
  const [fetchedEntries, setFetchedEntries] = useState<DailyEntryRow[]>([]);
  const [fetchError, setFetchError] = useState('');

  // Initialize Supabase safely in client-side effect
  useEffect(() => {
    setSupabase(createClient());
  }, []);

  // Loaded user session status checker
  const refreshSession = useCallback(async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      setCurrentProfile(profile);
      if (profile?.booker_id) {
        setEntryBookerId(profile.booker_id);
        setFetchBookerId(profile.booker_id);
      }
    } else {
      setCurrentProfile(null);
    }
  }, [supabase]);

  useEffect(() => {
    if (supabase) {
      refreshSession();
    }
  }, [supabase, refreshSession]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
    } else {
      await refreshSession();
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    await refreshSession();
  };

  const handleCreateBooker = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatedBookerResult(null);
    const res = await createBooker(bookerName, bookerPhone, bookerEmail);
    setCreatedBookerResult(res);
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setEntryResult(null);
    const res = await createEntry(
      entryBookerId,
      entryDate,
      parseFloat(saleAmount),
      parseFloat(depositAmount),
      entryRemarks
    );
    setEntryResult(res);
  };

  const handleUpdateEntry = async (entryId: string, sale: number, dep: number, rem: string) => {
    const res = await updateEntry(entryId, sale, dep, rem);
    alert(res.success ? 'Audit-logged update successful!' : `Error: ${res.error}`);
    handleFetchEntries();
  };

  const handleDeleteEntry = async (entryId: string) => {
    const res = await deleteEntry(entryId);
    alert(res.success ? 'Deletion successful!' : `Error: ${res.error}`);
    handleFetchEntries();
  };

  const handleFetchEntries = async () => {
    setFetchError('');
    setFetchedEntries([]);
    let res;
    if (currentProfile?.role === 'owner') {
      res = await fetchAllEntries(fetchStart, fetchEnd, fetchBookerId || undefined);
    } else {
      res = await fetchEntries(fetchBookerId, fetchStart, fetchEnd);
    }

    if (res.success && res.data) {
      // Calculate live running cumulative shortfall balance
      const computed = calculateRunningBalance(res.data);
      setFetchedEntries(computed);
    } else {
      setFetchError(res.error || 'Failed to fetch');
    }
  };

  // Safe cast helper for results
  const getCreatedBookerData = () => {
    if (!createdBookerResult) return null;
    const r = createdBookerResult as { success: boolean; error?: string; data?: CreateBookerSuccessData };
    return r;
  };

  const getEntryResultData = () => {
    if (!entryResult) return null;
    const r = entryResult as { success: boolean; error?: string; data?: unknown };
    return r;
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8 bg-off-white min-h-screen text-charcoal">
      <div className="border-b border-border-gray pb-4">
        <span className="bg-warning-amber text-white font-mono px-3 py-1 rounded text-xs uppercase tracking-wider font-bold">
          Temporary Backend Test Playground
        </span>
        <h1 className="text-3xl font-extrabold text-navy mt-2">Phase 3 Testing Panel</h1>
        <p className="text-slate-gray mt-1">Directly execute and verify real database, trigger, RLS, and server actions.</p>
      </div>

      {/* Auth Section */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-border-gray space-y-4">
        <h2 className="text-xl font-bold text-navy">1. Authenticate (Supabase Email/Password)</h2>
        {currentUser ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-success-green">Logged In Successfully!</p>
            <div className="bg-off-white p-4 rounded text-xs font-mono space-y-1">
              <div>User ID: {currentUser.id}</div>
              <div>Email: {currentUser.email}</div>
              <div>Role profile: <span className="font-bold underline">{currentProfile?.role || 'loading...'}</span></div>
              {currentProfile?.booker_id && <div>Bound Booker ID: {currentProfile.booker_id}</div>}
            </div>
            <button onClick={handleSignOut} className="bg-danger-red text-white font-medium text-sm px-4 py-2 rounded-md hover:opacity-90">
              Sign Out
            </button>
          </div>
        ) : (
          <form onSubmit={handleSignIn} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-gray">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full mt-1 border border-border-gray p-2 rounded text-sm" placeholder="owner@example.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-gray">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full mt-1 border border-border-gray p-2 rounded text-sm" placeholder="••••••••" />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-navy text-white font-semibold text-sm py-2 rounded-md hover:bg-teal">
                Sign In
              </button>
            </div>
            {authError && <div className="md:col-span-3 text-sm text-danger-red font-semibold">{authError}</div>}
          </form>
        )}
      </section>

      {/* Create Booker Section (Owner-only) */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-border-gray space-y-4">
        <h2 className="text-xl font-bold text-navy">2. Create New Booker (Owner Only)</h2>
        <form onSubmit={handleCreateBooker} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-gray">Full Name</label>
            <input type="text" value={bookerName} onChange={(e) => setBookerName(e.target.value)} required className="w-full mt-1 border border-border-gray p-2 rounded text-sm" placeholder="Jane Doe" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-gray">Phone Number</label>
            <input type="text" value={bookerPhone} onChange={(e) => setBookerPhone(e.target.value)} className="w-full mt-1 border border-border-gray p-2 rounded text-sm" placeholder="+1234567" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-gray">Login Email</label>
            <input type="email" value={bookerEmail} onChange={(e) => setBookerEmail(e.target.value)} required className="w-full mt-1 border border-border-gray p-2 rounded text-sm" placeholder="jane@example.com" />
          </div>
          <div className="md:col-span-3">
            <button type="submit" className="bg-navy text-white font-semibold text-sm px-6 py-2 rounded-md hover:bg-teal">
              Create Booker & Auth User
            </button>
          </div>
        </form>

        {getCreatedBookerData() && (
          <div className="bg-off-white p-4 rounded text-xs font-mono space-y-2">
            <div>Success: <span className={getCreatedBookerData()?.success ? "text-success-green font-bold" : "text-danger-red font-bold"}>{String(getCreatedBookerData()?.success)}</span></div>
            {getCreatedBookerData()?.error && <div className="text-danger-red">Error Message: {getCreatedBookerData()?.error}</div>}
            {getCreatedBookerData()?.data && (
              <>
                <div className="text-navy font-bold text-sm bg-yellow-100 p-2 rounded">
                  ⚠️ GENERATED TEMPORARY PASSWORD (SHARE ONCE): {getCreatedBookerData()?.data?.tempPassword}
                </div>
                <div>Booker ID: {getCreatedBookerData()?.data?.booker.id}</div>
                <div>Booker Email: {getCreatedBookerData()?.data?.booker.email}</div>
              </>
            )}
          </div>
        )}
      </section>

      {/* Record Entry Section */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-border-gray space-y-4">
        <h2 className="text-xl font-bold text-navy">3. Create / UPSERT Daily Transaction Entry</h2>
        <form onSubmit={handleCreateEntry} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-gray">Booker ID (UUID)</label>
            <input type="text" value={entryBookerId} onChange={(e) => setEntryBookerId(e.target.value)} required className="w-full mt-1 border border-border-gray p-2 rounded text-sm" placeholder="Paste Booker UUID" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-gray">Transaction Date</label>
            <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required className="w-full mt-1 border border-border-gray p-2 rounded text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-gray">Sale Amount ($)</label>
            <input type="number" step="0.01" value={saleAmount} onChange={(e) => setSaleAmount(e.target.value)} required className="w-full mt-1 border border-border-gray p-2 rounded text-sm" placeholder="0.00" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-gray">Deposit Amount ($)</label>
            <input type="number" step="0.01" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} required className="w-full mt-1 border border-border-gray p-2 rounded text-sm" placeholder="0.00" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase text-slate-gray">Remarks</label>
            <textarea value={entryRemarks} onChange={(e) => setEntryRemarks(e.target.value)} className="w-full mt-1 border border-border-gray p-2 rounded text-sm" placeholder="Add remarks..." />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="bg-navy text-white font-semibold text-sm px-6 py-2 rounded-md hover:bg-teal">
              Execute Upsert Entry
            </button>
          </div>
        </form>

        {getEntryResultData() && (
          <div className="bg-off-white p-4 rounded text-xs font-mono">
            <div>Success: <span className={getEntryResultData()?.success ? "text-success-green font-bold" : "text-danger-red font-bold"}>{String(getEntryResultData()?.success)}</span></div>
            {getEntryResultData()?.error && <div className="text-danger-red">Error Message: {getEntryResultData()?.error}</div>}
            {!!getEntryResultData()?.data && (
              <pre className="mt-2 text-[10px] bg-slate-100 p-2 rounded">{JSON.stringify(getEntryResultData()?.data, null, 2)}</pre>
            )}
          </div>
        )}
      </section>

      {/* Fetch & Listing Section */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-border-gray space-y-4">
        <h2 className="text-xl font-bold text-navy">4. Query & List Entries (with Running Cumulative Shortfall)</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-gray">Booker ID Filter</label>
            <input type="text" value={fetchBookerId} onChange={(e) => setFetchBookerId(e.target.value)} className="w-full mt-1 border border-border-gray p-2 rounded text-sm" placeholder="Booker UUID" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-gray">Start Date</label>
            <input type="date" value={fetchStart} onChange={(e) => setFetchStart(e.target.value)} required className="w-full mt-1 border border-border-gray p-2 rounded text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-gray">End Date</label>
            <input type="date" value={fetchEnd} onChange={(e) => setFetchEnd(e.target.value)} required className="w-full mt-1 border border-border-gray p-2 rounded text-sm" />
          </div>
          <div>
            <button onClick={handleFetchEntries} className="w-full bg-navy text-white font-semibold text-sm py-2 rounded-md hover:bg-teal">
              Fetch & Calculate
            </button>
          </div>
        </div>

        {fetchError && <div className="text-sm text-danger-red font-semibold">{fetchError}</div>}

        {fetchedEntries.length > 0 && (
          <div className="overflow-x-auto pt-4">
            <table className="min-w-full divide-y divide-border-gray">
              <thead className="bg-off-white text-xs font-bold uppercase text-slate-gray">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Sale</th>
                  <th className="px-4 py-2 text-left">Deposit</th>
                  <th className="px-4 py-2 text-left">Shortfall</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Running Balance</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray text-xs">
                {fetchedEntries.map((entry) => {
                  const status = getShortfallStatus(entry.sale_amount, entry.deposit_amount);
                  const statusColors = {
                    shortfall: 'bg-red-100 text-danger-red',
                    excess: 'bg-green-100 text-success-green',
                    'exact match': 'bg-gray-100 text-slate-gray'
                  }[status];

                  return (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-mono">{entry.entry_date}</td>
                      <td className="px-4 py-2 font-semibold">${parseFloat(String(entry.sale_amount)).toFixed(2)}</td>
                      <td className="px-4 py-2 font-semibold">${parseFloat(String(entry.deposit_amount)).toFixed(2)}</td>
                      <td className="px-4 py-2 font-mono">${parseFloat(String(entry.shortfall)).toFixed(2)}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded font-bold capitalize ${statusColors}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-bold text-navy">${(entry.running_balance ?? 0).toFixed(2)}</td>
                      <td className="px-4 py-2 space-x-2">
                        <button
                          onClick={() => {
                            const newSale = prompt('Enter new Sale Amount ($):', String(entry.sale_amount));
                            const newDep = prompt('Enter new Deposit Amount ($):', String(entry.deposit_amount));
                            const newRem = prompt('Enter new Remarks:', entry.remarks || '');
                            if (newSale && newDep) {
                              handleUpdateEntry(entry.id, parseFloat(newSale), parseFloat(newDep), newRem || '');
                            }
                          }}
                          className="text-teal hover:underline font-bold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this entry? (Owner Only)')) {
                              handleDeleteEntry(entry.id);
                            }
                          }}
                          className="text-danger-red hover:underline font-bold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
