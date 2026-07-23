'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  Users,
  Search,
  Plus,
  X,
  Edit3,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Phone,
  Mail,
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { fetchBookers, createBooker, updateBooker, deactivateBooker, reactivateBooker, BookerWithAuthInfo } from '@/app/actions/bookers';

export default function BookersPage() {
  const [bookers, setBookers] = useState<BookerWithAuthInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Drawer / Slide-over state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit'>('add');
  const [editingBooker, setEditingBooker] = useState<BookerWithAuthInfo | null>(null);

  // Form Fields
  const [nameField, setNameField] = useState('');
  const [phoneField, setPhoneField] = useState('');
  const [emailField, setEmailField] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Confirmation flows
  const [confirmReactivateId, setConfirmReactivateId] = useState<string | null>(null);
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<string | null>(null);

  // Toast / Status Banners
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string; details?: string } | null>(null);

  const [, startTransition] = useTransition();

  const loadBookers = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchBookers();
      if (res.success && res.data) {
        setBookers(res.data);
      } else {
        setErrorMsg(res.error || 'Failed to fetch bookers.');
      }
    } catch {
      setErrorMsg('An unexpected error occurred while loading bookers.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookers();
  }, []);

  const triggerToast = (type: 'success' | 'error', text: string, details?: string) => {
    setToastMessage({ type, text, details });
    setTimeout(() => {
      setToastMessage(null);
    }, 8000);
  };

  const handleOpenAddDrawer = () => {
    setDrawerMode('add');
    setEditingBooker(null);
    setNameField('');
    setPhoneField('');
    setEmailField('');
    setFormError(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (booker: BookerWithAuthInfo) => {
    setDrawerMode('edit');
    setEditingBooker(booker);
    setNameField(booker.name);
    setPhoneField(booker.phone || '');
    setEmailField(booker.email);
    setFormError(null);
    setIsDrawerOpen(true);
  };

  const handleSaveBooker = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Client-side validation
    if (!nameField.trim() || nameField.trim().length < 2) {
      setFormError('Name must be at least 2 characters long.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailField.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (phoneField.trim()) {
      const phoneRegex = /^[0-9\s+\-()]{7,}$/;
      if (!phoneRegex.test(phoneField.trim())) {
        setFormError('Phone number must be at least 7 digits and contain only valid symbols (digits, spaces, +, -, or parentheses).');
        return;
      }
    }

    setIsSaving(true);

    try {
      if (drawerMode === 'add') {
        const res = await createBooker(nameField, phoneField, emailField);
        if (res.success && res.data) {
          const { tempPassword, authSimulated } = res.data;

          if (authSimulated) {
            triggerToast(
              'success',
              'Booker profile created in database.',
              `Auth login was simulated (Service Role Key not configured in this session). Temporary password generated: ${tempPassword}`
            );
          } else {
            triggerToast(
              'success',
              'Booker profile and Auth account created successfully!',
              `Auth account was created via Admin API. Temporary password: ${tempPassword}`
            );
          }
          setIsDrawerOpen(false);
          loadBookers();
        } else {
          setFormError(res.error || 'Failed to create booker.');
        }
      } else if (drawerMode === 'edit' && editingBooker) {
        const res = await updateBooker(editingBooker.id, {
          name: nameField,
          phone: phoneField,
          email: emailField,
        });
        if (res.success) {
          triggerToast('success', 'Booker profile updated successfully.');
          setIsDrawerOpen(false);
          loadBookers();
        } else {
          setFormError(res.error || 'Failed to update booker.');
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'An error occurred while saving.';
      setFormError(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = (bookerId: string) => {
    setConfirmDeactivateId(bookerId);
    setConfirmReactivateId(null);
  };

  const confirmDeactivate = async (bookerId: string) => {
    try {
      const res = await deactivateBooker(bookerId);
      if (res.success) {
        triggerToast('success', 'Booker has been successfully deactivated.');
        loadBookers();
      } else {
        triggerToast('error', `Failed to deactivate: ${res.error}`);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      triggerToast('error', `Error: ${errMsg}`);
    } finally {
      setConfirmDeactivateId(null);
    }
  };

  const handleReactivate = (bookerId: string) => {
    setConfirmReactivateId(bookerId);
    setConfirmDeactivateId(null);
  };

  const confirmReactivate = async (bookerId: string) => {
    try {
      const res = await reactivateBooker(bookerId);
      if (res.success) {
        triggerToast('success', 'Booker has been successfully reactivated.');
        loadBookers();
      } else {
        triggerToast('error', `Failed to reactivate: ${res.error}`);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      triggerToast('error', `Error: ${errMsg}`);
    } finally {
      setConfirmReactivateId(null);
    }
  };

  // Filter & Search Logic
  const filteredBookers = bookers.filter((booker) => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'active' && booker.status === 'active') ||
      (activeTab === 'inactive' && booker.status === 'inactive');

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      booker.name.toLowerCase().includes(searchLower) ||
      booker.email.toLowerCase().includes(searchLower);

    return matchesTab && matchesSearch;
  });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header section with responsive buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-charcoal dark:text-white flex items-center gap-3">
            <Users className="text-teal" size={32} />
            Bookers Management
          </h1>
          <p className="text-slate-gray dark:text-gray-400 mt-1 font-medium">
            Monitor, create, and manage system bookers and their access privileges.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => startTransition(() => loadBookers())}
            aria-label="Refresh booker list"
            className="p-3 bg-white/40 dark:bg-zinc-900 border border-border-gray/40 dark:border-white/10 text-charcoal dark:text-white rounded-xl hover:bg-white/60 dark:hover:bg-zinc-800 transition duration-300"
          >
            <RefreshCw size={18} className="animate-hover-spin" />
          </button>
          <button
            onClick={handleOpenAddDrawer}
            className="flex items-center gap-2 bg-gradient-to-r from-navy to-teal text-white font-bold py-3 px-5 rounded-xl hover:shadow-lg hover:shadow-teal/10 transition-all duration-300 transform active:scale-95"
          >
            <Plus size={18} />
            Add Booker
          </button>
        </div>
      </div>

      {/* Global Banners / Toasts */}
      {toastMessage && (
        <div className={`p-5 rounded-2xl border backdrop-blur-md animate-fade-in ${
          toastMessage.type === 'success'
            ? 'bg-success-green/10 border-success-green/30 text-success-green'
            : 'bg-danger-red/10 border-danger-red/30 text-danger-red'
        }`}>
          <div className="flex gap-3">
            {toastMessage.type === 'success' ? <Sparkles size={22} className="shrink-0" /> : <AlertCircle size={22} className="shrink-0" />}
            <div>
              <p className="font-bold text-sm">{toastMessage.text}</p>
              {toastMessage.details && (
                <p className="text-xs mt-1.5 opacity-90 leading-relaxed font-mono select-all bg-black/5 dark:bg-black/30 p-2.5 rounded-lg border border-white/5">
                  {toastMessage.details}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs & Search controls */}
      <div className="bg-white/40 dark:bg-zinc-900/40 p-3 rounded-2xl border border-border-gray/30 dark:border-white/5 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Tab filters */}
        <div className="flex bg-border-gray/50 dark:bg-zinc-950 p-1.5 rounded-xl border border-border-gray/30 dark:border-white/10 w-full md:w-auto">
          {(['all', 'active', 'inactive'] as const).map((tab) => {
            const count = bookers.filter((b) => tab === 'all' || b.status === tab).length;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 md:flex-none px-5 py-2.5 rounded-lg text-xs font-black capitalize transition-all duration-300 ${
                  isActive
                    ? 'bg-white dark:bg-zinc-800 text-navy dark:text-teal shadow-md shadow-black/5'
                    : 'text-slate-gray dark:text-gray-400 hover:text-charcoal dark:hover:text-white'
                }`}
              >
                {tab}
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-navy/10 dark:bg-teal/20 text-navy dark:text-teal' : 'bg-black/5 dark:bg-white/10 text-slate-gray'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Live Search */}
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-gray dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/80 dark:bg-zinc-950 border border-border-gray/30 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-teal text-charcoal dark:text-white placeholder-slate-gray dark:placeholder-gray-500 transition duration-300"
          />
        </div>
      </div>

      {/* Bookers Grid/List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-teal border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-gray dark:text-gray-400 text-sm font-bold">Querying live database...</p>
        </div>
      ) : errorMsg ? (
        <div className="p-8 rounded-2xl bg-danger-red/10 border border-danger-red/20 text-center max-w-md mx-auto">
          <p className="text-danger-red font-bold text-sm mb-2">Failed to load Bookers</p>
          <p className="text-slate-gray dark:text-gray-400 text-xs">{errorMsg}</p>
        </div>
      ) : filteredBookers.length === 0 ? (
        <div className="bg-white/40 dark:bg-zinc-900/40 border border-border-gray/30 dark:border-white/5 rounded-2xl p-16 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 bg-border-gray/20 dark:bg-white/5 flex items-center justify-center rounded-2xl mx-auto mb-5 text-slate-gray">
            <Users size={32} />
          </div>
          <h3 className="text-lg font-black text-charcoal dark:text-white">No bookers match your filter</h3>
          <p className="text-slate-gray dark:text-gray-400 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
            Create a new booker profile to record sales, tracking deposits, and monitoring shortfall balances.
          </p>
          <button
            onClick={handleOpenAddDrawer}
            className="mt-6 inline-flex items-center gap-2 bg-teal text-white font-bold py-3 px-5 rounded-xl hover:shadow-lg transition duration-300"
          >
            <Plus size={18} />
            Create Your First Booker
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookers.map((booker) => (
            <div
              key={booker.id}
              className={`bg-white/40 dark:bg-zinc-900/40 border transition-all duration-300 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between ${
                booker.status === 'inactive'
                  ? 'border-border-gray/20 opacity-75 dark:border-white/5 animate-fade-in'
                  : 'border-border-gray/30 dark:border-white/15 shadow-sm shadow-black/5 hover:-translate-y-1 hover:shadow-md animate-fade-in'
              }`}
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div>
                    <h3 className="font-extrabold text-lg text-charcoal dark:text-white tracking-tight">{booker.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      {/* Active/Inactive Badge */}
                      {booker.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 bg-success-green/15 text-success-green px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-success-green/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-success-green animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-border-gray/80 dark:bg-zinc-800 text-slate-gray dark:text-gray-400 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-border-gray dark:border-white/5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-gray" />
                          Inactive
                        </span>
                      )}

                      {/* No Auth Link Badge */}
                      {!booker.has_auth_link && (
                        <span className="inline-flex items-center gap-1 bg-border-gray/30 dark:bg-zinc-800/50 text-slate-gray dark:text-gray-400 px-2 py-0.5 rounded-full text-[10px] font-bold border border-border-gray/20 dark:border-white/5">
                          No Auth Link
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Inline Reactivate action adjacent to status badge */}
                  {booker.status === 'inactive' && (
                    <div className="relative">
                      {confirmReactivateId === booker.id ? (
                        <div className="flex items-center gap-1 bg-white dark:bg-zinc-950 p-1 rounded-lg border border-border-gray dark:border-white/10 shadow-lg animate-fade-in">
                          <span className="text-[10px] font-bold text-slate-gray px-1.5">Confirm?</span>
                          <button
                            onClick={() => confirmReactivate(booker.id)}
                            className="bg-success-green text-white text-[10px] font-bold px-2 py-1 rounded hover:bg-success-green/80 transition"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmReactivateId(null)}
                            className="bg-border-gray text-charcoal text-[10px] font-bold px-2 py-1 rounded dark:bg-zinc-800 dark:text-white hover:bg-border-gray/80 transition"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleReactivate(booker.id)}
                          className="flex items-center gap-1 bg-success-green/10 text-success-green hover:bg-success-green/20 px-3 py-1.5 rounded-lg text-xs font-bold transition duration-200"
                        >
                          <CheckCircle2 size={12} />
                          Reactivate
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Balance display block */}
                <div className="mb-4 p-3.5 rounded-2xl bg-black/5 dark:bg-black/25 border border-border-gray/20 dark:border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-gray dark:text-zinc-400">
                    Pending Balance
                  </span>
                  <div className="text-right">
                    <span className={`text-sm font-black leading-none block ${
                      (booker.balance ?? 0) > 0 ? 'text-danger-red' : 'text-success-green'
                    }`}>
                      {(booker.balance ?? 0) > 0 ? '+' : ''}Rs. {new Intl.NumberFormat('en-IN').format(booker.balance ?? 0)}
                    </span>
                    <span className={`text-[8px] font-extrabold uppercase tracking-widest block mt-0.5 ${
                      (booker.balance ?? 0) > 0 ? 'text-danger-red/85' : 'text-success-green/85'
                    }`}>
                      {(booker.balance ?? 0) > 0 ? 'shortfall' : 'good standing'}
                    </span>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-2.5 text-sm font-medium border-t border-border-gray/20 dark:border-white/5 pt-4 text-slate-gray dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-gray/60" />
                    <span className="truncate">{booker.email}</span>
                  </div>
                  {booker.phone ? (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-gray/60" />
                      <span>{booker.phone}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-gray/40 italic">
                      <Phone size={14} />
                      <span>No phone provided</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer controls */}
              <div className="mt-6 pt-4 border-t border-border-gray/20 dark:border-white/5 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenEditDrawer(booker)}
                  className="flex items-center gap-1.5 text-xs text-slate-gray dark:text-gray-400 hover:text-teal dark:hover:text-teal font-bold transition duration-200"
                >
                  <Edit3 size={14} />
                  Edit details
                </button>

                {booker.status === 'active' && (
                  <div className="relative">
                    {confirmDeactivateId === booker.id ? (
                      <div className="absolute right-0 bottom-full mb-2 flex items-center gap-1 bg-white dark:bg-zinc-950 p-2 rounded-xl border border-border-gray dark:border-white/10 shadow-xl min-w-[150px] z-10 animate-fade-in">
                        <span className="text-[10px] font-bold text-slate-gray flex-1">Confirm deactivation?</span>
                        <button
                          onClick={() => confirmDeactivate(booker.id)}
                          className="bg-danger-red text-white text-[10px] font-bold px-2 py-1 rounded hover:bg-danger-red/80 transition"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDeactivateId(null)}
                          className="bg-border-gray text-charcoal text-[10px] font-bold px-2 py-1 rounded dark:bg-zinc-800 dark:text-white hover:bg-border-gray/80 transition"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeactivate(booker.id)}
                        className="flex items-center gap-1.5 text-xs text-slate-gray dark:text-gray-400 hover:text-danger-red dark:hover:text-danger-red font-bold transition duration-200"
                      >
                        <Trash2 size={14} />
                        Deactivate
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-over Right Drawer Backdrop */}
      {isDrawerOpen && (
        <div
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300"
        />
      )}

      {/* Slide-over Right Drawer Container */}
      <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-zinc-950 border-l border-border-gray/30 dark:border-white/10 shadow-2xl z-50 flex flex-col justify-between transform transition-transform duration-300 ease-out ${
        isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Drawer Header */}
        <div className="p-6 border-b border-border-gray/30 dark:border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-charcoal dark:text-white flex items-center gap-2">
              {drawerMode === 'add' ? (
                <>
                  <Plus className="text-teal" size={20} />
                  Add New Booker
                </>
              ) : (
                <>
                  <Edit3 className="text-teal" size={20} />
                  Edit Booker Details
                </>
              )}
            </h2>
            <p className="text-slate-gray dark:text-gray-400 text-xs mt-1">
              {drawerMode === 'add' ? 'Create profile. Live DB row will insert, Auth simulated.' : 'Update basic contact info below.'}
            </p>
          </div>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="p-2 rounded-full hover:bg-border-gray/30 dark:hover:bg-zinc-900 text-slate-gray dark:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Form Body */}
        <form onSubmit={handleSaveBooker} className="flex-1 overflow-y-auto p-6 space-y-5">
          {formError && (
            <div className="p-4 rounded-xl bg-danger-red/10 border border-danger-red/20 text-danger-red text-xs font-bold flex gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Name Field */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-charcoal dark:text-gray-300">
              Full Name <span className="text-danger-red">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Hammad Khan"
              value={nameField}
              onChange={(e) => setNameField(e.target.value)}
              className="w-full px-4 py-3 bg-white/50 dark:bg-zinc-900 border border-border-gray/30 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-teal text-charcoal dark:text-white"
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-charcoal dark:text-gray-300">
              Email Address <span className="text-danger-red">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="e.g. hammad@gmail.com"
              value={emailField}
              onChange={(e) => setEmailField(e.target.value)}
              className="w-full px-4 py-3 bg-white/50 dark:bg-zinc-900 border border-border-gray/30 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-teal text-charcoal dark:text-white"
            />
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-charcoal dark:text-gray-300">
              Phone Number <span className="text-slate-gray font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. +92 300 1234567"
              value={phoneField}
              onChange={(e) => setPhoneField(e.target.value)}
              className="w-full px-4 py-3 bg-white/50 dark:bg-zinc-900 border border-border-gray/30 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-teal text-charcoal dark:text-white"
            />
          </div>

          {/* Auth Simulation Warning info card inside drawer */}
          {drawerMode === 'add' && (
            <div className="p-4 bg-border-gray/40 dark:bg-zinc-900/40 border border-border-gray/20 dark:border-white/5 rounded-xl text-xs text-slate-gray dark:text-gray-400 space-y-1.5">
              <p className="font-extrabold text-navy dark:text-teal flex items-center gap-1.5">
                <HelpCircle size={14} />
                Hybrid Dev Fallback Active
              </p>
              <p className="leading-relaxed">
                As `SUPABASE_SERVICE_ROLE_KEY` is omitted, actual Supabase Auth account creation will be bypassed. A temporary login password will still be provided.
              </p>
            </div>
          )}
        </form>

        {/* Drawer Footer Actions */}
        <div className="p-6 border-t border-border-gray/30 dark:border-white/10 bg-border-gray/10 dark:bg-zinc-950 flex gap-3">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(false)}
            className="flex-1 py-3 px-4 bg-white dark:bg-zinc-900 border border-border-gray/30 dark:border-white/10 text-charcoal dark:text-white rounded-xl font-bold hover:bg-border-gray/10 dark:hover:bg-zinc-800 transition duration-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSaveBooker}
            disabled={isSaving}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-navy to-teal text-white font-bold rounded-xl hover:shadow-lg transition duration-300 flex justify-center items-center gap-2"
          >
            {isSaving ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Save Profile'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
