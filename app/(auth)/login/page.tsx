'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Sun,
  Moon,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

// Force dynamic rendering to prevent prerendering failure when environment variables are missing during build.
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);

  // Authentication states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Page mode: 'login' | 'forgot_password' | 'forgot_password_success'
  const [mode, setMode] = useState<'login' | 'forgot_password' | 'forgot_password_success'>(
    'login'
  );

  // Transition animation triggers
  const [isMounted, setIsMounted] = useState(false);

  // Dark mode toggle state
  const [darkMode, setDarkMode] = useState(false);

  // Initialize theme from localStorage or system preference and Supabase client
  useEffect(() => {
    setIsMounted(true);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const hasKeys = url && key && !url.includes('placeholder');

    if (hasKeys) {
      try {
        setSupabase(createClient());
      } catch {
        setErrorMessage('System connection error. Please try again later.');
      }
    } else {
      setErrorMessage('System is offline. Please contact the administrator.');
    }

    const isDark =
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Quick session check to auto-redirect already logged-in users to /dashboard
  useEffect(() => {
    if (!supabase) return;
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    checkSession();
  }, [supabase, router]);

  const toggleTheme = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const translateError = (message: string) => {
    const lower = message.toLowerCase();
    if (lower.includes('invalid login credentials') || lower.includes('email not confirmed')) {
      return 'The email or password you entered is incorrect. Please check your credentials and try again.';
    }
    if (lower.includes('network') || lower.includes('fetch')) {
      return 'A network error occurred. Please check your internet connection and try again.';
    }
    if (lower.includes('rate limit') || lower.includes('too many requests')) {
      return 'Too many login attempts. Please wait a few minutes before trying again.';
    }
    return message;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !supabase) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(translateError(error.message));
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Redirect directly to dashboard as it handles rendering correct dashboards dynamically based on role
        router.push('/dashboard');
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !supabase) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setErrorMessage(translateError(error.message));
        setIsLoading(false);
        return;
      }

      setMode('forgot_password_success');
    } catch {
      setErrorMessage('Could not send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-off-white dark:bg-zinc-950 transition-colors duration-500">

      {/* Premium Apple-style Ambient Gradient Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-navy/30 dark:bg-navy/40 blur-[100px] animate-pulse-slow" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full bg-teal/25 dark:bg-teal/25 blur-[130px] animate-pulse-reverse" />
        <div className="absolute -bottom-40 left-1/3 w-80 h-80 rounded-full bg-navy/25 dark:bg-teal/15 blur-[90px] animate-pulse-slow" />
      </div>

      {/* Dark/Light Mode Switcher in top right corner */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme mode"
          className="p-3 rounded-full border border-slate-300 dark:border-zinc-800 bg-white/40 dark:bg-black/40 hover:bg-white/50 dark:hover:bg-white/15 text-charcoal dark:text-white transition-all duration-300 shadow-sm backdrop-blur-md active:scale-95"
        >
          {darkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-navy" />}
        </button>
      </div>

      {/* Floating Heavy Frosted Glass Login Panel */}
      <div
        className={`w-full max-w-md z-10 transition-all duration-700 transform ${
          isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="bg-white/50 dark:bg-zinc-900/40 border border-slate-300/60 dark:border-zinc-800/60 rounded-3xl p-8 backdrop-blur-2xl shadow-glass dark:shadow-glass-dark space-y-6">

          {/* Logo / Title Area */}
          <div className="text-center space-y-2">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-navy to-teal items-center justify-center shadow-lg shadow-navy/15 dark:shadow-black/40">
              <span className="font-black text-lg text-white tracking-widest">BS</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-navy dark:text-white mt-3">
              Booker Ledger
            </h1>
            <p className="text-sm font-bold text-slate-gray dark:text-zinc-300">
              Sales & Payment Tracking System
            </p>
          </div>

          {/* MODE 1: Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-black uppercase tracking-wider text-charcoal dark:text-zinc-100">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-charcoal dark:text-zinc-100 pointer-events-none">
                    <Mail size={18} />
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    disabled={!supabase}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/45 dark:bg-black/35 border border-slate-300 dark:border-zinc-700 rounded-2xl text-sm font-semibold text-charcoal dark:text-white placeholder:text-slate-gray dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal transition-all duration-300 disabled:opacity-50"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="block text-xs font-black uppercase tracking-wider text-charcoal dark:text-zinc-100">
                    Password
                  </label>
                  <button
                    type="button"
                    disabled={!supabase}
                    onClick={() => {
                      setErrorMessage('');
                      setMode('forgot_password');
                    }}
                    className="text-xs font-black text-teal hover:underline focus:outline-none transition-colors duration-300 disabled:opacity-50"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-charcoal dark:text-zinc-100 pointer-events-none">
                    <Lock size={18} />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={!supabase}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 bg-white/45 dark:bg-black/35 border border-slate-300 dark:border-zinc-700 rounded-2xl text-sm font-semibold text-charcoal dark:text-white placeholder:text-slate-gray dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal transition-all duration-300 disabled:opacity-50"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    disabled={!supabase}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-gray dark:text-zinc-300 hover:text-navy dark:hover:text-white transition-colors duration-300 focus:outline-none disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Animated Error Banner */}
              {errorMessage && (
                <div className="p-3 bg-danger-red/10 border border-danger-red/30 rounded-2xl animate-fade-in">
                  <p className="text-xs font-bold text-danger-red dark:text-red-400 leading-relaxed text-center">
                    {errorMessage}
                  </p>
                </div>
              )}

              {/* Primary submit button */}
              <button
                type="submit"
                disabled={isLoading || !supabase}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-navy to-teal hover:brightness-110 active:scale-[0.96] disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-teal/10 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>
          )}

          {/* MODE 2: Forgot Password Form */}
          {mode === 'forgot_password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setMode('login');
                  }}
                  className="inline-flex items-center space-x-2 text-xs font-black text-slate-gray dark:text-zinc-300 hover:text-navy dark:hover:text-white transition-colors duration-300"
                >
                  <ArrowLeft size={16} />
                  <span>Back to Login</span>
                </button>
                <h2 className="text-lg font-black text-navy dark:text-white">
                  Reset Password
                </h2>
                <p className="text-xs font-semibold text-slate-gray dark:text-zinc-200 leading-relaxed">
                  Enter your registered email address below, and we will send you a password recovery link.
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reset-email" className="block text-xs font-black uppercase tracking-wider text-charcoal dark:text-zinc-100">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-charcoal dark:text-zinc-100 pointer-events-none">
                    <Mail size={18} />
                  </span>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    disabled={!supabase}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/45 dark:bg-black/35 border border-slate-300 dark:border-zinc-700 rounded-2xl text-sm font-semibold text-charcoal dark:text-white placeholder:text-slate-gray dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal transition-all duration-300 disabled:opacity-50"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Animated Error Banner */}
              {errorMessage && (
                <div className="p-3 bg-danger-red/10 border border-danger-red/30 rounded-2xl animate-fade-in">
                  <p className="text-xs font-bold text-danger-red dark:text-red-400 leading-relaxed text-center">
                    {errorMessage}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !supabase}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-navy to-teal hover:brightness-110 active:scale-[0.96] disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-teal/10 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Sending reset link...</span>
                  </>
                ) : (
                  <span>Send Recovery Email</span>
                )}
              </button>
            </form>
          )}

          {/* MODE 3: Forgot Password Success */}
          {mode === 'forgot_password_success' && (
            <div className="text-center space-y-6 py-4 animate-fade-in">
              <div className="inline-flex w-14 h-14 rounded-full bg-success-green/10 text-success-green items-center justify-center">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black text-navy dark:text-white">
                  Reset Link Sent
                </h2>
                <p className="text-sm font-bold text-slate-gray dark:text-zinc-200 leading-relaxed max-w-xs mx-auto">
                  A password recovery link has been sent to <span className="font-bold text-charcoal dark:text-white">{email}</span>. Please check your inbox (and spam folder) to complete reset.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setMode('login');
                }}
                className="inline-flex items-center space-x-2 text-sm font-black text-teal hover:underline focus:outline-none"
              >
                <ArrowLeft size={16} />
                <span>Return to Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
