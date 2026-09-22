"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps?: number;
  className?: string;
  stepLabels?: string[];
}

export function ProgressIndicator({
  currentStep,
  totalSteps = 5,
  className,
  stepLabels,
}: ProgressIndicatorProps) {
  const percentage = Math.min(Math.max((currentStep / totalSteps) * 100, 0), 100);

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-slate-500 uppercase tracking-wider">
          {stepLabels && stepLabels[currentStep - 1] ? stepLabels[currentStep - 1] : `Step ${currentStep} of ${totalSteps}`}
        </span>
        <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
          {currentStep}/{totalSteps}
        </span>
      </div>

      {/* Progress Track */}
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 p-0.5">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Step dots for desktop */}
      <div className="hidden sm:flex justify-between items-center px-1 pt-1">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div key={stepNum} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "h-2 w-2 rounded-full transition-all duration-200",
                  isCurrent
                    ? "h-2.5 w-6 bg-indigo-600 ring-2 ring-indigo-200"
                    : isCompleted
                    ? "bg-indigo-500"
                    : "bg-slate-200"
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
