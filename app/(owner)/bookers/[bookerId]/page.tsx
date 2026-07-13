import React from 'react';

interface BookerDetailPageProps {
  params: {
    bookerId: string;
  };
}

export default function BookerDetailPage({ params }: BookerDetailPageProps) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Booker Detail</h1>
      <p className="text-slate-gray">Viewing detailed information for Booker ID: {params.bookerId}</p>
    </div>
  );
}
