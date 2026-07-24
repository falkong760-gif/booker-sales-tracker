import React from 'react';

export default function BookerDetailLoading() {
  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="h-5 w-32 bg-slate-200 dark:bg-zinc-800 rounded-xl" />

      {/* Header Panel Skeleton */}
      <div className="bg-white/30 dark:bg-zinc-900/30 border border-border-gray/30 dark:border-white/10 p-6 md:p-8 rounded-3xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-3">
            <div className="h-9 w-64 bg-slate-200 dark:bg-zinc-800 rounded-2xl" />
            <div className="h-6 w-16 bg-slate-200 dark:bg-zinc-800 rounded-full" />
          </div>
          <div className="flex gap-4">
            <div className="h-4 w-40 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
            <div className="h-4 w-32 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-md pt-2">
            <div className="h-14 bg-slate-200/50 dark:bg-zinc-950/20 rounded-xl border border-border-gray/10 dark:border-white/5" />
            <div className="h-14 bg-slate-200/50 dark:bg-zinc-950/20 rounded-xl border border-border-gray/10 dark:border-white/5" />
          </div>
        </div>
        <div className="w-full md:w-56 h-24 bg-slate-200/70 dark:bg-zinc-950/30 rounded-2xl border border-border-gray/25 dark:border-white/10" />
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Side: Form Skeleton */}
        <div className="lg:col-span-1">
          <div className="bg-white/30 dark:bg-zinc-900/30 border border-border-gray/30 dark:border-white/10 p-6 rounded-3xl h-[420px] flex flex-col justify-between">
            <div className="h-6 w-44 bg-slate-200 dark:bg-zinc-800 rounded-xl mb-6" />
            <div className="space-y-4 flex-1">
              <div className="h-10 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
              <div className="h-10 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
              <div className="h-10 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
              <div className="h-16 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
            </div>
            <div className="flex gap-3 pt-4">
              <div className="h-12 flex-1 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
              <div className="h-12 flex-1 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Right Side: Charts & Table Skeleton */}
        <div className="lg:col-span-2 space-y-8">

          {/* Charts Row Skeleton */}
          <div className="bg-white/30 dark:bg-zinc-900/30 border border-border-gray/30 dark:border-white/10 p-6 rounded-3xl space-y-4">
            <div className="h-6 w-48 bg-slate-200 dark:bg-zinc-800 rounded-xl mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-slate-200/50 dark:bg-zinc-950/20 border border-border-gray/20 dark:border-white/5 rounded-2xl animate-shimmer" />
              <div className="h-64 bg-slate-200/50 dark:bg-zinc-950/20 border border-border-gray/20 dark:border-white/5 rounded-2xl animate-shimmer" />
            </div>
          </div>

          {/* Ledger Table Skeleton */}
          <div className="bg-white/30 dark:bg-zinc-900/30 border border-border-gray/30 dark:border-white/10 p-6 rounded-3xl space-y-4">
            <div className="h-6 w-36 bg-slate-200 dark:bg-zinc-800 rounded-xl mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white/20 dark:bg-zinc-950/25 border border-border-gray/10 dark:border-white/5 p-4 rounded-xl flex justify-between h-14"
                >
                  <div className="h-4 w-24 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
                  <div className="h-4 w-32 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
                  <div className="h-4 w-16 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
