'use client';

import React from 'react';

interface BookerDashboardViewProps {
  bookerId: string | null;
}

export default function BookerDashboardView({ bookerId }: BookerDashboardViewProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/5 rounded-3xl p-8 backdrop-blur-xl shadow-glass">
        <h1 className="text-3xl font-black text-navy dark:text-teal tracking-tight">Booker Dashboard</h1>
        <p className="text-slate-gray dark:text-zinc-300 mt-2 font-semibold">
          Welcome to your Booker Sales & Payment Tracker.
        </p>
        <p className="text-xs text-slate-gray/80 dark:text-zinc-400 mt-1 font-mono">
          Booker ID Reference: {bookerId || 'None (Unassigned)'}
        </p>
      </div>
    </div>
  );
}
