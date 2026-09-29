"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/states/LoadingState";
import { ErrorState } from "@/components/ui/states/ErrorState";
import { EmptyState } from "@/components/ui/states/EmptyState";
import {
  skillService,
  availabilityService,
  creditService,
  reviewService,
  DAY_NAME_MAP,
  UserSkillWithDetails,
} from "@/lib/supabase/services";
import { AvailabilityRow, CreditTransactionRow } from "@/types/database.types";
import { ReviewWithProfiles, RatingSummary } from "@/types";
import { StarRating, RatingSummaryCard, ReviewList } from "@/components/reviews";
import {
  MapPin,
  Globe,
  Star,
  Edit,
  Coins,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  GraduationCap,
  Calendar,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading } = useAuth();

  const [teachSkills, setTeachSkills] = useState<UserSkillWithDetails[]>([]);
  const [learnSkills, setLearnSkills] = useState<UserSkillWithDetails[]>([]);
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [realTransactions, setRealTransactions] = useState<CreditTransactionRow[]>([]);
  const [realBalance, setRealBalance] = useState<number>(50);
  const [reviews, setReviews] = useState<ReviewWithProfiles[]>([]);
  const [ratingSummary, setRatingSummary] = useState<RatingSummary>({
    averageRating: 0.0,
    totalReviews: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUserData = useCallback(async () => {
    if (!user?.id) return;
    setLoadingData(true);
    setError(null);

    try {
      // 1. Fetch user skills
      const skillsRes = await skillService.getUserSkills(user.id);
      if (skillsRes.error) {
        throw new Error(skillsRes.error);
      }
      const allSkills = skillsRes.data || [];
      setTeachSkills(allSkills.filter((s) => s.type === "teach"));
      setLearnSkills(allSkills.filter((s) => s.type === "learn"));

      // 2. Fetch user availability
      const availRes = await availabilityService.getUserAvailability(user.id);
      if (availRes.error) {
        throw new Error(availRes.error);
      }
      setAvailability(availRes.data || []);

      // 3. Fetch real credits and transactions
      const [balRes, txRes, reviewsRes, summaryRes] = await Promise.all([
        creditService.getUserCreditBalance(user.id),
        creditService.getUserTransactions(user.id),
        reviewService.getUserReviews(user.id),
        reviewService.getUserRatingSummary(user.id),
      ]);
      if (balRes.data) setRealBalance(balRes.data.balance);
      if (txRes.data) setRealTransactions(txRes.data);
      if (reviewsRes.data) setReviews(reviewsRes.data);
      if (summaryRes.data) setRatingSummary(summaryRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile details.");
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user?.id) {
      loadUserData();
    }
  }, [authLoading, user?.id, loadUserData]);

  if (authLoading || loadingData) {
    return (
      <div className="py-12">
        <LoadingState message="Loading your profile..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <ErrorState
          title="Could not load profile"
          message={error}
          onRetry={loadUserData}
        />
      </div>
    );
  }

  const displayName = profile?.display_name || user?.user_metadata?.full_name || "SkillSwap Learner";
  const headline = profile?.headline || "Peer Learner & Mentor";
  const bio = profile?.bio || "No bio added yet. Tell other learners about yourself!";
  const location = profile?.location || "Remote / Online";
  const timezone = profile?.timezone || "UTC";
  const avatarUrl = profile?.avatar_url || undefined;

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
            <Avatar src={avatarUrl} alt={displayName} size="xl" isOnline={true} className="ring-4 ring-indigo-50 shadow-md" />
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">{displayName}</h2>
              <p className="text-sm font-bold text-indigo-600 mt-0.5">{headline}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {location}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5 text-slate-400" />
                  {timezone}
                </span>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <StarRating
                    rating={ratingSummary.averageRating}
                    size="sm"
                    showValue={true}
                    totalCount={ratingSummary.totalReviews}
                  />
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/dashboard/credits"
            className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center gap-3 self-stretch sm:self-auto hover:bg-indigo-100/70 transition-all cursor-pointer group"
            title="Open Wallet Dashboard"
          >
            <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-xs group-hover:scale-105 transition-transform">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-900 block">
                Wallet Balance · View Details →
              </span>
              <span className="text-xl font-black text-slate-900">{realBalance} Credits</span>
            </div>
          </Link>
        </div>

        {/* Bio */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">About Me</h4>
          <p className="text-sm text-slate-700 leading-relaxed max-w-3xl">{bio}</p>
        </div>
      </Card>

      {/* Skills & Availability Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skills Breakdown */}
        <Card className="p-6 rounded-3xl border-slate-200">
          <CardHeader className="p-0 mb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold">Skills Portfolio</CardTitle>
            <Link href="/dashboard/skills" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
              Manage →
            </Link>
          </CardHeader>
          <CardContent className="p-0 space-y-5">
            {/* Teaching Skills */}
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Can Teach ({teachSkills.length})
              </span>
              {teachSkills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {teachSkills.map((item) => (
                    <Badge key={item.id} variant="indigo" size="md">
                      {item.skill?.name || "Skill"}
                    </Badge>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<GraduationCap className="h-5 w-5" />}
                  title="No teaching skills added"
                  description="Share your expertise to earn credits."
                  actionLabel="Add Teaching Skill"
                  onAction={() => {
                    router.push("/dashboard/skills");
                  }}
                  className="p-6"
                />
              )}
            </div>

            {/* Learning Goals */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Learning Goals ({learnSkills.length})
              </span>
              {learnSkills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {learnSkills.map((item) => (
                    <Badge key={item.id} variant="secondary" size="md">
                      {item.skill?.name || "Skill"}
                    </Badge>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<GraduationCap className="h-5 w-5" />}
                  title="No learning goals set"
                  description="Pick topics you are excited to master."
                  actionLabel="Add Learning Skill"
                  onAction={() => {
                    router.push("/dashboard/skills");
                  }}
                  className="p-6"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Availability Schedule */}
        <Card className="p-6 rounded-3xl border-slate-200">
          <CardHeader className="p-0 mb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold">Availability Schedule</CardTitle>
            <Link href="/dashboard/settings" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
              Edit in Settings →
            </Link>
          </CardHeader>
          <CardContent className="p-0 space-y-4 text-xs">
            {availability.length > 0 ? (
              <div className="space-y-2">
                {availability.map((slot) => {
                  const dayName = DAY_NAME_MAP[slot.day_of_week] || `Day ${slot.day_of_week}`;
                  return (
                    <div
                      key={slot.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[11px]">
                          {dayName}
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<Calendar className="h-5 w-5" />}
                title="No availability slots"
                description="Set your free hours so peers can book swaps with you."
                actionLabel="Set Availability"
                onAction={() => {
                  router.push("/dashboard/settings");
                }}
                className="p-6"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction History Log */}
      <Card className="p-6 rounded-3xl border-slate-200">
        <CardHeader className="p-0 mb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold">Recent Credits Activity</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Real-time ledger of earned and spent session credits</p>
          </div>
          <Link href="/dashboard/credits" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
            View All in Wallet →
          </Link>
        </CardHeader>
        <div className="divide-y divide-slate-100">
          {realTransactions.length > 0 ? (
            realTransactions.slice(0, 5).map((tx) => {
              const isPositive = tx.amount > 0;
              const dateFormatted = new Date(tx.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });

              return (
                <div key={tx.id} className="py-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold ${
                        isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      }`}
                    >
                      {isPositive ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{tx.description}</div>
                      <div className="text-slate-400 text-[11px]">{dateFormatted} · {tx.transaction_type.replace("_", " ")}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-black ${isPositive ? "text-emerald-600" : "text-slate-700"}`}>
                      {isPositive ? `+${tx.amount}` : tx.amount} Credits
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-400 italic py-4">No recent credit activity.</p>
          )}
        </div>
      </Card>

      {/* Reviews & Reputation Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Peer Reviews & Reputation</h3>
            <p className="text-xs text-slate-500">Verified feedback received from completed 1-on-1 skill swaps</p>
          </div>
          {ratingSummary.totalReviews > 0 && (
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              {ratingSummary.totalReviews} Total Review{ratingSummary.totalReviews === 1 ? "" : "s"}
            </span>
          )}
        </div>

        <RatingSummaryCard summary={ratingSummary} />

        <ReviewList reviews={reviews} />
      </div>
    </div>
  );
}
