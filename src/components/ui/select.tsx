"use client";

import React, { SelectHTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  options?: readonly string[] | string[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, leftIcon, options, children, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          <select
            id={selectId}
            ref={ref}
            className={cn(
              "w-full h-11 px-3.5 py-2 text-sm text-slate-900 bg-white border rounded-xl appearance-none transition-all duration-150 outline-none cursor-pointer",
              leftIcon ? "pl-10" : "pl-3.5",
              "pr-10",
              error
                ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                : "border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-xs",
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))
              : children}
          </select>
          <div className="absolute right-3.5 flex items-center pointer-events-none text-slate-400">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
