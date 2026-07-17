'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function Topbar() {
  const [darkMode, setDarkMode] = useState(false);

  // Initialize theme from localStorage or system preference
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

  return (
    <header className="h-20 border-b border-border-gray/10 bg-white/10 dark:bg-black/10 backdrop-blur-md flex items-center justify-between px-8 z-30 transition-colors duration-300">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-charcoal dark:text-white">System Ledger</h2>
        <p className="text-xs text-slate-gray dark:text-gray-400">Booker Sales & Payment Tracker</p>
      </div>

      <div className="flex items-center space-x-6">
        {/* Apple-style Glassmorphic Sun/Moon toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          className="p-2.5 rounded-full border border-border-gray/10 bg-white/5 dark:bg-black/5 hover:bg-white/20 dark:hover:bg-white/10 text-charcoal dark:text-white ios-active shadow-sm"
        >
          {darkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-navy" />}
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center font-bold text-xs text-white shadow-inner">
            OP
          </div>
          <span className="text-sm font-semibold text-charcoal dark:text-white hidden sm:inline-block">
            Owner Profile
          </span>
        </div>
      </div>
    </header>
  );
}
