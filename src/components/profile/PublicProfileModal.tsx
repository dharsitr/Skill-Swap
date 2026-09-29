"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DiscoverableUser, reviewService } from "@/lib/supabase/services";
import { MatchResult } from "@/lib/matching";
import { ReviewWithProfiles, RatingSummary } from "@/types";
import { StarRating, RatingSummaryCard, ReviewList } from "@/components/reviews";
import {
  MapPin,
  Globe,
  Clock,
  Calendar,
  Sparkles,
  CheckCircle2,
  GraduationCap,
  BookOpen,
  Send,
  Loader2,
  MessageSquare,
  Award,
} from "lucide-react";

interface PublicProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: DiscoverableUser | null;
  matchResult?: MatchResult | null;
  isConnectionPending?: boolean;
  onConnect?: (user: DiscoverableUser) => void;
  isConnecting?: boolean;
  onBookSession?: (user: DiscoverableUser) => void;
}

export function PublicProfileModal({
  isOpen,
  onClose,
  user,
  matchResult,
  isConnectionPending = false,
  onConnect,
  isConnecting = false,
  onBookSession,
}: PublicProfileModalProps) {
  const [reviews, setReviews] = useState<ReviewWithProfiles[]>([]);
  const [ratingSummary, setRatingSummary] = useState<RatingSummary>({
    averageRating: 0.0,
    totalReviews: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  useEffect(() => {
    if (isOpen && user?.id) {
      setIsLoadingReviews(true);
      Promise.all([
        reviewService.getUserReviews(user.id),
        reviewService.getUserRatingSummary(user.id),
      ])
        .then(([reviewsRes, summaryRes]) => {
          if (reviewsRes.data) setReviews(reviewsRes.data);
          if (summaryRes.data) setRatingSummary(summaryRes.data);
        })
        .finally(() => {
          setIsLoadingReviews(false);
        });
    }
  }, [isOpen, user?.id]);

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Peer Profile"
      description="View mentor background, skills, and weekly swap availability."
      maxWidth="lg"
    >
      <div className="space-y-6 pt-1 max-h-[75vh] overflow-y-auto pr-1">
        {/* Profile Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-3xl bg-slate-50/80 border border-slate-200/80">
          <Avatar
            src={user.avatarUrl || undefined}
            alt={user.displayName}
            size="xl"
            isOnline={true}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {user.displayName}
              </h3>
              {user.username && (
                <span className="text-xs text-slate-400 font-medium">
                  @{user.username}
                </span>
              )}
            </div>
            <p className="text-xs text-indigo-600 font-semibold mt-0.5">
              {user.headline}
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
              {user.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {user.location}
                </span>
              )}
              {user.timezone && (
                <span className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5 text-slate-400" />
                  {user.timezone}
                </span>
              )}
              <div className="flex items-center gap-1.5">
                <StarRating
                  rating={ratingSummary.averageRating}
                  size="xs"
                  showValue={true}
                  totalCount={ratingSummary.totalReviews}
                />
              </div>
            </div>
          </div>

          {/* Quick Connect CTA */}
          {onConnect && (
            <div className="w-full sm:w-auto pt-2 sm:pt-0">
              {isConnectionPending ? (
                <Button variant="secondary" size="sm" disabled className="w-full sm:w-auto">
                  <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-600" />
                  Request Sent
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onConnect(user)}
                  disabled={isConnecting}
                  className="w-full sm:w-auto font-bold shadow-xs"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                      Connect
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Explainable Match Compatibility Card */}
        {matchResult && matchResult.reasons.length > 0 && (
          <div
            className={`p-4 rounded-2xl border ${
              matchResult.matchType === "mutual"
                ? "bg-emerald-50/70 border-emerald-200/80"
                : matchResult.matchType === "can_learn"
                ? "bg-indigo-50/70 border-indigo-200/80"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles
                className={`h-4 w-4 ${
                  matchResult.matchType === "mutual"
                    ? "text-emerald-600"
                    : "text-indigo-600"
                }`}
              />
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  matchResult.matchType === "mutual"
                    ? "text-emerald-900"
                    : matchResult.matchType === "can_learn"
                    ? "text-indigo-900"
                    : "text-slate-700"
                }`}
              >
                {matchResult.badgeText} ({matchResult.score}% Relevance)
              </span>
            </div>
            <ul className="space-y-1 text-xs text-slate-700">
              {matchResult.reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-slate-400 leading-tight">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* About / Bio */}
        {user.bio && (
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              About
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed p-4 rounded-2xl bg-white border border-slate-200/80">
              {user.bio}
            </p>
          </div>
        )}

        {/* Skills Section (Teach & Learn) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Skills They Teach */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-2.5">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-900">
                Skills They Teach ({user.teachSkills.length})
              </h4>
            </div>
            {user.teachSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {user.teachSkills.map((s) => (
                  <Badge
                    key={s.id}
                    variant="success"
                    size="sm"
                    className="flex items-center gap-1 font-semibold"
                  >
                    {s.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No teaching skills listed.</p>
            )}
          </div>

          {/* Skills They Want to Learn */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-2.5">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-slate-900">
                Learning Goals ({user.learnSkills.length})
              </h4>
            </div>
            {user.learnSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {user.learnSkills.map((s) => (
                  <Badge
                    key={s.id}
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-1 font-semibold"
                  >
                    {s.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No learning goals listed.</p>
            )}
          </div>
        </div>

        {/* Availability Schedule */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-900">Weekly Availability</h4>
          </div>

          {user.availability.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {user.availability.map((slot) => (
                <div
                  key={slot.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs"
                >
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[11px]">
                    {slot.dayName}
                  </span>
                  <div className="flex items-center gap-1 text-slate-600 font-medium">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span>
                      {slot.startTime.slice(0, 5)} – {slot.endTime.slice(0, 5)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : user.availableDays.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {user.availableDays.map((day) => (
                <span
                  key={day}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs"
                >
                  {day}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No specific time slots published.</p>
          )}
        </div>

        {/* Community Reputation & Reviews */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Award className="h-4 w-4 text-indigo-600" />
              <span>Reviews & Reputation</span>
            </h4>
            {ratingSummary.totalReviews > 0 && (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                {ratingSummary.averageRating.toFixed(1)} ★ ({ratingSummary.totalReviews})
              </span>
            )}
          </div>

          <RatingSummaryCard summary={ratingSummary} />

          <ReviewList reviews={reviews} isLoading={isLoadingReviews} />
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>

          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/messages?userId=${user.id}`}
              onClick={onClose}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
              Message
            </Link>

            {onBookSession && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onBookSession(user);
                }}
                className="text-xs font-bold shadow-xs bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5"
              >
                <Calendar className="h-3.5 w-3.5" />
                Book 1-on-1 Session
              </Button>
            )}
            {onConnect && !isConnectionPending && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onConnect(user);
                }}
                disabled={isConnecting}
                className="text-xs font-semibold"
              >
                Propose Swap
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
