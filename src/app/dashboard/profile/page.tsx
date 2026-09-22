"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Globe,
  Star,
  Edit,
  Coins,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";

export default function ProfilePage() {
  const { onboardingData, userCredits, transactions } = useApp();

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <PageHeader
        title="My Profile"
        description="Public view of your SkillSwap reputation, credentials, and exchange history."
        action={
          <Link href="/dashboard/settings">
            <Button variant="outline" size="md" className="font-bold">
              <Edit className="h-4 w-4 mr-1.5" />
              Edit Profile
            </Button>
          </Link>
        }
      />

      {/* Profile Hero Card */}
      <Card className="p-6 sm:p-8 rounded-3xl border-slate-200 bg-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Avatar src={onboardingData.avatarUrl} size="xl" isOnline={true} className="ring-4 ring-indigo-50 shadow-md" />
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">{onboardingData.fullName}</h2>
              <p className="text-sm font-bold text-indigo-600 mt-0.5">{onboardingData.headline}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {onboardingData.location}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5 text-slate-400" />
                  {onboardingData.timezone}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-800 font-bold">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  5.0 (12 reviews)
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center gap-3 self-stretch sm:self-auto">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-900 block">
                Wallet Balance
              </span>
              <span className="text-xl font-black text-slate-900">{userCredits} Credits</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">About Me</h4>
          <p className="text-sm text-slate-700 leading-relaxed max-w-3xl">{onboardingData.bio}</p>
        </div>
      </Card>

      {/* Skills & Availability Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skills Breakdown */}
        <Card className="p-6 rounded-3xl border-slate-200">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-base font-bold">Skills Portfolio</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Can Teach ({onboardingData.teachingSkills.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {onboardingData.teachingSkills.map((s) => (
                  <Badge key={s} variant="indigo" size="md">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Learning Goals ({onboardingData.learningSkills.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {onboardingData.learningSkills.map((s) => (
                  <Badge key={s} variant="secondary" size="md">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Availability Schedule */}
        <Card className="p-6 rounded-3xl border-slate-200">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-base font-bold">Availability Window</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4 text-xs">
            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider block mb-2">Available Days</span>
              <div className="flex flex-wrap gap-1.5">
                {onboardingData.availableDays.map((d) => (
                  <span key={d} className="px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-700">
                    {d}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider block mb-2">Preferred Slots</span>
              <div className="space-y-1">
                {onboardingData.preferredSlots.map((slot) => (
                  <div key={slot} className="flex items-center gap-2 text-slate-700 font-semibold">
                    <Clock className="h-3.5 w-3.5 text-indigo-600" />
                    <span>{slot}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-600 font-medium">
              <span>Default Duration:</span>
              <strong className="text-slate-900">{onboardingData.sessionDuration}</strong>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History Log */}
      <Card className="p-6 rounded-3xl border-slate-200">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-base font-bold">Recent Credits Activity</CardTitle>
        </CardHeader>
        <div className="divide-y divide-slate-100">
          {transactions.map((tx) => (
            <div key={tx.id} className="py-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${
                    tx.amount > 0 ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tx.amount > 0 ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{tx.title}</div>
                  <div className="text-slate-400">{tx.date}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-black ${tx.amount > 0 ? "text-emerald-600" : "text-slate-700"}`}>
                  {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Credits
                </div>
                <span className="text-[10px] font-semibold text-slate-400">{tx.status}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
