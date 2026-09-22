import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AuthGuard } from "@/context/AuthGuard";

export default function AppDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}
