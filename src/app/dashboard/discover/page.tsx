"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { LoadingState } from "@/components/ui/states/LoadingState";
import { EmptyState } from "@/components/ui/states/EmptyState";
import { ErrorState } from "@/components/ui/states/ErrorState";
import { PublicProfileModal } from "@/components/profile/PublicProfileModal";
import { BookingModal } from "@/components/sessions/BookingModal";
import { SKILL_CATEGORIES } from "@/constants/config";
import {
  discoveryService,
  connectionService,
  skillService,
  availabilityService,
  reviewService,
  DAY_NAME_MAP,
  DiscoverableUser,
} from "@/lib/supabase/services";
import {
  calculateMatch,
  MatchResult,
  UserSkillProfile,
} from "@/lib/matching";
import {
  Search,
  Sparkles,
  Compass,
  Send,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Loader2,
  GraduationCap,
  BookOpen,
  ArrowUpDown,
  Star,
} from "lucide-react";

const COMPATIBILITY_OPTIONS = [
  { value: "all", label: "All Peers" },
  { value: "mutual", label: "2-Way Mutual Swaps Only" },
  { value: "can_learn", label: "Can Mentor Me" },
  { value: "can_teach", label: "Looking for My Skills" },
];

const DAY_OPTIONS = [
  "Any Day",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const SORT_OPTIONS = [
  { value: "best_match", label: "Best Match (Relevance)" },
  { value: "most_skills", label: "Most Skills" },
  { value: "alphabetical", label: "Name (A–Z)" },
];

export default function DiscoverPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useApp();

  // Data states
  const [discoverableUsers, setDiscoverableUsers] = useState<DiscoverableUser[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserSkillProfile>({
    teachSkills: [],
    learnSkills: [],
    availableDays: [],
  });
  const [sentPendingIds, setSentPendingIds] = useState<Set<string>>(new Set());
  const [ratingsMap, setRatingsMap] = useState<
    Record<string, { averageRating: number; totalReviews: number }>
  >({});

  // Loading & error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [compatibility, setCompatibility] = useState("all");
  const [selectedDay, setSelectedDay] = useState("Any Day");
  const [sortBy, setSortBy] = useState("best_match");

  // Public Profile Modal State
  const [selectedProfileUser, setSelectedProfileUser] = useState<DiscoverableUser | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Connect Request Modal State
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [connectTargetUser, setConnectTargetUser] = useState<DiscoverableUser | null>(null);
  const [connectNote, setConnectNote] = useState("");
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingMentor, setBookingMentor] = useState<DiscoverableUser | null>(null);

  const handleOpenBooking = (peer: DiscoverableUser) => {
    setBookingMentor(peer);
    setBookingModalOpen(true);
  };

  // Load all discoverable peers and current user's skills
  const loadDiscoveryData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch current user skills and availability if logged in
      const userSkillsProfile: UserSkillProfile = {
        teachSkills: [],
        learnSkills: [],
        availableDays: [],
      };

      if (user?.id) {
        const [skillsRes, availRes, sentRes] = await Promise.all([
          skillService.getUserSkills(user.id),
          availabilityService.getUserAvailability(user.id),
          connectionService.getSentPendingUserIds(user.id),
        ]);

        if (skillsRes.data) {
          const teach = skillsRes.data
            .filter((s) => s.type === "teach" && s.skill)
            .map((s) => s.skill!.name);
          const learn = skillsRes.data
            .filter((s) => s.type === "learn" && s.skill)
            .map((s) => s.skill!.name);
          userSkillsProfile.teachSkills = teach;
          userSkillsProfile.learnSkills = learn;
        }

        if (availRes.data) {
          userSkillsProfile.availableDays = Array.from(
            new Set(availRes.data.map((a) => DAY_NAME_MAP[a.day_of_week] || ""))
          ).filter(Boolean);
        }

        if (sentRes.data) {
          setSentPendingIds(new Set(sentRes.data));
        }
      }

      setCurrentUserProfile(userSkillsProfile);

      // 2. Fetch discoverable peers from Supabase
      const usersRes = await discoveryService.getDiscoverableUsers(user?.id);
      if (usersRes.error) {
        throw new Error(usersRes.error);
      }

      const loadedUsers = usersRes.data || [];
      setDiscoverableUsers(loadedUsers);

      // 3. Batch fetch rating summaries for all peers
      const peerIds = loadedUsers.map((u) => u.id);
      if (peerIds.length > 0) {
        reviewService.getBatchUserRatingSummaries(peerIds).then((batchRes) => {
          if (batchRes.data) setRatingsMap(batchRes.data);
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load peer discovery.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      loadDiscoveryData();
    }
  }, [authLoading, loadDiscoveryData]);

  // Compute matches and filter results
  const matchedUsers = useMemo(() => {
    return discoverableUsers.map((peer) => {
      const candidateProfile: UserSkillProfile = {
        teachSkills: peer.teachSkills.map((s) => s.name),
        learnSkills: peer.learnSkills.map((s) => s.name),
        availableDays: peer.availableDays,
      };

      const match = calculateMatch(currentUserProfile, candidateProfile);
      return { peer, match };
    });
  }, [discoverableUsers, currentUserProfile]);

  const filteredMatches = useMemo(() => {
    const q = search.trim().toLowerCase();

    return matchedUsers
      .filter(({ peer, match }) => {
        // Keyword Search
        if (q) {
          const matchName = peer.displayName.toLowerCase().includes(q);
          const matchHeadline = peer.headline.toLowerCase().includes(q);
          const matchBio = peer.bio.toLowerCase().includes(q);
          const matchTeach = peer.teachSkills.some((s) => s.name.toLowerCase().includes(q));
          const matchLearn = peer.learnSkills.some((s) => s.name.toLowerCase().includes(q));
          if (!matchName && !matchHeadline && !matchBio && !matchTeach && !matchLearn) {
            return false;
          }
        }

        // Category Filter
        if (category !== "All") {
          const hasCategorySkill = peer.teachSkills.some((s) => s.category === category);
          if (!hasCategorySkill) return false;
        }

        // Compatibility Filter
        if (compatibility === "mutual" && match.matchType !== "mutual") {
          return false;
        }
        if (compatibility === "can_learn" && match.canLearnFromCandidate.length === 0) {
          return false;
        }
        if (compatibility === "can_teach" && match.canTeachCandidate.length === 0) {
          return false;
        }

        // Available Day Filter
        if (selectedDay !== "Any Day") {
          const isAvailable = peer.availableDays.some(
            (d) => d.toLowerCase() === selectedDay.toLowerCase()
          );
          if (!isAvailable) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "best_match") {
          return b.match.score - a.match.score;
        }
        if (sortBy === "most_skills") {
          const countA = a.peer.teachSkills.length + a.peer.learnSkills.length;
          const countB = b.peer.teachSkills.length + b.peer.learnSkills.length;
          return countB - countA;
        }
        if (sortBy === "alphabetical") {
          return a.peer.displayName.localeCompare(b.peer.displayName);
        }
        return 0;
      });
  }, [matchedUsers, search, category, compatibility, selectedDay, sortBy]);

  // Open Public Profile Modal
  const handleOpenPublicProfile = (peer: DiscoverableUser) => {
    setSelectedProfileUser(peer);
    setProfileModalOpen(true);
  };

  // Open Connect Modal
  const handleOpenConnectModal = (peer: DiscoverableUser) => {
    if (!user) {
      showToast("Please log in to connect with peers.");
      return;
    }
    setConnectTargetUser(peer);
    setConnectNote("");
    setConnectModalOpen(true);
  };

  // Submit Connection Request
  const handleSendConnection = async () => {
    if (!user?.id || !connectTargetUser) return;

    setIsSendingRequest(true);
    try {
      const res = await connectionService.sendConnectionRequest(
        user.id,
        connectTargetUser.id,
        connectNote
      );

      if (res.error) {
        showToast(res.error);
        return;
      }

      setSentPendingIds((prev) => new Set([...prev, connectTargetUser.id]));
      setConnectModalOpen(false);
      showToast(`Connection request sent to ${connectTargetUser.displayName}!`);
    } catch {
      showToast("Could not send connection request. Please try again.");
    } finally {
      setIsSendingRequest(false);
    }
  };

  // Active match for profile modal
  const selectedProfileMatch = useMemo(() => {
    if (!selectedProfileUser) return null;
    const found = matchedUsers.find((m) => m.peer.id === selectedProfileUser.id);
    return found ? found.match : null;
  }, [selectedProfileUser, matchedUsers]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Discover Mentors & Skills"
        description="Find peer experts ready to swap skills 1-on-1 with explainable mutual compatibility."
      />

      {/* Main Filter & Search Bar */}
      <div className="space-y-3.5 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs">
        {/* Keyword Search */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by mentor name, role, or skills (e.g. Python, UI/UX, React)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>

          {/* Quick Select Filters */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2.5">
            <div className="w-full sm:w-48">
              <Select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                options={DAY_OPTIONS}
                leftIcon={<Calendar className="h-4 w-4" />}
              />
            </div>
            <div className="w-full sm:w-52">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                leftIcon={<ArrowUpDown className="h-4 w-4" />}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Category & Compatibility Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Category Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Category:
            </span>
            {SKILL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  category === cat
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-50 border border-slate-200/80 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Compatibility Pill Selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {COMPATIBILITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCompatibility(opt.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  compatibility === opt.value
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Discovery Results */}
      {isLoading ? (
        <LoadingState message="Discovering peer mentors & calculating mutual matches..." />
      ) : error ? (
        <ErrorState
          title="Could not load mentors"
          message={error}
          onRetry={loadDiscoveryData}
        />
      ) : filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredMatches.map(({ peer, match }) => {
            const isPending = sentPendingIds.has(peer.id);
            const isMutual = match.matchType === "mutual";
            const canMentor = match.matchType === "can_learn";

            return (
              <Card
                key={peer.id}
                className="rounded-3xl border-slate-200/90 p-5 sm:p-6 hover:shadow-md transition-all flex flex-col justify-between bg-white group"
              >
                <div>
                  {/* Top Bar: Match Pill & Location */}
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    {/* Match Badge */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                        isMutual
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                          : canMentor
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80"
                          : match.matchType === "can_teach"
                          ? "bg-amber-50 text-amber-700 border border-amber-200/80"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{match.badgeText}</span>
                      {match.score > 50 && (
                        <span className="opacity-75">· {match.score}%</span>
                      )}
                    </div>

                    {/* Location */}
                    {peer.location && (
                      <span className="text-xs text-slate-400 flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3" />
                        {peer.location}
                      </span>
                    )}
                  </div>

                  {/* Peer Profile Summary */}
                  <div className="flex items-start gap-3.5 mb-4">
                    <button
                      type="button"
                      onClick={() => handleOpenPublicProfile(peer)}
                      className="cursor-pointer transition-transform group-hover:scale-105"
                      title="View public profile"
                    >
                      <Avatar
                        src={peer.avatarUrl || undefined}
                        alt={peer.displayName}
                        size="lg"
                        isOnline={true}
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleOpenPublicProfile(peer)}
                          className="text-left font-bold text-slate-900 text-base hover:text-indigo-600 transition-colors truncate"
                        >
                          {peer.displayName}
                        </button>
                        {ratingsMap[peer.id] && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-amber-50/80 px-2 py-0.5 rounded-full border border-amber-200/80 shadow-2xs">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                            {ratingsMap[peer.id].totalReviews > 0
                              ? ratingsMap[peer.id].averageRating.toFixed(1)
                              : "New"}
                            {ratingsMap[peer.id].totalReviews > 0 && (
                              <span className="text-slate-400 font-normal">
                                ({ratingsMap[peer.id].totalReviews})
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-indigo-600 font-semibold truncate mt-0.5">
                        {peer.headline}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                        {peer.bio}
                      </p>
                    </div>
                  </div>

                  {/* Explainable Recommendation Reason */}
                  {match.reasons.length > 0 && (
                    <div
                      className={`p-2.5 rounded-2xl mb-4 text-xs font-medium flex items-center gap-2 ${
                        isMutual
                          ? "bg-emerald-50/70 text-emerald-900 border border-emerald-100"
                          : canMentor
                          ? "bg-indigo-50/70 text-indigo-900 border border-indigo-100"
                          : "bg-slate-50 text-slate-700 border border-slate-100"
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
                      <span className="line-clamp-1">{match.reasons[0]}</span>
                    </div>
                  )}

                  {/* Skills Grid */}
                  <div className="space-y-2.5 mb-4 text-xs">
                    {/* Teaches */}
                    <div>
                      <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-1">
                        <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Teaches:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {peer.teachSkills.length > 0 ? (
                          peer.teachSkills.slice(0, 4).map((s) => {
                            const isMatch = match.canLearnFromCandidate.includes(s.name);
                            return (
                              <Badge
                                key={s.id}
                                variant={isMatch ? "success" : "default"}
                                size="sm"
                                className={isMatch ? "font-bold shadow-2xs" : ""}
                              >
                                {s.name}
                              </Badge>
                            );
                          })
                        ) : (
                          <span className="text-slate-400 italic">No skills listed</span>
                        )}
                        {peer.teachSkills.length > 4 && (
                          <span className="text-[11px] text-slate-400 self-center">
                            +{peer.teachSkills.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Looking to Learn */}
                    <div>
                      <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-1">
                        <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Looking to Learn:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {peer.learnSkills.length > 0 ? (
                          peer.learnSkills.slice(0, 4).map((s) => {
                            const isMatch = match.canTeachCandidate.includes(s.name);
                            return (
                              <Badge
                                key={s.id}
                                variant={isMatch ? "secondary" : "default"}
                                size="sm"
                                className={isMatch ? "font-bold text-indigo-700 bg-indigo-50 border-indigo-200" : ""}
                              >
                                {s.name}
                              </Badge>
                            );
                          })
                        ) : (
                          <span className="text-slate-400 italic">Open to all topics</span>
                        )}
                        {peer.learnSkills.length > 4 && (
                          <span className="text-[11px] text-slate-400 self-center">
                            +{peer.learnSkills.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3 mt-2">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      {peer.availableDays.length > 0
                        ? peer.availableDays.slice(0, 3).join(", ")
                        : "Flexible"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenPublicProfile(peer)}
                      className="text-xs font-semibold"
                    >
                      View Profile
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenBooking(peer)}
                      className="text-xs font-semibold border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex items-center gap-1"
                    >
                      <Calendar className="h-3 w-3" />
                      Book
                    </Button>

                    {isPending ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled
                        className="text-xs font-bold text-slate-500 bg-slate-100"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                        Pending
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenConnectModal(peer)}
                        className="text-xs font-bold shadow-xs"
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Compass className="h-8 w-8" />}
          title="No mentors match your current filters"
          description="Try changing the skill category, selecting another availability day, or clearing your search keywords."
          actionLabel="Reset All Filters"
          onAction={() => {
            setSearch("");
            setCategory("All");
            setCompatibility("all");
            setSelectedDay("Any Day");
            setSortBy("best_match");
          }}
          className="p-12"
        />
      )}

      {/* Public Profile View Modal */}
      <PublicProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={selectedProfileUser}
        matchResult={selectedProfileMatch}
        isConnectionPending={
          selectedProfileUser ? sentPendingIds.has(selectedProfileUser.id) : false
        }
        onConnect={(peer) => {
          setProfileModalOpen(false);
          handleOpenConnectModal(peer);
        }}
        onBookSession={(peer) => {
          setProfileModalOpen(false);
          handleOpenBooking(peer);
        }}
      />

      {/* Send Connection Request Modal */}
      <Modal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        title="Connect & Propose Swap"
        description={`Send a 1-on-1 swap connection request to ${connectTargetUser?.displayName}.`}
      >
        <div className="space-y-4 pt-2">
          {connectTargetUser && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center gap-3">
              <Avatar
                src={connectTargetUser.avatarUrl || undefined}
                alt={connectTargetUser.displayName}
                size="md"
              />
              <div className="min-w-0 flex-1 text-xs">
                <div className="font-bold text-slate-900 truncate">
                  {connectTargetUser.displayName}
                </div>
                <div className="text-indigo-700 font-semibold truncate">
                  {connectTargetUser.headline}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Introduction or Swap Note (optional)
            </label>
            <textarea
              rows={3}
              value={connectNote}
              onChange={(e) => setConnectNote(e.target.value)}
              placeholder="Hi! I saw you teach Python and want to learn React. Would love to connect and swap skills 1-on-1..."
              className="w-full p-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-indigo-500 resize-none transition-all"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConnectModalOpen(false)}
              disabled={isSendingRequest}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSendConnection}
              disabled={isSendingRequest}
              className="font-bold"
            >
              {isSendingRequest ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Send Request
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Schedule / Booking Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => {
          setBookingModalOpen(false);
          setBookingMentor(null);
        }}
        preselectedMentor={bookingMentor}
        onBookingSuccess={() => {
          showToast("Session booking requested!");
          router.push("/dashboard/sessions");
        }}
      />
    </div>
  );
}
