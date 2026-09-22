"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react";

export function AuthView() {
  const router = useRouter();
  const { authMode, setAuthMode, setActiveScreen, showToast, updateOnboardingData } = useApp();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === "signup") {
      if (fullName) {
        updateOnboardingData({ fullName });
      }
      showToast("Account created successfully! Welcome to SkillSwap 🎉");
      setActiveScreen("onboarding");
      router.push("/onboarding");
    } else {
      showToast("Welcome back, Dharsit! Logged in successfully ✨");
      setActiveScreen("dashboard");
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background radial highlight */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-500/10 blur-[100px] pointer-events-none rounded-full" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 group mb-3"
          >
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              Skill<span className="text-indigo-600">Swap</span>
            </span>
          </Link>
          <p className="text-sm text-slate-500">The 1-on-1 peer skill exchange network</p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-xl shadow-slate-200/50 border-slate-200/90 rounded-3xl p-6 sm:p-8">
          {/* Mode Switcher Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-6 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setAuthMode("login")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === "login"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("signup")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === "signup"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Create Account
            </button>
          </div>

          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">
              {authMode === "login" ? "Welcome back" : "Join the community"}
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              {authMode === "login"
                ? "Enter your credentials to access your SkillSwap dashboard."
                : "Sign up in 30 seconds to start exchanging skills."}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === "signup" && (
                <Input
                  label="Full Name"
                  placeholder="e.g. Dharsit R"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  leftIcon={<User className="h-4 w-4" />}
                  required
                />
              )}

              <Input
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4" />}
                required
              />

              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                required
              />

              {authMode === "login" && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-slate-600 cursor-pointer font-medium">
                    <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
                    Remember me
                  </label>
                  <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-700">
                    Forgot password?
                  </a>
                </div>
              )}

              <Button type="submit" variant="primary" size="lg" className="w-full mt-2 font-bold group">
                <span>{authMode === "login" ? "Sign In" : "Get Started (Free)"}</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>

            {/* Social Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Or continue with
              </span>
            </div>

            {/* Social Mock Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  showToast("Google OAuth simulated");
                  setActiveScreen("onboarding");
                }}
                className="w-full text-xs font-semibold"
              >
                <svg className="h-4 w-4 mr-1.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Google
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  showToast("GitHub OAuth simulated");
                  setActiveScreen("onboarding");
                }}
                className="w-full text-xs font-semibold"
              >
                <svg className="h-4 w-4 mr-1.5 fill-slate-900" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                GitHub
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            ← Back to Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
}
