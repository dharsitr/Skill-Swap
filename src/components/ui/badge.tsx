"use client";

import React, { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "indigo";
  size?: "sm" | "md";
  onRemove?: () => void;
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  children,
  onRemove,
  ...props
}: BadgeProps) {
  const variants = {
    default: "bg-slate-100 text-slate-700 border-slate-200/80",
    secondary: "bg-slate-100 text-slate-800 border-slate-200",
    outline: "bg-white text-slate-600 border-slate-300",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
  };

  const sizes = {
    sm: "text-[11px] px-2 py-0.5 font-medium rounded-md",
    md: "text-xs px-2.5 py-1 font-semibold rounded-lg",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border transition-colors select-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:bg-black/10 rounded-full p-0.5 transition-colors cursor-pointer"
          aria-label="Remove"
        >
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </span>
  );
}
