import React from 'react';

export default function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 dark:bg-zinc-800 rounded-2xl" />
          <div className="h-4 w-40 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
        </div>
        <div className="flex gap-3">
          <div className="h-11 w-32 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-11 w-32 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
        </div>
      </div>

      {/* Summary Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white/30 dark:bg-black/20 border border-white/40 dark:border-white/10 p-6 rounded-3xl backdrop-blur-xl h-36 flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div className="h-4 w-24 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
              <div className="h-8 w-8 bg-slate-200 dark:bg-zinc-800 rounded-full" />
            </div>
            <div className="self-end h-8 w-36 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
          </div>
        ))}
      </div>

      {/* Booker List & Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Booker List Skeleton */}
        <div className="lg:col-span-2 space-y-4">
          <div className="h-6 w-36 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white/30 dark:bg-black/20 border border-white/40 dark:border-white/10 p-5 rounded-2xl flex justify-between items-center h-20"
              >
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
                  <div className="h-3.5 w-48 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
                </div>
                <div className="h-6 w-24 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Column: Quick Actions Placeholder */}
        <div className="space-y-4">
          <div className="h-6 w-32 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
          <div className="bg-white/30 dark:bg-black/20 border border-white/40 dark:border-white/10 p-6 rounded-3xl backdrop-blur-xl h-44" />
        </div>
      </div>
    </div>
  );
}
