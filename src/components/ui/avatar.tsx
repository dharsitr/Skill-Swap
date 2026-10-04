/* eslint-disable @next/next/no-img-element */
"use client";

import React, { ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  fallback?: string;
  name?: string;
  isOnline?: boolean;
}

export function Avatar({
  className,
  src,
  alt = "User Avatar",
  name,
  size = "md",
  fallback,
  isOnline,
  ...props
}: AvatarProps) {
  const [hasError, setHasError] = React.useState(!src);

  React.useEffect(() => {
    setHasError(!src);
  }, [src]);

  const sizes = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-xl font-bold",
  };

  const statusSizes = {
    xs: "h-1.5 w-1.5 ring-1",
    sm: "h-2 w-2 ring-1.5",
    md: "h-2.5 w-2.5 ring-2",
    lg: "h-3.5 w-3.5 ring-2",
    xl: "h-4 w-4 ring-2.5",
  };

  // Derive initial from name, alt, or fallback (defaulting to the first letter of their name)
  const getInitial = (): string => {
    if (fallback && fallback.trim() && fallback !== "U") {
      return fallback.trim().charAt(0).toUpperCase();
    }
    const candidate =
      name ||
      (alt && alt !== "User Avatar" && alt !== "Avatar" && alt !== "User" ? alt : "") ||
      fallback ||
      "";
    const clean = candidate.trim().replace(/^[@#]/, "");
    if (clean.length > 0) {
      return clean.charAt(0).toUpperCase();
    }
    return "U";
  };

  const initial = getInitial();

  return (
    <div className={cn("relative inline-block select-none flex-shrink-0", sizes[size])}>
      {!hasError && src ? (
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className={cn("h-full w-full rounded-full object-cover ring-1 ring-slate-200/80 shadow-xs", className)}
          {...props}
        />
      ) : (
        <div
          className={cn(
            "h-full w-full rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold tracking-tight shadow-xs",
            className
          )}
        >
          {initial}
        </div>
      )}

      {isOnline !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-white",
            statusSizes[size],
            isOnline ? "bg-emerald-500" : "bg-slate-400"
          )}
        />
      )}
    </div>
  );
}
