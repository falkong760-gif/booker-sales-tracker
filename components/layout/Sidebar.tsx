'use client';

import React from 'react';
import { Home, Settings, Users, BarChart3, FileSpreadsheet, Lock } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Bookers', href: '/bookers', icon: Users },
    { name: 'Comparison', href: '/comparison', icon: BarChart3 },
    { name: 'Reports', href: '/reports', icon: FileSpreadsheet },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Test Panel', href: '/test', icon: Lock },
  ];

  return (
    <aside className="w-64 border-r border-border-gray/10 bg-white/10 dark:bg-black/20 backdrop-blur-lg flex flex-col p-6 z-30 transition-colors duration-300">
      <div className="mb-10 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-navy to-teal flex items-center justify-center shadow-lg">
          <span className="font-extrabold text-sm text-white tracking-widest">BS</span>
        </div>
        <div>
          <h1 className="text-sm font-black uppercase tracking-widest text-navy dark:text-teal">Booker</h1>
          <p className="text-[10px] font-bold text-slate-gray dark:text-gray-400">Tracking System</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.name} href={item.href} className="block">
              <div
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ios-active ${
                  isActive
                    ? 'bg-navy text-white shadow-glass dark:shadow-glass-dark'
                    : 'text-slate-gray dark:text-gray-400 hover:bg-white/15 dark:hover:bg-white/5 hover:text-navy dark:hover:text-white'
                }`}
              >
                <Icon size={16} />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-border-gray/5">
        <div className="p-4 rounded-xl bg-navy/5 dark:bg-white/5 border border-border-gray/5 text-center">
          <p className="text-[10px] uppercase tracking-widest font-extrabold text-slate-gray dark:text-gray-400">Environment</p>
          <p className="text-xs font-bold text-navy dark:text-teal mt-0.5">Vercel Production</p>
        </div>
      </div>
    </aside>
  );
}
