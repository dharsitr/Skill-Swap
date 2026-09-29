'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Production-safe error logging: avoid leaking sensitive stack traces to users
    if (process.env.NODE_ENV !== 'production') {
      console.error('Dashboard Error:', error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8 backdrop-blur-xl shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-white mb-2">
          Unable to Load Dashboard Data
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          We encountered an unexpected issue while loading this section. Your account and active sessions are safe.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white font-medium flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center font-medium rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200 px-4 py-2 text-sm gap-2 transition-all duration-150"
          >
            <Home className="h-4 w-4" />
            Overview
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 text-xs text-slate-500 font-mono">
            Reference code: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
