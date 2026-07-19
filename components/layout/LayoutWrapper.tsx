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
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
