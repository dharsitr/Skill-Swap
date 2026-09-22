"use client";

import React from "react";
import { Sidebar } from "./Sidebar";

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex md:hidden animate-in fade-in duration-200">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-64 bg-white h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
        <Sidebar onNavigate={onClose} />
      </div>
    </div>
  );
}
