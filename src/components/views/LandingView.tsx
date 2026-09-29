"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { POPULAR_SKILLS, SKILL_CATEGORIES } from "@/data/mockData";
import {
  Sparkles,
  ArrowRight,
  Search,
  CheckCircle2,
  Video,
  Coins,
  Share2,
  Star,
  Flame,
} from "lucide-react";

export function LandingView() {
  const router = useRouter();
  const { setActiveScreen, setAuthMode, onboardingData, updateOnboardingData, showToast } = useApp();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredSkills = POPULAR_SKILLS.filter((skill) => {
    const matchesCat = selectedCategory === "All" || skill.category === selectedCategory;
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200/60 bg-gradient-to-b from-white via-indigo-50/20 to-slate-50/50">
        {/* Subtle Decorative Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/70 text-indigo-700 text-xs font-bold mb-6 shadow-xs animate-in fade-in slide-in-from-bottom-2">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>The Zero-Money Skill Barter Network</span>
            <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-extrabold">NEW</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.08] mb-6">
            Learn something. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent">
              Teach something.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-xl text-slate-600 font-normal leading-relaxed mb-10">
            Exchange your expertise 1-on-1 with talented peers across the globe.
            No subscriptions, no fees — just mutual learning powered by time credits.
          </p>

          {/* Interactive Search Bar in Hero */}
          <div className="max-w-xl mx-auto mb-10">
            <div className="relative flex items-center shadow-lg shadow-indigo-500/5 rounded-2xl bg-white border border-slate-200 p-1.5 transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10">
              <Search className="h-5 w-5 text-slate-400 ml-3 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Try 'React', 'Figma', 'Spanish', or 'Python'..."
                className="w-full px-3 py-2.5 text-sm text-slate-900 bg-transparent outline-none placeholder:text-slate-400"
              />
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  if (searchQuery.trim()) {
                    if (!onboardingData.learningSkills.includes(searchQuery.trim())) {
                      updateOnboardingData({ learningSkills: [...onboardingData.learningSkills, searchQuery.trim()] });
                    }
                    showToast(`Searching peers for "${searchQuery.trim()}"...`);
                  }
                  if (user) {
                    router.push("/dashboard/discover");
                  } else {
                    setAuthMode("signup");
                    setActiveScreen("auth");
                    router.push("/signup");
                  }
                }}
                className="rounded-xl flex-shrink-0"
              >
                Find Swaps
              </Button>
            </div>
          </div>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                if (user) {
                  router.push("/dashboard");
                } else {
                  setAuthMode("signup");
                  setActiveScreen("auth");
                  router.push("/signup");
                }
              }}
              className="w-full sm:w-auto shadow-md shadow-indigo-500/25 group text-base font-bold"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                if (user) {
                  router.push("/");
                } else {
                  setAuthMode("login");
                  setActiveScreen("auth");
                  router.push("/login");
                }
              }}
              className="w-full sm:w-auto text-base font-semibold"
            >
              Sign In
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>100% Free Knowledge Exchange</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>50 Free Welcome Credits</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Verified Global Community</span>
            </div>
          </div>
        </div>
      </section>

      {/* Community Stats Strip */}
      <section className="bg-white border-b border-slate-200/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="pt-4 md:pt-0">
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">28,000+</div>
              <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Skill Swaps Completed</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-3xl font-extrabold text-indigo-600 tracking-tight">450+</div>
              <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Unique Skills Offered</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">4.9 / 5</div>
              <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider flex items-center justify-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span>Peer Satisfaction</span>
              </div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">$0</div>
              <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Money Spent by Learners</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (3-step cards) */}
      <section className="py-20 bg-slate-50/70 border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">Simple & Equitable</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How SkillSwap Works
            </h3>
            <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
              No money changes hands. You earn credits by mentoring others and spend them on any skill you wish to master.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <Card className="relative p-6 sm:p-8 rounded-3xl border-slate-200 hover:shadow-lg hover:shadow-slate-100 transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Share2 className="h-6 w-6" />
              </div>
              <span className="text-xs font-black text-indigo-600 tracking-wider uppercase mb-1 block">Step 01</span>
              <h4 className="text-xl font-bold text-slate-900 mb-3">List Skills You Teach</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Whether you code in Python, design in Figma, or speak conversational French — list what you can share with peers.
              </p>
            </Card>

            {/* Step 2 */}
            <Card className="relative p-6 sm:p-8 rounded-3xl border-slate-200 hover:shadow-lg hover:shadow-slate-100 transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Video className="h-6 w-6" />
              </div>
              <span className="text-xs font-black text-violet-600 tracking-wider uppercase mb-1 block">Step 02</span>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Swap via 1-on-1 Sessions</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Match with vetted peers, pick mutually convenient time slots, and connect directly in focused interactive sessions.
              </p>
            </Card>

            {/* Step 3 */}
            <Card className="relative p-6 sm:p-8 rounded-3xl border-slate-200 hover:shadow-lg hover:shadow-slate-100 transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Coins className="h-6 w-6" />
              </div>
              <span className="text-xs font-black text-amber-600 tracking-wider uppercase mb-1 block">Step 03</span>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Earn & Spend Credits</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every hour you teach adds credits to your balance. Redeem them anytime to learn new disciplines from other experts.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Popular Skills Explorer Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-orange-600">Explore Catalog</span>
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">Popular Skills on SkillSwap</h3>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {SKILL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Skills Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map((skill) => (
              <div
                key={skill.id}
                onClick={() => {
                  if (!onboardingData.learningSkills.includes(skill.name)) {
                    updateOnboardingData({ learningSkills: [...onboardingData.learningSkills, skill.name] });
                  }
                  showToast(`Selected "${skill.name}" as a learning goal!`);
                  setActiveScreen("onboarding");
                }}
                className="group flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/5 bg-white transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                    {skill.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {skill.name}
                    </h5>
                    <span className="text-xs text-slate-400">{skill.learners}</span>
                  </div>
                </div>
                <Badge variant="indigo" size="sm">
                  {skill.category}
                </Badge>
              </div>
            ))}
          </div>

          {/* Bottom Banner inside catalog */}
          <div className="mt-12 p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div>
              <h4 className="text-xl sm:text-2xl font-black mb-2">Have a unique skill to share?</h4>
              <p className="text-indigo-200 text-sm max-w-xl">
                Join our 5-step onboarding in under 2 minutes. Get 50 free credits right away.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                if (user) {
                  router.push("/dashboard");
                } else {
                  setAuthMode("signup");
                  setActiveScreen("auth");
                  router.push("/signup");
                }
              }}
              className="bg-white text-indigo-950 hover:bg-indigo-50 font-bold flex-shrink-0"
            >
              Get Started Free →
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm">
          <div className="flex items-center gap-2 text-white font-bold">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>SkillSwap</span>
            <span className="text-slate-500 font-normal ml-2">© 2026. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-xs font-semibold">
            <button onClick={() => setActiveScreen("landing")} className="hover:text-white transition-colors">
              Terms of Service
            </button>
            <button onClick={() => setActiveScreen("landing")} className="hover:text-white transition-colors">
              Privacy Policy
            </button>
            <button onClick={() => setActiveScreen("dashboard")} className="hover:text-white transition-colors">
              Explore Dashboard
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
