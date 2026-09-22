"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = "Loading...", className }: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center", className)}>
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border-2 border-indigo-200" />
        <div className="absolute inset-0 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
      {message && <p className="text-xs font-semibold text-slate-500 mt-4 animate-pulse">{message}</p>}
    </div>
  );
}
