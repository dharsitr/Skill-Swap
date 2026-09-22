"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-3xl border border-rose-200 bg-rose-50/50",
        className
      )}
    >
      <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h4 className="text-sm font-bold text-rose-950 mb-1">{title}</h4>
      <p className="text-xs text-rose-700 max-w-sm mb-4 leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="bg-white text-rose-700 border-rose-300">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Try Again
        </Button>
      )}
    </div>
  );
}
