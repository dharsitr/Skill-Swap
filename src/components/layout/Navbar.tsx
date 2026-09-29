"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sparkles, Menu, X, ArrowRight, LogOut } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, signOut } = useAuth();
  const { showToast } = useApp();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    showToast("Signed out successfully.", "info");
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 select-none group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-slate-900 leading-tight">
              Skill<span className="text-indigo-600">Swap</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400 -mt-0.5 tracking-wider uppercase">
              Peer Learning
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link href="/#how-it-works" className="hover:text-indigo-600 transition-colors">
            How It Works
          </Link>
          <Link
            href="/dashboard/discover"
            className="hover:text-indigo-600 transition-colors"
          >
            Explore Skills
          </Link>
          <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">
            Dashboard
          </Link>
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          {!mounted ? (
            <div className="h-8 w-28 bg-slate-100 animate-pulse rounded-xl" />
          ) : user ? (
            <>
              <Link
                href="/dashboard"
                className={buttonVariants({ variant: "primary", size: "sm" })}
              >
                Go to Dashboard
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-slate-500 hover:text-slate-800"
              >
                <LogOut className="h-4 w-4 mr-1.5" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className={buttonVariants({
                  variant: "primary",
                  size: "sm",
                  className: "group flex items-center gap-1.5",
                })}
              >
                Get Started Free
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Trigger */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <div className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
            <Link
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100"
            >
              How It Works
            </Link>
            <Link
              href="/dashboard/discover"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100"
            >
              Explore Skills
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100"
            >
              Dashboard
            </Link>
          </div>
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {!mounted ? (
              <div className="h-10 w-full bg-slate-100 animate-pulse rounded-xl" />
            ) : user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={buttonVariants({ variant: "primary", className: "w-full justify-center" })}
                >
                  Go to Dashboard
                </Link>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="w-full justify-center"
                >
                  <LogOut className="h-4 w-4 mr-1.5" />
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={buttonVariants({ variant: "outline", className: "w-full justify-center" })}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className={buttonVariants({ variant: "primary", className: "w-full justify-center" })}
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
