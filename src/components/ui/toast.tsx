"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Info, AlertCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "success" | "info" | "error";
  onClose: () => void;
}

export function Toast({ message, type = "success", onClose }: ToastProps) {
  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />,
    info: <Info className="h-5 w-5 text-indigo-500 flex-shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0" />,
  };

  const borders = {
    success: "border-emerald-200 bg-white shadow-emerald-500/10",
    info: "border-indigo-200 bg-white shadow-indigo-500/10",
    error: "border-rose-200 bg-white shadow-rose-500/10",
  };

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl transition-all duration-200 animate-in slide-in-from-bottom-5",
        borders[type]
      )}
    >
      {icons[type]}
      <span className="text-sm font-semibold text-slate-800">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
