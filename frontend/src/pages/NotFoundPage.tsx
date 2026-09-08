import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Compass, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
      <div className="p-4 rounded-2xl bg-[#1E293B] border border-slate-700/60 text-[#10B981]">
        <Compass className="w-12 h-12 animate-pulse" />
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="text-4xl font-extrabold tracking-tight text-[#F8F5ED] font-display">404 — Page Not Found</h1>
        <p className="text-[#94A3B8] text-sm">
          The page or route you requested does not exist or has been moved.
        </p>
      </div>

      <Link to="/">
        <Button variant="default" className="gap-2">
          <Home className="w-4 h-4" />
          Back to Overview
        </Button>
      </Link>
    </div>
  );
};
