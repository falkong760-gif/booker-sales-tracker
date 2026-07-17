import React from 'react';
import { Inter } from 'next/font/google';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import '@/app/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-off-white dark:bg-zinc-950 text-charcoal dark:text-zinc-50 overflow-x-hidden min-h-screen relative transition-colors duration-500">

        {/* Apple-style Animated Background Gradient Blobs / Orbs */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-navy/25 dark:bg-navy/30 blur-[100px] animate-pulse-slow" />
          <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full bg-teal/20 dark:bg-teal/20 blur-[130px] animate-pulse-reverse" />
          <div className="absolute -bottom-40 left-1/3 w-80 h-80 rounded-full bg-navy/20 dark:bg-teal/10 blur-[90px] animate-pulse-slow" />
        </div>

        {/* Global Page Content Container with layout isolation support */}
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
