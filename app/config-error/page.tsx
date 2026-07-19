import React from 'react';

export default function ConfigErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-off-white text-charcoal p-6">
      <div className="bg-white p-8 rounded-lg shadow-md border border-border-gray max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold text-danger-red">System Error</h1>
        <p className="text-slate-gray">
          Something went wrong, please contact the administrator.
        </p>
      </div>
    </div>
  );
}
