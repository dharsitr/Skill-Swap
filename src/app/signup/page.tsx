"use client";

import React, { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { AuthView } from "@/components/views/AuthView";

export default function SignupPage() {
  const { setAuthMode } = useApp();

  useEffect(() => {
    setAuthMode("signup");
  }, [setAuthMode]);

  return <AuthView />;
}
