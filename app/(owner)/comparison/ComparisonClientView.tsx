'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar as CalendarIcon,
  TrendingUp,
  ArrowRight,
  AlertCircle,
  TrendingUp as TrendIcon,
  Table as TableIcon,
  FileText
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
} from 'recharts';
import { Database } from '@/types/database.types';

type DailyEntryRow = Database['public']['Tables']['daily_entries']['Row'];
type BookerRow = Database['public']['Tables']['bookers']['Row'];
type ComparisonEntry = DailyEntryRow & { bookers: { name: string } | null };

interface ComparisonClientViewProps {
  allEntries: ComparisonEntry[];
  bookers: BookerRow[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { color?: string; stroke?: string; name: string; value: number }[];
  label?: string;
}

export default function ComparisonClientView({ allEntries, bookers }: ComparisonClientViewProps) {
  const now = new Date();
  const todayLocalStr = now.toLocaleDateString('en-CA'); // "YYYY-MM-DD"
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA');

  // Selected date ranges
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(todayLocalStr);
  const [dateErrors, setDateErrors] = useState<string[]>([]);

  // Dark mode tracking for Recharts colors
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Format currency with en-IN lakh style notation (e.g. "Rs. 8,00,000")
  const formattedCurrency = (val: number) => {
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
    return formatter.format(val).replace('₹', 'Rs. ');
  };

  // Helper to generate full calendar dates in range [S, E]
  const getDatesInRange = (startStr: string, endStr: string): string[] => {
    const dates: string[] = [];
    const start = new Date(startStr);
    const end = new Date(endStr);
    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toLocaleDateString('en-CA'));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  // 1. DATE BOUNDS VALIDATION
  useEffect(() => {
    const errors: string[] = [];
    if (!startDate) {
      errors.push('Start Date is required.');
    }
    if (!endDate) {
      errors.push('End Date is required.');
    }
    if (startDate && endDate && startDate > endDate) {
      errors.push('Start Date cannot be after End Date.');
    }
    if (endDate && endDate > todayLocalStr) {
      errors.push('End Date cannot be in the future.');
    }
    setDateErrors(errors);
  }, [startDate, endDate, todayLocalStr]);

  // If there are date validation errors, default to current month boundaries internally for safe mapping
  const activeStart = dateErrors.length === 0 ? startDate : defaultStart;
  const activeEnd = dateErrors.length === 0 ? endDate : todayLocalStr;

  // --- COMPUTE ACTIVE BOOKER METRICS ---
  // A. Sales & Deposits are strictly scoped to the selected range [startDate, endDate].
  // B. Pending Balance is ALL-TIME cumulative (from '1970-01-01' up to activeEnd).
  // C. Filter to include active bookers only. Sorted by highest ALL-TIME pending balance descending.
  const activeBookerMetrics = bookers
    .filter((b) => b.status === 'active')
    .map((b) => {
      // All-time entries for this booker
      const bAllTimeEntries = allEntries.filter((e) => e.booker_id === b.id);
      const allTimePending = bAllTimeEntries.reduce(
        (acc, curr) => acc + (Number(curr.sale_amount) - Number(curr.deposit_amount)),
        0
      );

      // Scoped entries inside current range
      const bScopedEntries = bAllTimeEntries.filter(
        (e) => e.entry_date >= activeStart && e.entry_date <= activeEnd
      );
      const scopedSales = bScopedEntries.reduce((acc, curr) => acc + Number(curr.sale_amount), 0);
      const scopedDeposits = bScopedEntries.reduce((acc, curr) => acc + Number(curr.deposit_amount), 0);

      return {
        booker: b,
        allTimePending,
        scopedSales,
        scopedDeposits,
      };
    })
    .sort((a, b) => b.allTimePending - a.allTimePending);

  // --- PRE-COMPUTE ROLLING MAP OF COMPANY-WIDE BALANCE ---
  // To compute the true total company pending balance "as of" any date for both active and inactive bookers.
  const uniqueDbDates = Array.from(new Set(allEntries.map((e) => e.entry_date))).sort();
  const runningSumMap: Record<string, number> = {};
  let rollingShortfallTotal = 0;
  uniqueDbDates.forEach((d) => {
    const dailyShortfall = allEntries
      .filter((e) => e.entry_date === d)
      .reduce((acc, curr) => acc + (Number(curr.sale_amount) - Number(curr.deposit_amount)), 0);
    rollingShortfallTotal += dailyShortfall;
    runningSumMap[d] = rollingShortfallTotal;
  });

  const getCumulativeSumAsOf = (dateStr: string): number => {
    let lastSum = 0;
    for (let i = 0; i < uniqueDbDates.length; i++) {
      const d = uniqueDbDates[i];
      if (d <= dateStr) {
        lastSum = runningSumMap[d];
      } else {
        break;
      }
    }
    return lastSum;
  };

  // --- COMPUTE TREND LINE POINTS & GRANULARITY SNAPSHOTS ---
  const startDateObj = new Date(activeStart);
  const endDateObj = new Date(activeEnd);
  const diffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  let granularity: 'daily' | 'weekly' | 'monthly' = 'daily';
  if (diffDays >= 45 && diffDays <= 180) {
    granularity = 'weekly';
  } else if (diffDays > 180) {
    granularity = 'monthly';
  }

  interface TrendPoint {
    date: string;
    'Total Pending Balance': number;
    label: string;
  }

  const trendPoints: TrendPoint[] = [];

  if (granularity === 'daily') {
    const allCalendarDates = getDatesInRange(activeStart, activeEnd);
    allCalendarDates.forEach((d) => {
      trendPoints.push({
        date: d,
        'Total Pending Balance': getCumulativeSumAsOf(d),
        label: d.substring(5), // "MM-DD" label
      });
    });
  } else if (granularity === 'weekly') {
    const allCalendarDates = getDatesInRange(activeStart, activeEnd);
    allCalendarDates.forEach((d) => {
      const dObj = new Date(d);
      const isSaturday = dObj.getDay() === 6;
      const isLast = d === activeEnd;
      if (isSaturday || isLast) {
        trendPoints.push({
          date: d,
          'Total Pending Balance': getCumulativeSumAsOf(d),
          label: `Wk ${d.substring(5)}`,
        });
      }
    });
  } else {
    // Monthly end-of-period snapshots
    const allCalendarDates = getDatesInRange(activeStart, activeEnd);
    allCalendarDates.forEach((d, idx) => {
      const dObj = new Date(d);
      const nextDateStr = allCalendarDates[idx + 1];
      let isMonthEnd = false;
      if (nextDateStr) {
        const nextObj = new Date(nextDateStr);
        isMonthEnd = dObj.getMonth() !== nextObj.getMonth();
      } else {
        isMonthEnd = true;
      }

      if (isMonthEnd) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        trendPoints.push({
          date: d,
          'Total Pending Balance': getCumulativeSumAsOf(d),
          label: `${monthNames[dObj.getMonth()]} ${dObj.getFullYear()}`,
        });
      }
    });
  }

