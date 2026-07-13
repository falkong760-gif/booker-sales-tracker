import React from 'react';

interface EntryRowProps {
  date: string;
  booker: string;
  amount: number;
}

export default function EntryRow({ date, booker, amount }: EntryRowProps) {
  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">{date}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">{booker}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">${amount.toFixed(2)}</td>
    </tr>
  );
}
