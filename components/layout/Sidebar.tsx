'use client';

import React from 'react';
import { LayoutDashboard, Settings, Users, BarChart3, FileText, Lock, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Bookers', href: '/bookers', icon: Users },
    { name: 'Comparison', href: '/comparison', icon: BarChart3 },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Test Panel', href: '/test', icon: Lock },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col p-6">
      {/* Close button on mobile */}
      <div className="flex md:hidden justify-end mb-2">
        <button
          onClick={onClose}
          aria-label="Close sidebar menu"
          className="p-2 rounded-full hover:bg-white/10 dark:hover:bg-zinc-800 text-charcoal dark:text-white"
        >
          <X size={20} />
        </button>
      </div>

      {/* Brand Logo */}
      <div className="mb-10 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-navy to-teal flex items-center justify-center shadow-lg shadow-navy/10 dark:shadow-black/30">
          <span className="font-extrabold text-sm text-white tracking-widest">BS</span>
        </div>
        <div>
          <h1 className="text-sm font-black uppercase tracking-widest text-navy dark:text-teal">Booker</h1>
          <p className="text-[10px] font-bold text-slate-gray dark:text-gray-400">Tracking System</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.name} href={item.href} className="block" onClick={onClose}>
              <div
                className={`relative flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 active:scale-[0.98] ${
                  isActive
                    ? 'text-navy dark:text-teal bg-teal/10 dark:bg-teal/10 border-l-4 border-teal'
                    : 'text-slate-gray dark:text-gray-400 hover:bg-white/10 dark:hover:bg-white/5 hover:text-navy dark:hover:text-white'
                }`}
              >
                {/* Smooth active sliding/fading glow indicator inside item */}
                {isActive && (
                  <span className="absolute inset-0 bg-gradient-to-r from-teal/10 to-transparent rounded-r-xl pointer-events-none animate-fade-in" />
                )}
                <Icon size={16} className={isActive ? 'text-teal' : ''} />
                <span className="z-10">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-6 border-t border-border-gray/5">
        <div className="p-4 rounded-xl bg-white/30 dark:bg-black/20 border border-white/40 dark:border-white/10 text-center backdrop-blur-md">
          <p className="text-[10px] uppercase tracking-widest font-extrabold text-slate-gray dark:text-gray-400">Environment</p>
          <p className="text-xs font-bold text-navy dark:text-teal mt-0.5">Vercel Production</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 w-64 z-50 md:z-30 border-r border-border-gray/10 md:border-r bg-white/20 dark:bg-black/25 backdrop-blur-2xl md:backdrop-blur-xl transition-all duration-300 ease-out flex flex-col h-screen md:h-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
