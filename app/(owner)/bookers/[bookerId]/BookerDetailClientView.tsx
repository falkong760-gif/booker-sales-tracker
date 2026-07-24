'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Plus,
  Info,
  TrendingUp,
  FileText,
  Phone,
  Mail,
  Wallet
} from 'lucide-react';
import { createEntry, deleteEntry } from '@/app/actions/entries';
import { calculateRunningBalance } from '@/lib/calculations';
import CountUp from '@/components/dashboard/CountUp';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';
import { Database } from '@/types/database.types';

type DailyEntryRow = Database['public']['Tables']['daily_entries']['Row'];
type BookerRow = Database['public']['Tables']['bookers']['Row'];

interface BookerDetailClientViewProps {
  booker: BookerRow;
  initialEntries: DailyEntryRow[];
}

interface ChartDotProps {
  cx: number;
  cy: number;
  index: number;
}

interface TooltipPayloadItem {
  color?: string;
  stroke?: string;
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

export default function BookerDetailClientView({ booker, initialEntries }: BookerDetailClientViewProps) {
  const [entries, setEntries] = useState<DailyEntryRow[]>(initialEntries);

  // Form State
  const todayLocalStr = new Date().toLocaleDateString('en-CA'); // Gets local YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState(todayLocalStr);
  const [saleAmount, setSaleAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [remarks, setRemarks] = useState('');

  // Form Safeguard State
  const [isOverwriting, setIsOverwriting] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Dark mode detection for Recharts live color swaps
  const [isDark, setIsDark] = useState(false);

  // Highlighting Row State for Animations
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);

  // Delete Action Confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const triggerToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  // Sync theme status on mount and when DOM transitions
  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDark();

    // Use MutationObserver to watch class changes on documentElement (for theme toggle)
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  // Whenever the date changes, trigger the auto-prefill safeguard check
  useEffect(() => {
    const existing = entries.find((e) => e.entry_date === selectedDate);
    if (existing) {
      setSaleAmount(existing.sale_amount.toString());
      setDepositAmount(existing.deposit_amount.toString());
      setRemarks(existing.remarks || '');
      setIsOverwriting(true);
    } else {
      setSaleAmount('');
      setDepositAmount('');
      setRemarks('');
      setIsOverwriting(false);
    }
  }, [selectedDate, entries]);

  // Clean form inputs
  const resetForm = (keepDate: boolean = false) => {
    if (!keepDate) {
      setSelectedDate(todayLocalStr);
    }
    setSaleAmount('');
    setDepositAmount('');
    setRemarks('');
    setIsOverwriting(false);
    setFormErrors([]);
  };

  // Submit Handler
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);

    const errors: string[] = [];
    if (!selectedDate) {
      errors.push('Date is required.');
    }
    if (selectedDate > todayLocalStr) {
      errors.push('Entry date cannot be in the future.');
    }

    const parsedSale = parseFloat(saleAmount);
    const parsedDeposit = parseFloat(depositAmount);

