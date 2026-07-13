import React from 'react';

export default function EntryForm() {
  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <div>
        <label className="block text-sm font-medium text-charcoal">Amount</label>
        <input type="number" className="mt-1 block w-full rounded-md border-border-gray shadow-sm focus:border-teal focus:ring-teal sm:text-sm" placeholder="0.00" />
      </div>
      <button type="submit" className="bg-navy text-white px-4 py-2 rounded-lg hover:bg-teal">Submit Entry</button>
    </form>
  );
}
