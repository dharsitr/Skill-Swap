"use client";

import React, { useEffect, Suspense } from "react";
import { useApp } from "@/context/AppContext";
import { AuthView } from "@/components/views/AuthView";

function LoginContent() {
  const { setAuthMode } = useApp();

  useEffect(() => {
    setAuthMode("login");
  }, [setAuthMode]);

  return <AuthView />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <LoginContent />
    </Suspense>
  );
}
