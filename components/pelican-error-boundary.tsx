'use client';

import { useEffect } from 'react';

export function PelicanErrorBoundary({ 
  error, 
  reset 
}: { 
  error: Error; 
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[PELICAN-ERROR]', error);
  }, [error]);

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="text-red-900 font-semibold mb-2">
        Connection Error
      </h3>
      <p className="text-red-700 text-sm mb-4">
        {error.message || 'Failed to connect to Pelican backend'}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Try Again
      </button>
    </div>
  );
}

