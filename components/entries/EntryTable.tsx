import React from 'react';
import EntryRow from './EntryRow';

export default function EntryTable() {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border-gray">
        <thead className="bg-off-white">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-gray uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-gray uppercase tracking-wider">Booker</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-gray uppercase tracking-wider">Amount</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-border-gray">
          <EntryRow date="2023-10-01" booker="John Doe" amount={150.00} />
        </tbody>
      </table>
    </div>
  );
}
