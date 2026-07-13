import React from 'react';

interface EntryDetailPageProps {
  params: {
    entryId: string;
  };
}

export default function EntryDetailPage({ params }: EntryDetailPageProps) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Entry Detail</h1>
      <p className="text-slate-gray">Viewing detailed information for Entry ID: {params.entryId}</p>
    </div>
  );
}