    if (isNaN(parsedSale) || parsedSale < 0) {
      errors.push('Sale Amount must be a positive number or zero.');
    }
    if (isNaN(parsedDeposit) || parsedDeposit < 0) {
      errors.push('Deposit Amount must be a positive number or zero.');
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSaving(true);

    try {
      const res = await createEntry(booker.id, selectedDate, parsedSale, parsedDeposit, remarks);
      if (res.success && res.data) {
        const savedEntry = res.data;
        const isUpdate = entries.some((item) => item.entry_date === savedEntry.entry_date);

        // Update local entries state
        let updatedEntries = [];
        if (isUpdate) {
          updatedEntries = entries.map((item) =>
            item.entry_date === savedEntry.entry_date ? savedEntry : item
          );
          triggerToast('success', `Entry updated for ${savedEntry.entry_date}`);
        } else {
          updatedEntries = [savedEntry, ...entries];
          triggerToast('success', `Entry added for ${savedEntry.entry_date}`);
        }

        // Highlight saved row
        setEntries(updatedEntries);
        setHighlightedRowId(savedEntry.id);
        setTimeout(() => setHighlightedRowId(null), 3000);

        // Keep the saved date in the form so it matches the toast date!
        resetForm(true);
      } else {
        setFormErrors([res.error || 'Failed to save entry.']);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while saving.';
      setFormErrors([msg]);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Handler
  const handleDeleteEntry = async (id: string, date: string) => {
    try {
      const res = await deleteEntry(id);
      if (res.success) {
        setEntries(entries.filter((item) => item.id !== id));
        triggerToast('success', `Entry deleted for ${date}`);
      } else {
        triggerToast('error', res.error || 'Failed to delete entry.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while deleting.';
      triggerToast('error', msg);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  // Calculations for running balance and totals
  const entriesWithRunningBalance = calculateRunningBalance(entries);
  const displayEntries = [...entriesWithRunningBalance].reverse(); // descending for table

  // Compute all-time totals and pending balance
  const totalSales = entries.reduce((acc, curr) => acc + Number(curr.sale_amount), 0);
  const totalDeposits = entries.reduce((acc, curr) => acc + Number(curr.deposit_amount), 0);
  const totalPendingBalance = entries.reduce((acc, curr) => acc + Number(curr.shortfall), 0);

  const formattedCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val).replace('₹', 'Rs. ');
  };

  // Chart Data: Needs to be sorted chronologically ascending
  const chartData = [...entriesWithRunningBalance].map((e) => ({
    date: e.entry_date,
    Sales: Number(e.sale_amount),
    Deposits: Number(e.deposit_amount),
    'Pending Balance': Number(e.running_balance),
  }));

  // EXACT Visual Colors Specification
  const salesColor = isDark ? '#2D6A94' : '#0F3D5C';
  const depositsColor = isDark ? '#14B8A6' : '#0E8A7D';

  // Dynamic color for Pending Balance based on value
  const pendingColor = totalPendingBalance > 0
    ? (isDark ? '#EF4444' : '#DC2626')
    : (isDark ? '#22C55E' : '#16A34A');

  // Custom Dot Renderer
  const renderCustomDot = (color: string) => {
    const ChartDot = (props: unknown) => {
      const p = props as ChartDotProps;
      const isLatest = p.index === chartData.length - 1;

      if (isLatest) {
        return (
          <g key={`dot-latest-${p.index}`}>
            {/* Pulsing Outer Ring */}
            <circle
              cx={p.cx}
              cy={p.cy}
              r={12}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              className="animate-pulse-ring"
            />
            {/* Solid Inner Dot */}
            <circle
              cx={p.cx}
              cy={p.cy}
              r={6}
              fill={color}
              stroke="#FFFFFF"
              strokeWidth={1.5}
              style={{ filter: `drop-shadow(0px 0px 4px ${color}66)` }}
            />
          </g>
        );
      }

      return (
        <circle
          key={`dot-${p.index}`}
          cx={p.cx}
          cy={p.cy}
          r={4}
          fill={color}
          stroke="#FFFFFF"
          strokeWidth={1}
          style={{ filter: `drop-shadow(0px 0px 4px ${color}66)` }}
        />
      );
    };
    ChartDot.displayName = 'ChartDot';
    return ChartDot;
  };

  // Custom Frosted Glass Tooltip
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/40 dark:bg-zinc-950/70 backdrop-blur-xl border border-white/40 dark:border-white/10 p-3.5 rounded-xl shadow-lg text-xs space-y-2 font-bold animate-fade-in">
          <p className="text-slate-gray dark:text-gray-400 font-black">{label}</p>
          <div className="space-y-1.5">
            {payload.map((entry, idx) => {
              // Determine precise color based on series name
              let itemColor = entry.color || entry.stroke;
              if (entry.name === 'Pending Balance') {
                itemColor = entry.value > 0
                  ? (isDark ? '#EF4444' : '#DC2626')
                  : (isDark ? '#22C55E' : '#16A34A');
              }
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
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb / Top Navigation */}
      <div className="animate-fade-up" style={{ animationDelay: '0ms' }}>
        <Link
          href="/bookers"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-gray hover:text-navy dark:text-gray-400 dark:hover:text-teal transition-colors group mb-4"
        >
          <ArrowLeft size={16} className="transform group-hover:-translate-x-1 transition-transform" />
          Back to Bookers
        </Link>
      </div>

      {/* Header Section (Entrance: 0ms delay) */}
      <div
        className="bg-white/40 dark:bg-zinc-900/40 border border-border-gray/30 dark:border-white/10 p-6 md:p-8 rounded-3xl backdrop-blur-md shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 animate-fade-up"
        style={{ animationDelay: '50ms' }}
      >
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-charcoal dark:text-white tracking-tight">
              {booker.name}
            </h1>
            {booker.status === 'active' ? (
              <span className="inline-flex items-center gap-1 bg-success-green/15 text-success-green px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-success-green/20">
                <span className="w-1.5 h-1.5 rounded-full bg-success-green animate-pulse" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-border-gray/85 dark:bg-zinc-800 text-slate-gray dark:text-gray-400 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-border-gray dark:border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-gray" />
                Inactive
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm font-medium text-slate-gray dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Mail size={15} className="opacity-70" />
              <span>{booker.email}</span>
            </div>
            {booker.phone && (
              <div className="flex items-center gap-2">
                <Phone size={15} className="opacity-70" />
                <span>{booker.phone}</span>
              </div>
            )}
          </div>

          {/* Mini Totals Grid */}
          <div className="grid grid-cols-2 gap-4 max-w-md pt-2">
            <div className="bg-white/20 dark:bg-zinc-950/20 p-3 rounded-xl border border-border-gray/10 dark:border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-gray dark:text-gray-500">
                Total Sales
              </span>
              <div className="text-sm font-black text-charcoal dark:text-white mt-0.5">
                {formattedCurrency(totalSales)}
              </div>
            </div>
            <div className="bg-white/20 dark:bg-zinc-950/20 p-3 rounded-xl border border-border-gray/10 dark:border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-gray dark:text-gray-500">
                Total Deposits
              </span>
              <div className="text-sm font-black text-charcoal dark:text-white mt-0.5">
                {formattedCurrency(totalDeposits)}
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Animating Balance Display Card */}
        <div className="w-full md:w-auto p-6 rounded-2xl bg-white/50 dark:bg-zinc-950/40 border border-border-gray/20 dark:border-white/5 flex flex-col justify-center shadow-inner">
          <span className="text-xs uppercase tracking-widest font-black text-slate-gray dark:text-gray-400">
            Current Pending Balance
          </span>
          <div className={`text-3xl font-black mt-1 ${
            totalPendingBalance > 0 ? 'text-danger-red' : 'text-success-green'
          }`}>
            <CountUp value={totalPendingBalance} />
          </div>
          <span className="text-[10px] font-bold text-slate-gray/80 dark:text-gray-500 mt-1">
            Calculated running shortfall
          </span>
        </div>
      </div>

      {/* Toast Banners */}
      {toastMessage && (
        <div className={`p-5 rounded-2xl border backdrop-blur-md animate-fade-in ${
          toastMessage.type === 'success'
            ? 'bg-success-green/10 border-success-green/30 text-success-green'
            : 'bg-danger-red/10 border-danger-red/30 text-danger-red'
        }`}>
          <div className="flex gap-3">
            {toastMessage.type === 'success' ? <CheckCircle2 size={22} className="shrink-0" /> : <AlertCircle size={22} className="shrink-0" />}
            <p className="font-bold text-sm">{toastMessage.text}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Form, History Table, Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Side: Add Entry Form (Entrance: 120ms delay) */}
        <div className="lg:col-span-1 space-y-6 animate-fade-up" style={{ animationDelay: '120ms' }}>
          <div className="bg-white/40 dark:bg-zinc-900/40 border border-border-gray/30 dark:border-white/10 p-6 rounded-3xl backdrop-blur-md shadow-sm">
            <h2 className="text-xl font-black text-charcoal dark:text-white flex items-center gap-2 mb-4">
              <Plus className="text-teal" size={20} />
              {isOverwriting ? 'Update Daily Entry' : 'Add Daily Entry'}
            </h2>

            <form onSubmit={handleSaveEntry} className="space-y-4">
              {formErrors.length > 0 && (
                <div className="p-4 rounded-xl bg-danger-red/10 border border-danger-red/20 text-danger-red text-xs font-bold flex flex-col gap-1.5 animate-fade-in">
                  <div className="flex items-center gap-2 font-black tracking-tight mb-0.5">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>Errors found</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 font-medium pl-1 text-[11px] opacity-90 leading-relaxed">
                    {formErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Date Input */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-charcoal dark:text-gray-300">
                  Entry Date <span className="text-danger-red">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-gray/70" size={16} />
                  <input
                    type="date"
                    required
                    max={todayLocalStr}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-zinc-950 border border-border-gray/30 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-teal text-charcoal dark:text-white"
                  />
                </div>
              </div>

              {/* UX Overwrite Warning Safeguard Notice */}
              {isOverwriting && (
                <div className="p-3.5 bg-warning-amber/10 border border-warning-amber/30 text-warning-amber rounded-xl text-xs font-semibold leading-relaxed flex gap-2.5 animate-fade-in">
                  <Info size={16} className="shrink-0 mt-0.5" />
                  <span>An entry already exists for this date — saving will update it.</span>
                </div>
              )}

              {/* Sale Amount Input */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-charcoal dark:text-gray-300">
                  Sale Amount (Rs.) <span className="text-danger-red">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-gray/70">Rs.</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    placeholder="0"
                    value={saleAmount}
                    onChange={(e) => setSaleAmount(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/50 dark:bg-zinc-950 border border-border-gray/30 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-teal text-charcoal dark:text-white"
                  />
                </div>
              </div>

              {/* Deposit Amount Input */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-charcoal dark:text-gray-300">
                  Deposit Amount (Rs.) <span className="text-danger-red">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-gray/70">Rs.</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    placeholder="0"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/50 dark:bg-zinc-950 border border-border-gray/30 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-teal text-charcoal dark:text-white"
                  />
                </div>
              </div>

              {/* Remarks Field */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-charcoal dark:text-gray-300">
                  Remarks <span className="text-slate-gray font-normal">(Optional)</span>
                </label>
                <textarea
                  placeholder="e.g. Received via bank transfer"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-zinc-950 border border-border-gray/30 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-teal text-charcoal dark:text-white h-20 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => resetForm()}
                  className="flex-1 py-3 px-4 bg-white dark:bg-zinc-900 border border-border-gray/30 dark:border-white/10 text-charcoal dark:text-white rounded-xl font-bold hover:bg-border-gray/10 dark:hover:bg-zinc-800 transition duration-300"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-navy to-teal text-white font-bold rounded-xl hover:shadow-lg transition duration-300 flex justify-center items-center gap-2 transform active:scale-95"
                >
                  {isSaving ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Save Entry'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Charts & History Table (Span 2) */}
        <div className="lg:col-span-2 space-y-8">

          {/* Charts Section (Entrance: 200ms delay) */}
          <div className="space-y-6 animate-fade-up" style={{ animationDelay: '200ms' }}>
            {entries.length === 0 ? (
              <div className="bg-white/40 dark:bg-zinc-900/40 border border-border-gray/30 dark:border-white/10 p-6 rounded-3xl backdrop-blur-md h-64 flex flex-col items-center justify-center border-dashed text-slate-gray/60 dark:text-gray-500">
                <FileText size={40} className="mb-2 opacity-50" />
                <p className="font-bold text-sm">No charts display yet — enter some transactions.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Sale vs Deposit Chart Card */}
                <div className="bg-white/40 dark:bg-zinc-900/40 border border-border-gray/30 dark:border-white/10 p-5 rounded-3xl backdrop-blur-md shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-charcoal dark:text-white flex items-center gap-2">
                      <TrendingUp className="text-teal" size={16} />
                      Sales vs Deposits
                    </h3>
                    {/* Pill legends top-right */}
                    <div className="flex gap-2.5 text-[10px] font-black tracking-wider uppercase">
                      <span className="flex items-center gap-1.5 text-navy dark:text-cyan-400">
                        <span className="w-2.5 h-1.5 rounded-full" style={{ backgroundColor: salesColor }} />
                        Sales
                      </span>
                      <span className="flex items-center gap-1.5 text-teal dark:text-teal-400">
                        <span className="w-2.5 h-1.5 rounded-full" style={{ backgroundColor: depositsColor }} />
                        Deposits
                      </span>
                    </div>
                  </div>

                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={salesColor} stopOpacity={0.35}/>
                            <stop offset="95%" stopColor={salesColor} stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={depositsColor} stopOpacity={0.35}/>
                            <stop offset="95%" stopColor={depositsColor} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#FFFFFF' : '#000000'} strokeOpacity={0.08} />
                        <XAxis dataKey="date" stroke="#888888" fontSize={11} tick={{ fill: isDark ? '#9CA3AF' : '#6B7280' }} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={11} tick={{ fill: isDark ? '#9CA3AF' : '#6B7280' }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="Sales"
                          stroke={salesColor}
                          strokeWidth={2.8}
                          strokeLinecap="round"
                          fillOpacity={1}
                          fill="url(#colorSales)"
                          isAnimationActive={true}
                          animationDuration={700}
                          animationEasing="ease-out"
                          dot={renderCustomDot(salesColor)}
                        />
                        <Area
                          type="monotone"
                          dataKey="Deposits"
                          stroke={depositsColor}
                          strokeWidth={2.8}
                          strokeLinecap="round"
                          fillOpacity={1}
                          fill="url(#colorDeposits)"
                          isAnimationActive={true}
                          animationDuration={700}
                          animationEasing="ease-out"
                          dot={renderCustomDot(depositsColor)}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pending Balance Trend Chart Card */}
                <div className="bg-white/40 dark:bg-zinc-900/40 border border-border-gray/30 dark:border-white/10 p-5 rounded-3xl backdrop-blur-md shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-charcoal dark:text-white flex items-center gap-2">
                      <Wallet className="text-teal" size={16} />
                      Cumulative Pending Balance
                    </h3>
                    {/* Pill legends top-right */}
                    <div className="flex gap-2 text-[10px] font-black tracking-wider uppercase">
                      <span className="flex items-center gap-1.5" style={{ color: pendingColor }}>
                        <span className="w-2.5 h-1.5 rounded-full" style={{ backgroundColor: pendingColor }} />
                        Pending Balance
                      </span>
                    </div>
                  </div>

                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#FFFFFF' : '#000000'} strokeOpacity={0.08} />
                        <XAxis dataKey="date" stroke="#888888" fontSize={11} tick={{ fill: isDark ? '#9CA3AF' : '#6B7280' }} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={11} tick={{ fill: isDark ? '#9CA3AF' : '#6B7280' }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="Pending Balance"
                          stroke={pendingColor}
                          strokeWidth={2.8}
                          strokeLinecap="round"
                          isAnimationActive={true}
                          animationDuration={700}
                          animationEasing="ease-out"
                          dot={renderCustomDot(pendingColor)}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* History Table Section (Entrance: 280ms delay) */}
          <div className="bg-white/40 dark:bg-zinc-900/40 border border-border-gray/30 dark:border-white/10 p-6 rounded-3xl backdrop-blur-md shadow-sm animate-fade-up" style={{ animationDelay: '280ms' }}>
            <h2 className="text-xl font-black text-charcoal dark:text-white flex items-center gap-2 mb-6">
              <FileText className="text-teal" size={20} />
              Transaction Ledger
            </h2>

            {entries.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-border-gray/40 dark:border-white/5 rounded-2xl">
                <FileText size={48} className="mx-auto text-slate-gray/40 mb-3" />
                <h4 className="font-extrabold text-charcoal dark:text-white">No entries yet</h4>
                <p className="text-slate-gray dark:text-gray-400 text-xs mt-1.5 max-w-sm mx-auto">
                  Add the first daily entry above to begin recording sales, deposits, and tracking shortfalls.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-border-gray/35 dark:border-white/5">
                <table className="w-full text-left text-sm">
                  <thead className="bg-border-gray/30 dark:bg-zinc-950/60 text-xs font-black uppercase tracking-wider text-slate-gray dark:text-gray-400">
                    <tr>
                      <th className="px-5 py-4">Date</th>
                      <th className="px-5 py-4 text-right">Sale</th>
                      <th className="px-5 py-4 text-right">Deposit</th>
                      <th className="px-5 py-4 text-center">Shortfall/Excess</th>
                      <th className="px-5 py-4 text-right">Running Balance</th>
                      <th className="px-5 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-gray/25 dark:divide-white/5">
                    {displayEntries.map((row) => {
                      const diff = Number(row.shortfall);
                      const isHighlighted = row.id === highlightedRowId;

                      return (
                        <tr
                          key={row.id}
                          className={`transition-all duration-700 ${
                            isHighlighted
                              ? 'bg-teal/20 dark:bg-teal/30 scale-[1.01] shadow-md'
                              : 'hover:bg-white/20 dark:hover:bg-zinc-900/10'
                          }`}
                        >
                          <td className="px-5 py-4 font-bold text-charcoal dark:text-white whitespace-nowrap">
                            {row.entry_date}
                          </td>
                          <td className="px-5 py-4 font-medium text-right text-charcoal dark:text-white">
                            {formattedCurrency(Number(row.sale_amount))}
                          </td>
                          <td className="px-5 py-4 font-medium text-right text-charcoal dark:text-white">
                            {formattedCurrency(Number(row.deposit_amount))}
                          </td>

                          {/* Shortfall/Excess Indicator */}
                          <td className="px-5 py-4 text-center">
                            {diff > 0 ? (
                              <span className="inline-flex items-center gap-1.5 bg-danger-red/10 text-danger-red font-black text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-danger-red/25">
                                Rs. {new Intl.NumberFormat('en-IN').format(diff)} Deficit
                              </span>
                            ) : diff < 0 ? (
                              <span className="inline-flex items-center gap-1.5 bg-success-green/10 text-success-green font-black text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-success-green/25">
                                Rs. {new Intl.NumberFormat('en-IN').format(Math.abs(diff))} Overpaid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 bg-slate-gray/10 text-slate-gray dark:text-gray-300 font-bold text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-slate-gray/25">
                                Settled
                              </span>
                            )}
                          </td>

                          {/* Running Balance */}
                          <td className="px-5 py-4 text-right font-black">
                            <span className={row.running_balance > 0 ? 'text-danger-red' : 'text-success-green'}>
                              {formattedCurrency(row.running_balance)}
                            </span>
                          </td>

                          {/* Row Action Panel */}
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              {/* Edit Button - sets form's selected date */}
                              <button
                                onClick={() => setSelectedDate(row.entry_date)}
                                className="p-2 hover:bg-teal/10 hover:text-teal rounded-lg text-slate-gray dark:text-gray-400 transition"
                                title="Edit entry"
                              >
                                <Edit2 size={14} />
                              </button>

                              {/* Delete Action with inline popover check */}
                              <div className="relative">
                                {confirmDeleteId === row.id ? (
                                  <div className="absolute right-0 bottom-full mb-2 bg-white dark:bg-zinc-950 border border-border-gray/50 dark:border-white/10 p-2.5 rounded-xl shadow-2xl flex items-center gap-2 z-10 animate-fade-in whitespace-nowrap">
                                    <span className="text-[10px] font-bold text-slate-gray">Confirm delete?</span>
                                    <button
                                      onClick={() => handleDeleteEntry(row.id, row.entry_date)}
                                      className="bg-danger-red text-white text-[10px] font-extrabold px-2 py-1 rounded hover:opacity-90 transition"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="bg-border-gray dark:bg-zinc-800 text-charcoal dark:text-white text-[10px] font-extrabold px-2 py-1 rounded hover:opacity-90 transition"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmDeleteId(row.id)}
                                    className="p-2 hover:bg-danger-red/10 hover:text-danger-red rounded-lg text-slate-gray dark:text-gray-400 transition"
                                    title="Delete entry"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
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

      </div>
    </div>
  );
}
