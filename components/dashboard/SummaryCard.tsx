import React from 'react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  description?: string;
}

export default function SummaryCard({ title, value, description }: SummaryCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-border-gray">
      <h3 className="text-sm font-medium text-slate-gray">{title}</h3>
      <p className="text-2xl font-bold text-charcoal mt-1">{value}</p>
      {description && <p className="text-xs text-slate-gray mt-1">{description}</p>}
    </div>
  );
}
