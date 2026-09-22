"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Code2,
  Palette,
  Boxes,
  PenTool,
  Languages,
  Mic,
  Music,
  TrendingUp,
  Globe,
  Compass,
  Camera,
  BarChart3,
  Check,
  LucideIcon,
} from "lucide-react";

interface SkillCardProps {
  name: string;
  category: string;
  iconName: string;
  learners?: string;
  isSelected?: boolean;
  onToggle?: () => void;
  className?: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Code2,
  Palette,
  Boxes,
  PenTool,
  Languages,
  Mic,
  Music,
  TrendingUp,
  Globe,
  Compass,
  Camera,
  BarChart3,
};

export function SkillCard({
  name,
  category,
  iconName,
  learners,
  isSelected,
  onToggle,
  className,
}: SkillCardProps) {
  const IconComponent = ICON_MAP[iconName] || Code2;

  return (
    <div
      onClick={onToggle}
      className={cn(
        "group relative flex items-start gap-3.5 p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none text-left",
        isSelected
          ? "bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm"
          : "bg-white border-slate-200/90 hover:border-indigo-300 hover:shadow-md hover:shadow-slate-100 active:scale-[0.99]",
        className
      )}
    >
      {/* Icon Capsule */}
      <div
        className={cn(
          "flex-shrink-0 h-11 w-11 rounded-xl flex items-center justify-center transition-colors duration-200",
          isSelected
            ? "bg-indigo-600 text-white shadow-xs"
            : "bg-slate-100 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-600"
        )}
      >
        <IconComponent className="h-5 w-5" />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 pr-6">
        <h4
          className={cn(
            "text-sm font-bold truncate transition-colors",
            isSelected ? "text-indigo-950" : "text-slate-900 group-hover:text-indigo-600"
          )}
        >
          {name}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-medium text-slate-500">{category}</span>
          {learners && (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] text-slate-400">{learners}</span>
            </>
          )}
        </div>
      </div>

      {/* Checkbox badge in top right */}
      <div
        className={cn(
          "absolute top-3.5 right-3.5 h-5 w-5 rounded-full flex items-center justify-center transition-all duration-200 border",
          isSelected
            ? "bg-indigo-600 border-indigo-600 text-white scale-100"
            : "border-slate-300 bg-white group-hover:border-slate-400 scale-90 opacity-60 group-hover:opacity-100"
        )}
      >
        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
      </div>
    </div>
  );
}
