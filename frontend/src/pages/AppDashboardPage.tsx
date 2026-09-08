import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useWalletBalance } from '@/hooks/useWallet';
import { useDashboardSummary } from '@/hooks/usePersonalization';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  Sparkles,
  Building,
  ArrowRight,
  ShieldCheck,
  Plus,
  Compass,
  Coins,
  Bell,
  AlertCircle,
  MessageSquare,
  Calendar,
  Layers,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Clock,
  Video,
  RotateCcw,
} from 'lucide-react';

export const AppDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useCurrentProfile();
  const { data: balanceData } = useWalletBalance();
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    isError: dashboardError,
    refetch: refetchDashboard,
  } = useDashboardSummary();

  const formatYear = (year?: string | null) => {
    switch (year) {
      case 'FIRST_YEAR':
        return '1st Year Undergraduate';
      case 'SECOND_YEAR':
        return '2nd Year Undergraduate';
      case 'THIRD_YEAR':
        return '3rd Year Junior';
      case 'FOURTH_YEAR':
        return '4th Year Senior';
      default:
        return 'Student';
    }
  };

  const formatReasonType = (reasonType: string) => {
    switch (reasonType) {
      case 'MUTUAL_EXCHANGE':
        return 'Mutual Match';
      case 'SKILL_MATCH':
        return 'Skill Match';
      case 'RECENT_SEARCH':
        return 'Recent Search';
      case 'CAMPUS_PEER':
        return 'Campus Peer';
      case 'RELATED_CATEGORY':
        return 'Related Category';
      case 'POPULAR_PLATFORM':
        return 'Trending';
      default:
        return 'Recommended';
    }
  };

  const formatSessionTime = (isoString?: string) => {
    if (!isoString) return 'Time Pending';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const profileCompletion = dashboardData?.profileCompletion;
  const completionPct = profileCompletion?.completionPercentage ?? (profile ? 70 : 30);
  const isComplete = profileCompletion?.isComplete ?? false;
  const missingFields = profileCompletion?.missingFields ?? [];

  const recommendedStudents = dashboardData?.recommendedStudents ?? [];
  const recommendedSkills = dashboardData?.recommendedSkills ?? [];
  const requestSummary = dashboardData?.requestSummary;
  const sessionSummary = dashboardData?.sessionSummary;
  const recentlyViewed = dashboardData?.recentlyViewed ?? [];

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Dashboard Hero Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#111827] border border-[rgba(212,175,106,0.30)] shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-emerald-500/[0.05] rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success" className="gap-1 text-[11px] font-medium">
                <ShieldCheck className="w-3 h-3 text-[#10B981]" />
                Campus Verified
              </Badge>
              {profile?.collegeName && (
                <Badge variant="outline" className="text-[11px] font-medium border-slate-700 text-slate-300">
                  <Building className="w-3 h-3 mr-1 text-[#D4AF6A]" />
                  {profile.collegeName}
                </Badge>
              )}
              {dashboardData?.notificationSummary && dashboardData.notificationSummary.unreadCount > 0 && (
                <Link to="/notifications">
                  <Badge variant="default" className="gap-1 text-[11px] font-semibold bg-emerald-600/90 text-white hover:bg-emerald-500">
                    <Bell className="w-3 h-3" />
                    {dashboardData.notificationSummary.unreadCount} New Alerts
                  </Badge>
                </Link>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#F8F5ED]">
              Welcome back,{' '}
              <span className="text-[#34D399]">
                {profileLoading ? 'Student' : profile?.displayName || user?.email?.split('@')[0]}
              </span>
              ! 👋
            </h1>

            <p className="text-xs sm:text-sm text-[#94A3B8] max-w-2xl leading-relaxed">
              Your personalized peer hub. Exchange knowledge, schedule live video sessions, and earn learning credits.
            </p>
          </div>

          {/* Top Metric Cards */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link to="/wallet">
              <div className="px-4 py-2.5 rounded-xl bg-[#1E293B] border border-slate-700/60 flex items-center gap-3 hover:border-[rgba(212,175,106,0.35)] transition-colors shadow-sm">
                <Coins className="w-5 h-5 text-[#10B981]" />
                <div className="text-left">
                  <p className="text-[10px] text-[#94A3B8] uppercase font-semibold tracking-wider">Credits</p>
                  <p className="text-sm font-bold text-[#F8F5ED]">{balanceData?.balance ?? 10} Balance</p>
                </div>
              </div>
            </Link>
            <Link to="/discover">
              <Button variant="default" className="gap-2 text-xs font-semibold px-4 h-11 shadow-sm">
                <Compass className="w-4 h-4" />
                Find Peers
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Quick Actions Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mr-1">Quick Actions:</span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/discover')}
          className="text-xs gap-1.5 h-8 bg-[#1E293B]/80 hover:bg-[#1E293B]"
        >
          <Search className="w-3.5 h-3.5 text-[#10B981]" />
          Discover Students
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/profile/skills')}
          className="text-xs gap-1.5 h-8 bg-[#1E293B]/80 hover:bg-[#1E293B]"
        >
          <Plus className="w-3.5 h-3.5 text-[#38BDF8]" />
          Add Skills
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/requests')}
          className="text-xs gap-1.5 h-8 bg-[#1E293B]/80 hover:bg-[#1E293B]"
        >
          <Layers className="w-3.5 h-3.5 text-[#D4AF6A]" />
          Exchange Requests
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/sessions')}
          className="text-xs gap-1.5 h-8 bg-[#1E293B]/80 hover:bg-[#1E293B]"
        >
          <Calendar className="w-3.5 h-3.5 text-[#A78BFA]" />
          My Sessions
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/messages')}
          className="text-xs gap-1.5 h-8 bg-[#1E293B]/80 hover:bg-[#1E293B]"
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#34D399]" />
          Messages
        </Button>
      </div>

      {/* 3. Profile Completion Widget (if not 100%) */}
      {!isComplete && (
        <Card className="glass-card border-l-4 border-l-[#10B981] relative overflow-hidden">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#10B981]" />
                  <h3 className="text-sm font-bold text-[#F8F5ED]">
                    Profile Completeness: <span className="text-[#10B981]">{completionPct}%</span>
                  </h3>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden max-w-xl">
                  <div
                    className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399] rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
                <p className="text-xs text-[#94A3B8]">
                  Completing your profile unlocks higher discovery ranking and accurate match recommendations.
                </p>

                {/* Missing fields pills */}
                {missingFields.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {missingFields.map((field) => (
                      <Link key={field.fieldKey} to={field.actionUrl}>
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-[#1E293B] border border-slate-700 text-[#CBD5E1] hover:border-[#10B981] hover:text-[#10B981] transition-colors">
                          <Plus className="w-3 h-3 text-[#10B981]" />
                          {field.label} (+{field.weight}%)
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="shrink-0">
                <Link to="/profile">
                  <Button variant="default" size="sm" className="gap-1.5 text-xs font-semibold h-9">
                    Complete Profile
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Main Personalized Recommendations Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#1E293B] border border-slate-700/60 text-[#10B981]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F8F5ED]">Recommended Student Peers</h2>
              <p className="text-xs text-[#94A3B8]">Curated based on your learning goals and teaching skills</p>
            </div>
          </div>
          <Link to="/discover">
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-[#94A3B8] hover:text-[#F8F5ED]">
              View all
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {dashboardLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-xl bg-[#1E293B]/40 animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : dashboardError ? (
          <Card className="glass-card text-center p-6 space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <p className="text-xs text-[#94A3B8]">Unable to load student recommendations right now.</p>
            <Button variant="secondary" size="sm" onClick={() => refetchDashboard()} className="gap-1.5 text-xs">
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </Button>
          </Card>
        ) : recommendedStudents.length === 0 ? (
          <Card className="glass-card text-center p-8 space-y-3">
            <Sparkles className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-[#F8F5ED]">No peer recommendations yet</p>
            <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
              Add skills you want to learn or skills you can teach to automatically find compatible students.
            </p>
            <Link to="/profile/skills">
              <Button variant="default" size="sm" className="text-xs mt-2">
                Add Skills to Find Matches
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedStudents.map((student) => (
              <Card
                key={student.userId}
                className="glass-card hover:border-[rgba(212,175,106,0.40)] transition-all duration-200 flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {student.avatarUrl ? (
                        <img
                          src={student.avatarUrl}
                          alt={student.displayName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#1E293B] border border-slate-700 flex items-center justify-center text-[#10B981] font-bold text-sm">
                          {student.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-sm font-bold text-[#F8F5ED] hover:text-[#10B981] transition-colors">
                          <Link to={`/users/${student.userId}`}>{student.displayName}</Link>
                        </CardTitle>
                        <p className="text-[11px] text-[#94A3B8] flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-[#D4AF6A]" />
                          {student.collegeName || 'Campus Peer'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-[#10B981]">{Math.round(student.matchScore)}%</span>
                      <span className="text-[9px] text-[#94A3B8]">Match</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0 text-xs">
                  {/* Reason badge */}
                  <div className="p-2 rounded-lg bg-[#1E293B]/70 border border-slate-800 flex items-center gap-1.5 text-[11px] text-[#34D399]">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{student.recommendationReason}</span>
                  </div>

                  {/* Skills tags */}
                  {student.teachingSkills.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-semibold">Teaches:</p>
                      <div className="flex flex-wrap gap-1">
                        {student.teachingSkills.slice(0, 3).map((skill) => (
                          <span
                            key={skill.id}
                            className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40"
                          >
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="text-[11px] text-[#94A3B8]">
                      {formatYear(student.yearOfStudy)}
                    </span>
                    <Link to={`/users/${student.userId}`}>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-medium text-[#10B981] hover:text-[#34D399]">
                        View Profile
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 5. Recommended Skills Section */}
      {recommendedSkills.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#D4AF6A]" />
              <h2 className="text-base font-bold text-[#F8F5ED]">Recommended Skills to Explore</h2>
            </div>
            <Link to="/discover" aria-label="Explore Catalog">
              <span className="text-xs text-[#94A3B8] hover:text-[#F8F5ED] flex items-center gap-1 cursor-pointer">
                Explore catalog <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {recommendedSkills.map((skill) => (
              <div
                key={skill.id}
                onClick={() => navigate(`/discover?search=${encodeURIComponent(skill.name)}`)}
                className="p-3.5 rounded-xl bg-[#1E293B]/70 border border-slate-800 hover:border-[#D4AF6A]/50 cursor-pointer transition-all hover:bg-[#1E293B] group flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-slate-700 text-[#D4AF6A]">
                    {formatReasonType(skill.recommendationReasonType)}
                  </Badge>
                  <p className="font-semibold text-xs text-[#F8F5ED] group-hover:text-[#D4AF6A] transition-colors line-clamp-1">
                    {skill.name}
                  </p>
                  <p className="text-[10px] text-[#94A3B8] line-clamp-1">{skill.categoryName}</p>
                </div>

                <p className="text-[9px] text-slate-400 mt-2 line-clamp-1">
                  {skill.recommendationReason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Active Requests & Upcoming Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Requests Card */}
        <Card className="glass-card flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#1E293B] border border-slate-700/60 text-[#D4AF6A]">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-[#F8F5ED]">Exchange Requests</CardTitle>
                  <CardDescription className="text-xs text-[#94A3B8]">Proposals and barter requests</CardDescription>
                </div>
              </div>
              <Link to="/requests">
                <Button variant="secondary" size="sm" className="h-8 text-xs">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-[#1E293B]/70 border border-slate-800 text-center">
                <p className="text-xl font-bold text-[#10B981]">{requestSummary?.incomingPendingCount ?? 0}</p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">Pending Incoming</p>
              </div>
              <div className="p-3 rounded-xl bg-[#1E293B]/70 border border-slate-800 text-center">
                <p className="text-xl font-bold text-[#38BDF8]">{requestSummary?.outgoingPendingCount ?? 0}</p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">Pending Outgoing</p>
              </div>
            </div>

            {requestSummary && requestSummary.recentRequests.length > 0 ? (
              <div className="space-y-2 pt-1">
                {requestSummary.recentRequests.slice(0, 2).map((req) => (
                  <Link key={req.requestId} to="/requests">
                    <div className="p-2.5 rounded-lg bg-[#1E293B]/40 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-2 transition-colors">
                      <div className="flex items-center gap-2 truncate">
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1.5 py-0 ${
                            req.type === 'INCOMING' ? 'text-emerald-400 border-emerald-800' : 'text-sky-400 border-sky-800'
                          }`}
                        >
                          {req.type}
                        </Badge>
                        <span className="text-xs text-[#F8F5ED] truncate font-medium">{req.skillName}</span>
                        <span className="text-[11px] text-[#94A3B8] truncate">with {req.counterpartName}</span>
                      </div>
                      <Badge variant="default" className="text-[9px] px-1.5 py-0 shrink-0">
                        {req.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#94A3B8] text-center py-2">No active exchange proposals right now.</p>
            )}
          </CardContent>

          <div className="p-4 pt-0">
            <Link to="/discover" className="w-full">
              <Button variant="outline" size="sm" className="w-full text-xs gap-1 h-8 border-slate-700">
                <Plus className="w-3.5 h-3.5 text-[#10B981]" />
                Propose New Exchange
              </Button>
            </Link>
          </div>
        </Card>

        {/* Sessions Summary Card */}
        <Card className="glass-card flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#1E293B] border border-slate-700/60 text-[#A78BFA]">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-[#F8F5ED]">Live Sessions</CardTitle>
                  <CardDescription className="text-xs text-[#94A3B8]">Teaching & learning schedules</CardDescription>
                </div>
              </div>
              <Link to="/sessions">
                <Button variant="secondary" size="sm" className="h-8 text-xs">
                  All Sessions
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-[#1E293B]/70 border border-slate-800 text-center">
                <p className="text-xl font-bold text-[#A78BFA]">{sessionSummary?.upcomingCount ?? 0}</p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">Upcoming</p>
              </div>
              <div className="p-3 rounded-xl bg-[#1E293B]/70 border border-slate-800 text-center">
                <p className="text-xl font-bold text-[#10B981]">{sessionSummary?.completedCount ?? 0}</p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">Completed</p>
              </div>
            </div>

            {sessionSummary?.nextSession ? (
              <div className="p-3.5 rounded-xl bg-[#1E293B]/80 border border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#A78BFA] font-semibold uppercase tracking-wider">Next Upcoming Session</span>
                  <Badge variant="success" className="text-[9px] px-1.5 py-0">
                    {sessionSummary.nextSession.role === 'TEACHER' ? 'Teaching' : 'Learning'}
                  </Badge>
                </div>
                <div>
                  <p className="font-bold text-sm text-[#F8F5ED]">{sessionSummary.nextSession.skillName}</p>
                  <p className="text-xs text-[#94A3B8] flex items-center gap-1 mt-0.5">
                    <User className="w-3 h-3 text-slate-500" />
                    Participant: <span className="text-slate-300 font-medium">{sessionSummary.nextSession.counterpartName}</span>
                  </p>
                  <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatSessionTime(sessionSummary.nextSession.scheduledStartTime)}</span>
                    {sessionSummary.nextSession.durationMinutes ? (
                      <span className="text-slate-400">({sessionSummary.nextSession.durationMinutes} min)</span>
                    ) : null}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link to={`/sessions/${sessionSummary.nextSession.sessionId}/call`}>
                    <Button variant="default" size="sm" className="w-full text-xs h-8 gap-1.5 font-semibold">
                      <Video className="w-3.5 h-3.5" />
                      Join Call
                    </Button>
                  </Link>
                  <Link to={`/sessions/${sessionSummary.nextSession.sessionId}/reschedule`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-8 gap-1.5 border-slate-700 text-slate-300 hover:text-white"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reschedule
                    </Button>
                  </Link>
                </div>
                <Link to={`/sessions/${sessionSummary.nextSession.sessionId}`} className="block">
                  <Button variant="ghost" size="sm" className="w-full text-xs h-7 text-slate-400 hover:text-white gap-1">
                    Open Session Room
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-4 space-y-1">
                <p className="text-xs text-[#94A3B8]">No scheduled sessions pending.</p>
                <p className="text-[11px] text-slate-500">Accepted exchange requests automatically become live sessions.</p>
              </div>
            )}
          </CardContent>

          <div className="p-4 pt-0 space-y-2">
            <Link to="/availability" className="w-full block">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5 h-8 border-slate-700/80 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30"
              >
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Manage Weekly Availability
              </Button>
            </Link>
            <Link to="/sessions" className="w-full block">
              <Button variant="ghost" size="sm" className="w-full text-xs gap-1 h-8 text-slate-400 hover:text-white">
                View Session History
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* 7. Recently Viewed Profiles */}
      {recentlyViewed.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#38BDF8]" />
              <h2 className="text-base font-bold text-[#F8F5ED]">Recently Viewed Peers</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {recentlyViewed.map((item) => (
              <Link key={item.userId} to={`/users/${item.userId}`}>
                <div className="p-3 rounded-xl bg-[#1E293B]/70 border border-slate-800 hover:border-sky-500/50 transition-all text-center space-y-2 group cursor-pointer">
                  {item.avatarUrl ? (
                    <img
                      src={item.avatarUrl}
                      alt={item.displayName}
                      className="w-10 h-10 rounded-full mx-auto object-cover border border-slate-700"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full mx-auto bg-slate-800 border border-slate-700 flex items-center justify-center text-[#38BDF8] font-bold text-xs">
                      {item.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-xs text-[#F8F5ED] group-hover:text-[#38BDF8] transition-colors truncate">
                      {item.displayName}
                    </p>
                    <p className="text-[10px] text-[#94A3B8] truncate">{item.collegeName || 'Student'}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
