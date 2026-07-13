import React from 'react';

export default function Topbar() {
  return (
    <header className="h-16 border-b border-border-gray bg-white flex items-center justify-between px-6">
      <div className="font-semibold text-charcoal">System Overview</div>
      <div className="text-sm text-slate-gray">User Profile</div>
    </header>
  );
}