  // Bar Chart Data mapping
  const barChartData = activeBookerMetrics.map((m) => ({
    name: m.booker.name,
    Sales: m.scopedSales,
    Deposits: m.scopedDeposits,
  }));

  // Visual Colors Mapping
  const salesColor = isDark ? '#2D6A94' : '#0F3D5C';
  const depositsColor = isDark ? '#14B8A6' : '#0E8A7D';
  const trendColor = isDark ? '#10B981' : '#059669';

  // Custom Y-Axis tick formatting to handle large Lakhs and negative shortfalls correctly
  const formatYAxisTick = (val: number) => {
    if (val === 0) return 'Rs. 0';
    const isNeg = val < 0;
    const absVal = Math.abs(val);
    let formatted = '';
    if (absVal >= 10000000) {
      formatted = `${(absVal / 10000000).toFixed(1)}Cr`;
    } else if (absVal >= 100000) {
      formatted = `${(absVal / 100000).toFixed(1)}L`;
    } else if (absVal >= 1000) {
      formatted = `${(absVal / 1000).toFixed(0)}K`;
    } else {
      formatted = absVal.toString();
    }
    return isNeg ? `-Rs. ${formatted}` : `Rs. ${formatted}`;
  };

  // Custom Glassmorphism Tooltip Component
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/40 dark:bg-zinc-950/70 backdrop-blur-xl border border-white/40 dark:border-white/10 p-3.5 rounded-xl shadow-lg text-xs space-y-2 font-bold animate-fade-in z-50">
          <p className="text-slate-gray dark:text-gray-400 font-black">{label}</p>
          <div className="space-y-1.5">
            {payload.map((entry, idx) => {
              const itemColor = entry.color || entry.stroke;
              return (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: itemColor }} />
                  <span className="text-charcoal dark:text-white font-bold">
                    {entry.name}: <span className="font-mono">{formattedCurrency(Number(entry.value))}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto relative overflow-hidden">
      {/* Background visual blurred orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-navy/5 dark:bg-navy/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal/5 dark:bg-teal/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header View */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-up" style={{ animationDelay: '50ms' }}>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-charcoal dark:text-white flex items-center gap-3">
            <Users className="text-teal" size={32} />
            Bookers Comparison
          </h1>
          <p className="text-slate-gray dark:text-gray-400 mt-1 font-medium">
            Analyze relative performance, scoped range sales, and lifetime company-wide pending deficits.
          </p>
        </div>

        {/* Dynamic Date Pickers Wrapper */}
        <div className="bg-white/40 dark:bg-zinc-900/40 p-3 rounded-2xl border border-border-gray/30 dark:border-white/5 backdrop-blur-md flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarIcon size={16} className="text-slate-gray" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 bg-white/80 dark:bg-zinc-950 border border-border-gray/30 dark:border-white/10 rounded-xl text-xs focus:outline-none text-charcoal dark:text-white"
            />
          </div>
          <span className="text-slate-gray text-xs font-bold">to</span>
          <div className="flex items-center gap-2">
            <CalendarIcon size={16} className="text-slate-gray" />
            <input
              type="date"
              value={endDate}
              max={todayLocalStr}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 bg-white/80 dark:bg-zinc-950 border border-border-gray/30 dark:border-white/10 rounded-xl text-xs focus:outline-none text-charcoal dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Date Validation Warnings Banner */}
      {dateErrors.length > 0 && (
        <div className="p-4 rounded-xl bg-danger-red/10 border border-danger-red/20 text-danger-red text-xs font-bold flex flex-col gap-1.5 animate-fade-in">
          <div className="flex items-center gap-2 font-black tracking-tight mb-0.5">
            <AlertCircle size={16} className="shrink-0" />
            <span>Invalid Date Settings (Reverting Internally to Default Range)</span>
          </div>
          <ul className="list-disc list-inside space-y-1 font-medium pl-1 text-[11px] opacity-90 leading-relaxed">
            {dateErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Performance Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
        <div className="bg-white/40 dark:bg-zinc-900/40 border border-border-gray/30 dark:border-white/10 p-5 rounded-3xl backdrop-blur-md shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-gray dark:text-gray-400">Scoped Range Total Sales</span>
          <div className="text-2xl font-black text-charcoal dark:text-white mt-1">
            {formattedCurrency(activeBookerMetrics.reduce((acc, curr) => acc + curr.scopedSales, 0))}
          </div>
        </div>
        <div className="bg-white/40 dark:bg-zinc-900/40 border border-border-gray/30 dark:border-white/10 p-5 rounded-3xl backdrop-blur-md shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-gray dark:text-gray-400">Scoped Range Total Deposits</span>
          <div className="text-2xl font-black text-charcoal dark:text-white mt-1">
            {formattedCurrency(activeBookerMetrics.reduce((acc, curr) => acc + curr.scopedDeposits, 0))}
          </div>
        </div>
        <div className="bg-white/40 dark:bg-zinc-900/40 border border-border-gray/30 dark:border-white/10 p-5 rounded-3xl backdrop-blur-md shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-gray dark:text-gray-400">True Company Outstanding (All-Time)</span>
          <div className="text-2xl font-black mt-1 text-danger-red">
            {formattedCurrency(getCodableCompanyAllTimePending(allEntries))}
          </div>
        </div>
      </div>

      {/* Primary Analytics Section: Side-by-Side Charts (Entrance: 150ms) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-up" style={{ animationDelay: '150ms' }}>

        {/* Sales vs Deposits Scoped Bar Chart */}
        <div className="bg-white/40 dark:bg-zinc-900/40 border border-border-gray/30 dark:border-white/10 p-6 rounded-3xl backdrop-blur-md shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-black text-charcoal dark:text-white flex items-center gap-2">
                <TrendIcon className="text-teal" size={18} />
                Sales vs Deposits Scoped Comparison
              </h2>
              <p className="text-xs text-slate-gray dark:text-gray-400 font-bold mt-0.5">
                Active bookers sorted by lifetime outstanding deficit (highest to lowest)
              </p>
            </div>
            {activeBookerMetrics.length > 0 && (
              <div className="flex gap-2 text-[9px] font-black uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-navy dark:text-cyan-400">
                  <span className="w-2.5 h-1.5 rounded-full" style={{ backgroundColor: salesColor }} />
                  Sales
                </span>
                <span className="flex items-center gap-1.5 text-teal dark:text-teal-400">
                  <span className="w-2.5 h-1.5 rounded-full" style={{ backgroundColor: depositsColor }} />
                  Deposits
                </span>
              </div>
            )}
          </div>

          {activeBookerMetrics.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-gray/50 border border-dashed border-border-gray/20 dark:border-white/5 rounded-2xl">
              <FileText size={40} className="mb-2 opacity-50 text-teal animate-pulse" />
              <span className="text-sm font-bold">No active booker metrics available</span>
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#FFFFFF' : '#000000'} strokeOpacity={0.08} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={10} tick={{ fill: isDark ? '#9CA3AF' : '#6B7280' }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tick={{ fill: isDark ? '#9CA3AF' : '#6B7280' }} tickLine={false} axisLine={false} tickFormatter={formatYAxisTick} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Sales" fill={salesColor} radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={650} />
                  <Bar dataKey="Deposits" fill={depositsColor} radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={650} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Company-Wide Cumulative Outstanding Balance Trend Line */}
        <div className="bg-white/40 dark:bg-zinc-900/40 border border-border-gray/30 dark:border-white/10 p-6 rounded-3xl backdrop-blur-md shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-black text-charcoal dark:text-white flex items-center gap-2">
              <TrendingUp className="text-teal" size={18} />
              Company-Wide Pending Balance Trend
            </h2>
            <p className="text-xs text-slate-gray dark:text-gray-400 font-bold mt-0.5">
              Cumulative lifetime outstanding tracker ({granularity} snapshots, both active and inactive bookers)
            </p>
          </div>

          {trendPoints.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-gray/50 border border-dashed border-border-gray/20 dark:border-white/5 rounded-2xl">
              <FileText size={40} className="mb-2 opacity-50 text-teal animate-pulse" />
              <span className="text-sm font-bold">No historical data available for line mapping</span>
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendPoints} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#FFFFFF' : '#000000'} strokeOpacity={0.08} />
                  <XAxis dataKey="label" stroke="#888888" fontSize={10} tick={{ fill: isDark ? '#9CA3AF' : '#6B7280' }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tick={{ fill: isDark ? '#9CA3AF' : '#6B7280' }} tickLine={false} axisLine={false} tickFormatter={formatYAxisTick} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="Total Pending Balance"
                    stroke={trendColor}
                    strokeWidth={3}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={650}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* Booker Ranking Performance Table (Entrance: 200ms) */}
      <div className="bg-white/40 dark:bg-zinc-900/40 border border-border-gray/30 dark:border-white/10 p-6 rounded-3xl backdrop-blur-md shadow-sm animate-fade-up" style={{ animationDelay: '200ms' }}>
        <h2 className="text-xl font-black text-charcoal dark:text-white flex items-center gap-2 mb-6">
          <TableIcon className="text-teal" size={20} />
          Active Bookers Ranking
        </h2>

        {activeBookerMetrics.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-border-gray/30 dark:border-white/5 rounded-2xl">
            <Users size={40} className="mx-auto text-slate-gray/40 mb-3" />
            <h4 className="font-extrabold text-charcoal dark:text-white">No active bookers found</h4>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border-gray/35 dark:border-white/5">
            <table className="w-full text-left text-sm">
              <thead className="bg-border-gray/30 dark:bg-zinc-950/60 text-xs font-black uppercase tracking-wider text-slate-gray dark:text-gray-400">
                <tr>
                  <th className="px-5 py-4 text-center w-16">Rank</th>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4 text-right">Range Sales</th>
                  <th className="px-5 py-4 text-right">Range Deposits</th>
                  <th className="px-5 py-4 text-right">Pending Balance (All-Time)</th>
                  <th className="px-5 py-4 text-center w-24">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray/25 dark:divide-white/5">
                {activeBookerMetrics.map((row, index) => {
                  const rank = index + 1;
                  const isHighShortfall = row.allTimePending > 0;

                  return (
                    <tr
                      key={row.booker.id}
                      className="hover:bg-white/20 dark:hover:bg-zinc-900/10 cursor-pointer transition-colors"
                    >
                      {/* Rank Indicator Badge */}
                      <td className="px-5 py-4 text-center font-black">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs ${
                          rank === 1
                            ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50'
                            : rank === 2
                            ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            : rank === 3
                            ? 'bg-amber-700/10 text-amber-800 dark:text-amber-600'
                            : 'bg-border-gray/20 text-slate-gray dark:text-gray-400'
                        }`}>
                          {rank}
                        </span>
                      </td>

                      {/* Name / Link to Booker Details */}
                      <td className="px-5 py-4 font-extrabold text-charcoal dark:text-white">
                        <Link href={`/bookers/${row.booker.id}`} className="hover:text-teal hover:underline transition">
                          {row.booker.name}
                        </Link>
                      </td>

                      {/* Scoped Sales */}
                      <td className="px-5 py-4 text-right font-medium text-charcoal dark:text-white">
                        {formattedCurrency(row.scopedSales)}
                      </td>

                      {/* Scoped Deposits */}
                      <td className="px-5 py-4 text-right font-medium text-charcoal dark:text-white">
                        {formattedCurrency(row.scopedDeposits)}
                      </td>

                      {/* All-time Pending Shortfall / Good Standing Balance */}
                      <td className="px-5 py-4 text-right font-black">
                        <span className={isHighShortfall ? 'text-danger-red' : 'text-success-green'}>
                          {formattedCurrency(row.allTimePending)}
                        </span>
                      </td>

                      {/* Row Action Panel Arrow Link */}
                      <td className="px-5 py-4 text-center">
                        <Link
                          href={`/bookers/${row.booker.id}`}
                          className="inline-flex p-2 hover:bg-teal/10 hover:text-teal rounded-lg text-slate-gray dark:text-gray-400 transition"
                          title="View detailed performance view"
                        >
                          <ArrowRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

// Inline helper to compute combined lifetime outstanding shortfall balance representing true company-wide metrics
function getCodableCompanyAllTimePending(entries: ComparisonEntry[]): number {
  return entries.reduce((acc, curr) => acc + (Number(curr.sale_amount) - Number(curr.deposit_amount)), 0);
}
