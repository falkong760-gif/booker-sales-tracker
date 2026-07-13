import React from 'react';
import SaleVsDepositChart from '@/components/charts/SaleVsDepositChart';
import ComparisonChart from '@/components/charts/ComparisonChart';
import PendingTrendChart from '@/components/charts/PendingTrendChart';
import SummaryCard from '@/components/dashboard/SummaryCard';
import PendingBadge from '@/components/dashboard/PendingBadge';
import EntryTable from '@/components/entries/EntryTable';

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-charcoal">Booker Sales Tracker</h1>
          <p className="text-slate-gray mt-1">Welcome back. Here is an overview of today&apos;s activities.</p>
        </div>
        <PendingBadge count={5} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <SummaryCard title="Total Sales" value="$12,450.00" description="+12% from yesterday" />
        <SummaryCard title="Total Deposits" value="$10,200.00" description="Reconciled successfully" />
        <SummaryCard title="Pending Review" value="5" description="Requires immediate owner verification" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-border-gray">
          <h2 className="text-lg font-semibold text-charcoal mb-4">Sales vs Deposits</h2>
          <SaleVsDepositChart />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-border-gray">
          <h2 className="text-lg font-semibold text-charcoal mb-4">Booker Comparison</h2>
          <ComparisonChart />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-border-gray">
          <h2 className="text-lg font-semibold text-charcoal mb-4">Recent Entries</h2>
          <EntryTable />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-border-gray">
          <h2 className="text-lg font-semibold text-charcoal mb-4">Pending Trends</h2>
          <PendingTrendChart />
        </div>
      </div>
    </div>
  );
}
