"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  sessionService,
  creditService,
  discoveryService,
  skillService,
  SessionWithRelations,
  DiscoverableUser,
  DiscoverableSkill,
  UserSkillWithDetails,
} from "@/lib/supabase/services";
import { SessionDetailsModal } from "@/components/sessions/SessionDetailsModal";
import { BookingModal } from "@/components/sessions/BookingModal";
import {
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  Coins,
  Plus,
  Compass,
  Video,
  GraduationCap,
} from "lucide-react";

export default function DashboardOverviewPage() {
  const { user, profile } = useAuth();
  const { showToast, onboardingData } = useApp();

  // Supabase state
  const [realSessions, setRealSessions] = useState<SessionWithRelations[]>([]);
  const [userBalance, setUserBalance] = useState<number>(50);
  const [isLoading, setIsLoading] = useState(true);

  // Recommendations state: mentors matching skills the user needs to learn
  const [recommendedMentors, setRecommendedMentors] = useState<
    { mentor: DiscoverableUser; matchedSkill: DiscoverableSkill }[]
  >([]);
  const [userLearnSkills, setUserLearnSkills] = useState<UserSkillWithDetails[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(true);

  // Modals state
  const [selectedSession, setSelectedSession] = useState<SessionWithRelations | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [preselectedMentor, setPreselectedMentor] = useState<DiscoverableUser | null>(null);
  const [preselectedSkillId, setPreselectedSkillId] = useState<string | undefined>(undefined);

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setIsLoadingRecs(true);
    try {
      const [sessRes, creditRes, learnRes, mentorsRes] = await Promise.all([
        sessionService.getUserSessions(user.id),
        creditService.getUserCreditBalance(user.id),
        skillService.getUserSkills(user.id, "learn"),
        discoveryService.getDiscoverableUsers(user.id),
      ]);

      if (sessRes.data) {
        setRealSessions(sessRes.data);
      }
      if (creditRes.data) {
        setUserBalance(creditRes.data.balance);
      }

      // Skills the user needs to learn
      const learnSkills = learnRes.data || [];
      setUserLearnSkills(learnSkills);

      // Collect target learning skill names from database user_skills (and onboardingData fallback)
      const learnNames = new Set(
        learnSkills
          .map((s) => s.skill?.name?.toLowerCase().trim())
          .filter(Boolean) as string[]
      );

      if (learnNames.size === 0 && onboardingData?.learningSkills) {
        onboardingData.learningSkills.forEach((s: string) => {
          if (s) learnNames.add(s.toLowerCase().trim());
        });
      }

      // Filter mentors who teach only what the user needs to learn
      const matches: { mentor: DiscoverableUser; matchedSkill: DiscoverableSkill }[] = [];
      const mentors = mentorsRes.data || [];

      for (const mentor of mentors) {
        // Find if this mentor teaches ANY skill the user wants to learn
        const matched = mentor.teachSkills.find((ts) =>
          Array.from(learnNames).some((ln) => {
            const tsNorm = ts.name.toLowerCase().trim();
            return tsNorm === ln || tsNorm.includes(ln) || ln.includes(tsNorm);
          })
        );

        if (matched) {
          matches.push({ mentor, matchedSkill: matched });
        }
      }

      setRecommendedMentors(matches.slice(0, 4));
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
      setIsLoadingRecs(false);
    }
  }, [user, onboardingData?.learningSkills]);


  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [user, loadData]);

  const upcomingSessions = realSessions.filter((s) => s.status === "confirmed");
  const pendingRequests = realSessions.filter((s) => s.status === "pending");

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Explorer";

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Good morning, {displayName.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Keep learning, keep growing. You have {upcomingSessions.length} confirmed session{upcomingSessions.length === 1 ? "" : "s"} scheduled.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setBookingModalOpen(true)}
          className="font-bold shadow-xs self-start sm:self-auto flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Book Session
        </Button>
      </div>

      {/* Your Credits Banner */}
      <Card className="rounded-3xl border-slate-200/90 shadow-xs p-6 sm:p-8 bg-gradient-to-br from-white via-indigo-50/25 to-violet-50/20 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
              Your Available Credits
            </span>
            <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>{userBalance}</span>
              <span className="text-lg font-bold text-indigo-600">Credits</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ≈ {userBalance * 3} minutes of 1-on-1 learning time
            </p>
            <Link
              href="/dashboard/credits"
              className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 group"
            >
              <span>View Credit Wallet & Ledger</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-300 flex items-center justify-center text-white shadow-lg shadow-amber-500/25 flex-shrink-0 text-3xl sm:text-4xl">
            <Coins className="h-8 w-8 sm:h-10 sm:w-10 text-amber-900/80" />
          </div>
        </div>
      </Card>

      {/* Upcoming Sessions Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Upcoming Sessions</h3>
          </div>
          <Link
            href="/dashboard/sessions"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            View all ({realSessions.length}) →
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white border border-slate-200 animate-pulse flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                  <div className="space-y-2">
                    <div className="w-32 h-4 bg-slate-200 rounded" />
                    <div className="w-48 h-3 bg-slate-100 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : upcomingSessions.length > 0 ? (
          <div className="space-y-3">
            {upcomingSessions.slice(0, 3).map((sess) => {
              const isTeacher = sess.teacher_id === user?.id;
              const partner = isTeacher ? sess.learner : sess.teacher;
              const scheduledDate = new Date(sess.scheduled_at);
              const formattedDate = scheduledDate.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              });
              const formattedTime = scheduledDate.toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <Card
                  key={sess.id}
                  onClick={() => {
                    setSelectedSession(sess);
                    setDetailsModalOpen(true);
                  }}
                  className="rounded-2xl border-slate-200/90 hover:border-indigo-300 hover:shadow-md transition-all p-4 sm:p-5 cursor-pointer bg-white group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar
                        src={partner?.avatar_url || undefined}
                        alt={partner?.display_name || "Partner"}
                        size="md"
                        isOnline={true}
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {sess.skill?.name || "Skill Swap"}
                          </h4>
                          <Badge variant={isTeacher ? "indigo" : "secondary"} size="sm">
                            {isTeacher ? "Teaching" : "Learning"}
                          </Badge>
                          <Badge variant="success" size="sm">
                            Confirmed
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span>
                            with <strong className="text-slate-700">{partner?.display_name || "Partner"}</strong>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-medium text-indigo-600">
                            <Clock className="h-3 w-3" />
                            {formattedDate} at {formattedTime}
                          </span>
                          <span>•</span>
                          <span>{sess.duration || 30} mins</span>
                          <span>•</span>
                          <span className="font-semibold text-amber-600">
                            {sess.credit_amount || 10} Credits
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Link
                        href={`/dashboard/sessions/${sess.id}/room`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="primary"
                          size="sm"
                          className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 shadow-xs"
                        >
                          <Video className="w-3.5 h-3.5" />
                          Join Call
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSession(sess);
                          setDetailsModalOpen(true);
                        }}
                        className="text-xs font-semibold"
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-6 rounded-2xl border-dashed border-slate-200 bg-slate-50/50 text-center">
            <p className="text-sm text-slate-600 font-medium">No upcoming sessions right now.</p>
            <p className="text-xs text-slate-400 mt-1">
              {pendingRequests.length > 0
                ? `You have ${pendingRequests.length} pending request(s) awaiting approval.`
                : "Explore our mentor community to book your next 1-on-1 swap."}
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <Link href="/dashboard/discover">
                <Button variant="outline" size="sm" className="font-semibold text-xs">
                  <Compass className="h-3.5 w-3.5 mr-1" />
                  Find Mentors
                </Button>
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setBookingModalOpen(true)}
                className="font-bold text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Schedule a Swap
              </Button>
            </div>
          </Card>
        )}
      </section>

      {/* Recommended For You Section — Matched with mentors who teach what user needs to learn */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recommended for you</h3>
          </div>
          <Link
            href="/dashboard/discover"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            Explore all mentors →
          </Link>
        </div>

        {isLoadingRecs ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-44 rounded-2xl bg-slate-100/70 border border-slate-200/60 animate-pulse p-5"
              />
            ))}
          </div>
        ) : recommendedMentors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendedMentors.map(({ mentor, matchedSkill }) => (
              <Card
                key={`${mentor.id}-${matchedSkill.id}`}
                className="rounded-2xl border-slate-200/90 hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-500/5 transition-all p-5 flex flex-col justify-between group cursor-pointer bg-white"
                onClick={() => {
                  setPreselectedMentor(mentor);
                  setPreselectedSkillId(matchedSkill.id);
                  setBookingModalOpen(true);
                }}
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar
                      src={mentor.avatarUrl || undefined}
                      alt={mentor.displayName}
                      size="md"
                      isOnline={true}
                    />
                    <div className="min-w-0 flex-1">
                      <h5 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {mentor.displayName}
                      </h5>
                      <p className="text-xs text-slate-400 truncate">
                        {mentor.headline || "Peer Mentor"}
                      </p>
                    </div>
                  </div>

                  <div className="mb-2">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">
                      Teaches what you want to learn:
                    </span>
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-bold">
                      <Sparkles className="h-3 w-3 mr-1 text-indigo-600" />
                      {matchedSkill.name}
                    </Badge>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-400">
                    {mentor.location || "Remote"}
                  </span>
                  <span className="font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Book Swap →
                  </span>
                </div>
              </Card>
            ))}
          </div>
        ) : userLearnSkills.length === 0 ? (
          <Card className="rounded-2xl border-dashed border-slate-200 p-6 text-center bg-slate-50/50">
            <GraduationCap className="h-8 w-8 text-indigo-500 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-bold text-slate-800">Add skills you want to learn</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Tell us what skills you&apos;re looking to acquire, and we&apos;ll automatically recommend matching mentors who teach them.
            </p>
            <div className="mt-3">
              <Link href="/dashboard/settings">
                <Button size="sm" variant="outline" className="font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Learn Skills in Settings
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <Card className="rounded-2xl border-slate-200 p-6 text-center bg-slate-50/50">
            <Compass className="h-8 w-8 text-indigo-500 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-bold text-slate-800">No mentors currently teaching your learning skills</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              You&apos;re currently looking to learn:{" "}
              <span className="font-semibold text-slate-700">
                {userLearnSkills.map((s) => s.skill?.name).filter(Boolean).join(", ")}
              </span>
              . Browse the full directory to find available community peers.
            </p>
            <div className="mt-3">
              <Link href="/dashboard/discover">
                <Button size="sm" variant="primary" className="font-bold">
                  Explore All Community Mentors
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </section>

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => {
          setBookingModalOpen(false);
          setPreselectedMentor(null);
          setPreselectedSkillId(undefined);
        }}
        preselectedMentor={preselectedMentor}
        preselectedSkillId={preselectedSkillId}
        onBookingSuccess={() => {
          showToast("Session booking requested!");
          loadData();
        }}
      />


      {/* Session Details Modal */}
      {selectedSession && user && (
        <SessionDetailsModal
          session={selectedSession}
          currentUserId={user.id}
          isOpen={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedSession(null);
          }}
          onSessionUpdated={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
}
