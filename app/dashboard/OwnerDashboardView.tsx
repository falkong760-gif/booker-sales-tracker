'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  Wallet,
  AlertCircle,
  UserPlus,
  FileText,
  Search,
  AlertTriangle,
  UserCheck,
  Building,
} from 'lucide-react';
import CountUp from '@/components/dashboard/CountUp';
import { Database } from '@/types/database.types';

type DailyEntryRow = Database['public']['Tables']['daily_entries']['Row'];
type BookerRow = Database['public']['Tables']['bookers']['Row'];

interface OwnerDashboardViewProps {
  monthEntries: (DailyEntryRow & { bookers: { name: string } | null })[];
  allTimeEntries: (DailyEntryRow & { bookers: { name: string } | null })[];
  bookers: BookerRow[];
}

export default function OwnerDashboardView({
  monthEntries,
  allTimeEntries,
  bookers,
}: OwnerDashboardViewProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Get current month name
  const currentMonthName = useMemo(() => {
    return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  }, []);

  // 2. Compute Summary Card Values
  const summaryData = useMemo(() => {
    const totalSale = monthEntries.reduce((acc, curr) => acc + Number(curr.sale_amount || 0), 0);
    const totalDeposit = monthEntries.reduce((acc, curr) => acc + Number(curr.deposit_amount || 0), 0);

    // Cumulative sum of ALL bookers, ALL-TIME (no date filter)
    const allTimeSale = allTimeEntries.reduce((acc, curr) => acc + Number(curr.sale_amount || 0), 0);
    const allTimeDeposit = allTimeEntries.reduce((acc, curr) => acc + Number(curr.deposit_amount || 0), 0);
    const totalPending = allTimeSale - allTimeDeposit;

    return {
      totalSale,
      totalDeposit,
      totalPending: totalPending > 0 ? totalPending : 0, // Pending is shortfall
    };
  }, [monthEntries, allTimeEntries]);

  // 3. Compute Portfolio Balances and Status for each booker
  const bookerPortfolios = useMemo(() => {
    return bookers.map((booker) => {
      // All history entries for this booker
      const bookerEntries = allTimeEntries
        .filter((entry) => entry.booker_id === booker.id)
        .sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());

      // Cumulative shortfall balance
      const balance = bookerEntries.reduce(
        (acc, curr) => acc + (Number(curr.sale_amount || 0) - Number(curr.deposit_amount || 0)),
        0
      );

      // Latest entry (sorted by entry_date descending)
      const latestEntry = bookerEntries[bookerEntries.length - 1] || null;
      const hasIssueOnLastEntry =
        latestEntry && Number(latestEntry.sale_amount || 0) > Number(latestEntry.deposit_amount || 0);

      return {
        ...booker,
        balance,
        latestEntryDate: latestEntry?.entry_date || null,
        hasIssueOnLastEntry,
      };
    });
  }, [bookers, allTimeEntries]);

  // 4. Filter bookers by search query
  const filteredPortfolios = useMemo(() => {
    return bookerPortfolios.filter((portfolio) =>
      portfolio.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [bookerPortfolios, searchQuery]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Upper Dashboard Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-navy dark:text-teal tracking-tight">
            Owner Dashboard
          </h1>
          <p className="text-sm font-bold text-slate-gray dark:text-zinc-300 mt-1">
            Financial oversight and ledger balances for <span className="text-teal dark:text-teal-400 font-extrabold underline">{currentMonthName}</span>.
          </p>
        </div>

        {/* Quick Actions Panel */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/bookers"
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-navy to-teal hover:brightness-110 text-white font-extrabold text-sm shadow-md transition-all duration-200 active:scale-[0.96]"
          >
            <UserPlus size={16} />
            <span>Add Booker</span>
          </Link>
          <Link
            href="/reports"
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl border border-slate-300 dark:border-zinc-800 bg-white/45 dark:bg-black/25 text-charcoal dark:text-white font-extrabold text-sm shadow-sm hover:bg-white/70 dark:hover:bg-zinc-800 transition-all duration-200 active:scale-[0.96]"
          >
            <FileText size={16} />
            <span>View Reports</span>
          </Link>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Sale */}
        <div className="relative overflow-hidden bg-white/20 dark:bg-black/30 border border-white/40 dark:border-white/10 p-6 rounded-3xl backdrop-blur-3xl shadow-glass dark:shadow-glass-dark group hover:border-teal/40 transition-all duration-300">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-[#0F3D5C]/10 dark:bg-[#0F3D5C]/15 blur-2xl group-hover:scale-125 transition-transform duration-500" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-gray dark:text-zinc-400">
                Total Sale
              </p>
              <p className="text-[10px] font-bold text-teal mt-0.5">{currentMonthName} only</p>
            </div>
            <div className="p-3 bg-navy/5 dark:bg-white/5 rounded-2xl text-navy dark:text-teal group-hover:scale-110 transition-transform duration-300">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4 text-right">
            <span className="text-3xl md:text-4xl font-black text-navy dark:text-white tracking-tight">
              <CountUp value={summaryData.totalSale} />
            </span>
          </div>
        </div>

        {/* Card 2: Total Deposit */}
        <div className="relative overflow-hidden bg-white/20 dark:bg-black/30 border border-white/40 dark:border-white/10 p-6 rounded-3xl backdrop-blur-3xl shadow-glass dark:shadow-glass-dark group hover:border-teal/40 transition-all duration-300">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-[#0E8A7D]/10 dark:bg-[#0E8A7D]/15 blur-2xl group-hover:scale-125 transition-transform duration-500" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-gray dark:text-zinc-400">
                Total Deposit
              </p>
              <p className="text-[10px] font-bold text-teal mt-0.5">{currentMonthName} only</p>
            </div>
            <div className="p-3 bg-[#0E8A7D]/5 dark:bg-white/5 rounded-2xl text-[#0E8A7D] group-hover:scale-110 transition-transform duration-300">
              <Wallet size={20} />
            </div>
          </div>
          <div className="mt-4 text-right">
            <span className="text-3xl md:text-4xl font-black text-navy dark:text-white tracking-tight">
              <CountUp value={summaryData.totalDeposit} />
            </span>
          </div>
        </div>

        {/* Card 3: Total Pending (All-time Cumulative shortfall balance) */}
        <div className="relative overflow-hidden bg-white/20 dark:bg-black/30 border border-white/40 dark:border-white/10 p-6 rounded-3xl backdrop-blur-3xl shadow-glass dark:shadow-glass-dark group hover:border-danger-red/30 transition-all duration-300">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-danger-red/10 blur-2xl group-hover:scale-125 transition-transform duration-500" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-gray dark:text-zinc-400">
                Total Pending
              </p>
              <p className="text-[10px] font-bold text-danger-red mt-0.5">All-Time Cumulative</p>
            </div>
            <div className="p-3 bg-danger-red/5 dark:bg-danger-red/10 rounded-2xl text-danger-red group-hover:scale-110 transition-transform duration-300">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="mt-4 text-right">
            <span className="text-3xl md:text-4xl font-black text-danger-red dark:text-red-400 tracking-tight">
              <CountUp value={summaryData.totalPending} />
            </span>
          </div>
        </div>
      </div>

      {/* Main Booker Portfolio List Area */}
      {bookers.length === 0 ? (
        /* Empty State */
        <div className="bg-white/20 dark:bg-black/30 border border-white/40 dark:border-white/10 rounded-3xl p-12 text-center backdrop-blur-3xl shadow-glass space-y-6 max-w-xl mx-auto">
          <div className="inline-flex w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-gray items-center justify-center">
            <Building size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-navy dark:text-white">No active bookers found</h3>
            <p className="text-sm font-semibold text-slate-gray dark:text-zinc-300 max-w-sm mx-auto leading-relaxed">
              Create your very first active booker representative to record sales, track deposits, and monitor ledger shortfalls.
              They will be listed here instantly with real-time outstanding balances.
            </p>
          </div>
          <Link
            href="/bookers"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-navy to-teal hover:brightness-110 text-white font-extrabold text-sm shadow-md transition-all duration-200 active:scale-[0.96]"
          >
            <UserPlus size={16} />
            <span>Add your first booker</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Portfolios list (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg font-black text-navy dark:text-white tracking-tight">
                Active Booker Portfolios ({filteredPortfolios.length})
              </h2>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-gray pointer-events-none">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search bookers..."
                  className="w-full pl-9 pr-4 py-2 bg-white/45 dark:bg-black/35 border border-slate-300 dark:border-zinc-800 rounded-2xl text-xs font-bold text-charcoal dark:text-white placeholder:text-slate-gray dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal transition-all duration-300"
                />
              </div>
            </div>

            {filteredPortfolios.length === 0 ? (
              <div className="p-8 bg-white/20 dark:bg-black/30 border border-white/40 dark:border-white/10 rounded-3xl text-center backdrop-blur-md">
                <p className="text-sm font-bold text-slate-gray">No bookers match &ldquo;{searchQuery}&rdquo;</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPortfolios.map((booker) => {
                  const isShortfall = booker.balance > 0;
                  const absBalance = Math.abs(booker.balance);

                  return (
                    <div
                      key={booker.id}
                      onClick={() => router.push(`/bookers/${booker.id}`)}
                      className="bg-white/20 dark:bg-black/30 border border-white/40 dark:border-white/10 p-5 rounded-3xl backdrop-blur-3xl hover:bg-white/40 dark:hover:bg-zinc-900/45 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal/5 border-l-4 hover:border-l-teal transition-all duration-300 cursor-pointer flex justify-between items-center group"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-sm text-charcoal dark:text-white group-hover:text-teal transition-colors">
                            {booker.name}
                          </span>

                          {/* Alert Badge: Issue on last entry */}
                          {booker.hasIssueOnLastEntry && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-danger-red/10 border border-danger-red/20 text-[9px] font-black text-danger-red animate-pulse">
                              <AlertTriangle size={10} />
                              <span>Issue on last entry</span>
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 text-xs font-semibold text-slate-gray dark:text-zinc-300">
                          <span>{booker.phone || 'No Phone'}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700 hidden sm:inline-block" />
                          <span>{booker.email}</span>
                        </div>
                      </div>

                      <div className="text-right space-y-1 pl-4">
                        <p className={`text-sm font-black leading-none ${
                          isShortfall ? 'text-danger-red' : 'text-success-green'
                        }`}>
                          {isShortfall ? '+' : '-'} Rs. {new Intl.NumberFormat('en-IN').format(absBalance)}
                        </p>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-gray">
                          {isShortfall ? 'shortfall' : 'good standing'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Quick reference guidelines (1/3 width) */}
          <div className="space-y-4">
            <h2 className="text-lg font-black text-navy dark:text-white tracking-tight">
              Ledger Standards
            </h2>
            <div className="bg-white/20 dark:bg-black/30 border border-white/40 dark:border-white/10 p-6 rounded-3xl backdrop-blur-3xl shadow-glass dark:shadow-glass-dark space-y-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-success-green/10 rounded-xl text-success-green">
                  <UserCheck size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-charcoal dark:text-white uppercase tracking-wide">
                    Good Standing (Green)
                  </h4>
                  <p className="text-[11px] text-slate-gray dark:text-zinc-300 font-semibold mt-1 leading-relaxed">
                    Cumulative deposits match or exceed total reported sales. There is no pending shortfall balance.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 border-t border-border-gray/5 pt-4">
                <div className="p-2 bg-danger-red/10 rounded-xl text-danger-red">
                  <AlertCircle size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-charcoal dark:text-white uppercase tracking-wide">
                    Shortfall (Red)
                  </h4>
                  <p className="text-[11px] text-slate-gray dark:text-zinc-300 font-semibold mt-1 leading-relaxed">
                    Represents unpaid credit balance. The booker has recorded more sales than they deposited.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 border-t border-border-gray/5 pt-4">
                <div className="p-2 bg-warning-amber/10 rounded-xl text-warning-amber">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-charcoal dark:text-white uppercase tracking-wide">
                    Last Entry Issue
                  </h4>
                  <p className="text-[11px] text-slate-gray dark:text-zinc-300 font-semibold mt-1 leading-relaxed">
                    Highlighted when a booker&apos;s most recent day of business ended with a shortfall, requiring review.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
