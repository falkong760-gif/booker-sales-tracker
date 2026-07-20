'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-navy/15 dark:bg-navy/10 blur-[100px] animate-pulse-slow animate-pulse-slow-duration" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full bg-teal/12 dark:bg-teal/10 blur-[130px] animate-pulse-reverse" />
        <div className="absolute -bottom-40 left-1/3 w-80 h-80 rounded-full bg-navy/10 dark:bg-teal/8 blur-[90px] animate-pulse-slow" />
      </div>

      {/* Sidebar - Desktop & Mobile */}
      <Sidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 z-10">
        {/* Topbar gets control to toggle the sidebar */}
        <Topbar onMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
