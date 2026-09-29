"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: RootErrorProps) {
  useEffect(() => {
    // Log diagnostics safely without exposing private tokens to user console
    if (process.env.NODE_ENV === "development") {
      console.error("[SkillSwap Root Error]", error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 select-none">
      <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-3xl p-8 text-center space-y-6 shadow-xl shadow-slate-200/50 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Something Went Wrong
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            An unexpected error occurred while loading this page. Our team has been notified. Please try again.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            variant="primary"
            className="w-full sm:w-auto font-bold cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>

          <Link
            href="/dashboard"
            className={buttonVariants({
              variant: "outline",
              className: "w-full sm:w-auto font-semibold",
            })}
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
