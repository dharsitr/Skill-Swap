"use client";

import React, { useEffect, Suspense } from "react";
import { useApp } from "@/context/AppContext";
import { AuthView } from "@/components/views/AuthView";

function SignupContent() {
  const { setAuthMode } = useApp();

  useEffect(() => {
    setAuthMode("signup");
  }, [setAuthMode]);

  return <AuthView />;
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <SignupContent />
    </Suspense>
  );
}
