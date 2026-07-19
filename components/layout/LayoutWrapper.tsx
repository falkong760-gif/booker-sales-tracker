'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Pages that should be rendered completely standalone without the authenticated layout/shell
  const isIsolatedPage = pathname === '/login' || pathname === '/config-error';

  if (isIsolatedPage) {
    return (
      <div className="flex min-h-screen relative z-10 w-full justify-center items-center">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen relative z-10 w-full">
      {/* Apple-style Animated Background Gradient Blobs / Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-navy/25 dark:bg-navy/30 blur-[100px] animate-pulse-slow" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full bg-teal/20 dark:bg-teal/20 blur-[130px] animate-pulse-reverse" />
        <div className="absolute -bottom-40 left-1/3 w-80 h-80 rounded-full bg-navy/20 dark:bg-teal/10 blur-[90px] animate-pulse-slow" />
      </div>

      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 z-10">
        <Topbar />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
