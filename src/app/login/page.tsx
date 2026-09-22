"use client";

import React, { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { AuthView } from "@/components/views/AuthView";

export default function LoginPage() {
  const { setAuthMode } = useApp();

  useEffect(() => {
    setAuthMode("login");
  }, [setAuthMode]);

  return <AuthView />;
}
