'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon, Menu, LogOut, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface TopbarProps {
  onMenuToggle: () => void;
}

export default function Topbar({ onMenuToggle }: TopbarProps) {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Initialize theme from localStorage or system preference and fetch user session
  useEffect(() => {
    const isDark =
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isDummy = !url || url.includes('placeholder') || url.includes('dummy');

    if (isDummy) {
      setUserEmail('owner@bookerledger.com');
      setUserRole('owner');
    } else {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setUserEmail(user.email || '');
          supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setUserRole(data.role);
              }
            });
        }
      });
    }
  }, []);

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

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="h-20 border-b border-border-gray/10 bg-white/10 dark:bg-black/10 backdrop-blur-md flex items-center justify-between px-6 md:px-8 z-30 transition-colors duration-300">

      {/* Left side: Hamburger menu + Title */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuToggle}
          aria-label="Open navigation menu"
          className="p-2.5 rounded-xl border border-border-gray/10 bg-white/20 dark:bg-black/20 text-charcoal dark:text-white hover:bg-white/30 dark:hover:bg-white/10 md:hidden active:scale-95 transition-all duration-200 shadow-sm"
        >
          <Menu size={20} />
        </button>
        <div>
          <h2 className="text-base md:text-xl font-black tracking-tight text-charcoal dark:text-white">
            System Ledger
          </h2>
          <p className="text-[10px] md:text-xs text-slate-gray dark:text-gray-400 font-bold">
            Booker Sales & Payment Tracker
          </p>
        </div>
      </div>

      {/* Right side: Actions & Profile */}
      <div className="flex items-center space-x-3 md:space-x-6">

        {/* Apple-style Glassmorphic Sun/Moon toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme mode"
          className="p-2.5 rounded-full border border-border-gray/10 bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-white/10 text-charcoal dark:text-white active:scale-95 transition-all duration-200 shadow-sm"
        >
          {darkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-navy" />}
        </button>

        {/* User profile & Logout */}
        <div className="flex items-center space-x-3 border-l border-border-gray/10 pl-3 md:pl-6">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-navy to-teal flex items-center justify-center font-black text-xs md:text-sm text-white shadow-md">
            {userRole === 'owner' ? 'OP' : 'BP'}
          </div>
          <div className="hidden lg:block text-left">
            <span className="block text-xs font-black text-charcoal dark:text-white leading-none">
              {userRole === 'owner' ? 'System Owner' : 'Booker Representative'}
            </span>
            <span className="text-[10px] text-slate-gray dark:text-gray-400 font-semibold max-w-[120px] truncate block mt-0.5">
              {userEmail || 'profile@system.com'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            aria-label="Sign out"
            className="p-2.5 rounded-xl border border-danger-red/10 bg-danger-red/5 hover:bg-danger-red/10 text-danger-red active:scale-95 transition-all duration-200 disabled:opacity-50"
          >
            {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
}
