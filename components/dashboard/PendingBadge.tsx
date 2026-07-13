import React from 'react';

interface PendingBadgeProps {
  count: number;
}

export default function PendingBadge({ count }: PendingBadgeProps) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-amber text-white">
      {count} Pending
    </span>
  );
}
