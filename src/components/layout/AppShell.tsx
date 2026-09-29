"use client";

import React, { ReactNode } from "react";
import { AppProvider, useApp } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { Toast } from "@/components/ui/toast";

function ShellInner({ children }: { children: ReactNode }) {
  const { toast, showToast } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col">
      <div className="flex-1 flex flex-col">{children}</div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => showToast("", "info")}
        />
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <AuthProvider>
        <ShellInner>{children}</ShellInner>
      </AuthProvider>
    </AppProvider>
  );
}
