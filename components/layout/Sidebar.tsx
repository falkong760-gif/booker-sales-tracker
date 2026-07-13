import React from 'react';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-navy text-white min-h-screen p-4">
      <div className="font-bold text-lg mb-4">Booker Sales & Payment</div>
      <nav className="space-y-2">
        <div className="hover:bg-teal p-2 rounded cursor-pointer">Dashboard</div>
        <div className="hover:bg-teal p-2 rounded cursor-pointer">Settings</div>
      </nav>
    </aside>
  );
}
