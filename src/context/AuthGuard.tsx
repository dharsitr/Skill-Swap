"use client";

import React, { ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Route protection wrapper prepared for future Supabase auth integration.
 * In this mock phase, it permits access seamlessly.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  // In Phase 4, check: const { user, isLoading } = useAuth();
  const isAuthenticated = true;

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
