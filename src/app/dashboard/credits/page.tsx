"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/states/LoadingState";
import { ErrorState } from "@/components/ui/states/ErrorState";
import { EmptyState } from "@/components/ui/states/EmptyState";
import {
  creditService,
  WalletSummary,
} from "@/lib/supabase/services";
import { CreditTransactionRow } from "@/types/database.types";
import { CREDIT_RULES } from "@/constants/config";
import {
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  GraduationCap,
  Compass,
  Clock,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Gift,
  RotateCcw,
} from "lucide-react";

export default function CreditsPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<CreditTransactionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "earned" | "spent">("all");

  const loadWalletData = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const [sumRes, txRes] = await Promise.all([
        creditService.getWalletSummary(user.id),
        creditService.getUserTransactions(user.id),
      ]);

      if (sumRes.error) throw new Error(sumRes.error);
      if (txRes.error) throw new Error(txRes.error);

      setSummary(sumRes.data);
      setTransactions(txRes.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wallet data.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user?.id) {
      loadWalletData();
    }
  }, [authLoading, user?.id, loadWalletData]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (filterType === "earned") {
      return transactions.filter((tx) => tx.amount > 0);
    }
    if (filterType === "spent") {
      return transactions.filter((tx) => tx.amount < 0);
    }
    return transactions;
  }, [transactions, filterType]);

  const balance = summary?.balance ?? CREDIT_RULES.welcomeBonus;
  const totalEarned = summary?.totalEarned ?? CREDIT_RULES.welcomeBonus;
  const totalSpent = summary?.totalSpent ?? 0;
  const learningMinutes = balance * CREDIT_RULES.sessionDurationMinutes;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Wallet & Time Credits"
          description="Earn credits by sharing your skills, and spend them to master new topics 1-on-1."
        />

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={loadWalletData}
            disabled={isLoading}
            className="text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/dashboard/discover">
            <Button variant="primary" size="sm" className="text-xs font-bold shadow-xs">
              <Compass className="h-3.5 w-3.5 mr-1.5" />
              Find Mentors
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading your wallet balance & transaction ledger..." />
      ) : error ? (
        <ErrorState
          title="Unable to load wallet"
          message={error}
          onRetry={loadWalletData}
        />
      ) : (
        <>
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Current Balance Card */}
            <Card className="p-6 rounded-3xl border-slate-200/90 bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/30 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <Coins className="h-28 w-28 text-indigo-900" />
              </div>

              <div className="flex items-center gap-2 mb-2 text-indigo-600">
                <Coins className="h-5 w-5 text-amber-500 fill-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Available Balance</span>
              </div>

              <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {balance}{" "}
                <span className="text-lg font-bold text-slate-500 font-sans">
                  {balance === 1 ? "Credit" : "Credits"}
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 font-medium">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>≈ {learningMinutes} minutes of 1-on-1 swap time</span>
              </p>

              <div className="pt-4 mt-4 border-t border-indigo-100/60 flex items-center gap-2">
                <Link href="/dashboard/skills" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                  Teach skills to earn more →
                </Link>
              </div>
            </Card>

            {/* Total Earned Card */}
            <Card className="p-6 rounded-3xl border-slate-200/90 bg-white shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Lifetime Earned
                  </span>
                  <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>

                <div className="text-2xl sm:text-3xl font-black text-slate-900">
                  +{totalEarned}{" "}
                  <span className="text-sm font-semibold text-slate-400 font-sans">Credits</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-3">
                Credits earned from completed teaching sessions and welcome rewards.
              </p>
            </Card>

            {/* Total Spent Card */}
            <Card className="p-6 rounded-3xl border-slate-200/90 bg-white shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Lifetime Spent
                  </span>
                  <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <ArrowDownLeft className="h-4 w-4" />
                  </div>
                </div>

                <div className="text-2xl sm:text-3xl font-black text-slate-900">
                  -{totalSpent}{" "}
                  <span className="text-sm font-semibold text-slate-400 font-sans">Credits</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-3">
                Credits invested in booking 1-on-1 mentorship sessions.
              </p>
            </Card>
          </div>

          {/* How Credits Work Explainer */}
          <Card className="p-6 sm:p-7 rounded-3xl border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-slate-50 to-white shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">The SkillSwap Time Economy</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/70 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 font-black text-[11px] flex items-center justify-center">
                    1
                  </span>
                  Teach & Earn
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Earn +{CREDIT_RULES.teachRewardPerSession} credits for every completed 30-minute teaching session.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/70 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded-full bg-indigo-100 text-indigo-700 font-black text-[11px] flex items-center justify-center">
                    2
                  </span>
                  Spend & Learn
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Spend {CREDIT_RULES.learnCostPerSession} credits to book a 1-on-1 swap with any expert mentor.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/70 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Fair Time Banking
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Every 1 hour you teach equals 1 hour of personalized learning in any other discipline.
                </p>
              </div>
            </div>
          </Card>

          {/* Transaction History Section */}
          <Card className="rounded-3xl border-slate-200/90 bg-white shadow-xs p-6 sm:p-7">
            <CardHeader className="p-0 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Transaction Ledger
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete immutable history of credits awarded, spent, and refunded.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterType === "all"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All ({transactions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("earned")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterType === "earned"
                      ? "bg-white text-emerald-700 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Earned
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("spent")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterType === "spent"
                      ? "bg-white text-rose-700 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Spent
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {filteredTransactions.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {filteredTransactions.map((tx) => {
                    const isPositive = tx.amount > 0;
                    const dateFormatted = new Date(tx.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={tx.id}
                        className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/80 px-2 rounded-2xl transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                              tx.transaction_type === "welcome_bonus"
                                ? "bg-indigo-50 text-indigo-600"
                                : isPositive
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-rose-50 text-rose-600"
                            }`}
                          >
                            {tx.transaction_type === "welcome_bonus" ? (
                              <Gift className="h-4 w-4" />
                            ) : tx.transaction_type === "refund" ? (
                              <RotateCcw className="h-4 w-4" />
                            ) : isPositive ? (
                              <GraduationCap className="h-4 w-4" />
                            ) : (
                              <ArrowDownLeft className="h-4 w-4" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {tx.description}
                              </span>
                              <Badge
                                variant={
                                  tx.transaction_type === "welcome_bonus"
                                    ? "indigo"
                                    : isPositive
                                    ? "success"
                                    : "secondary"
                                }
                                size="sm"
                                className="text-[10px] uppercase font-bold py-0"
                              >
                                {tx.transaction_type.replace("_", " ")}
                              </Badge>
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {dateFormatted}
                            </span>
                          </div>
                        </div>

                        {/* Amount */}
                        <div
                          className={`font-black text-sm tabular-nums whitespace-nowrap px-2.5 py-1 rounded-full ${
                            isPositive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {isPositive ? `+${tx.amount}` : tx.amount} Credits
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={<Coins className="h-6 w-6" />}
                  title="No transactions found"
                  description="Start learning or teaching skills to build your transaction ledger."
                  actionLabel="Discover Mentors"
                  onAction={() => {
                    window.location.href = "/dashboard/discover";
                  }}
                  className="p-8"
                />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
