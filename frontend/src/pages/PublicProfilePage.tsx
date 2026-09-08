import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePublicProfile } from '@/hooks/useDiscovery';
import { useMySkills } from '@/hooks/useSkills';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useCreateConversation } from '@/hooks/useChat';
import { useRatingSummary, useUserReviews } from '@/hooks/useReviews';
import { useBlockStatus } from '@/hooks/useSafety';
import { useRecordProfileView } from '@/hooks/usePersonalization';
import {
  useFriendStatus,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useDeclineFriendRequest,
  useCancelFriendRequest,
} from '@/hooks/useFriends';
import { StarRating } from '@/components/reviews/StarRating';
import { ReviewsList } from '@/components/reviews/ReviewsList';
import { ReportModal } from '@/components/safety/ReportModal';
import { BlockModal } from '@/components/safety/BlockModal';
import { RequestExchangeModal } from '@/components/exchange/RequestExchangeModal';
import {
  ArrowLeft,
  GraduationCap,
  Building,
  BookOpen,
  Lightbulb,
  Award,
  Sparkles,
  Tag,
  AlertCircle,
  RefreshCw,
  UserCheck,
  UserPlus,
  Clock,
  Check,
  X,
  Send,
  MessageSquare,
  Star,
  ShieldAlert,
  Ban,
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { SkillProficiency } from '@/types/api';

export const PublicProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);

  const { data: profile, isLoading, isError, error, refetch } = usePublicProfile(id || '');
  const { data: mySkills } = useMySkills();
  const { data: currentProfile } = useCurrentProfile();
  const { mutate: recordProfileView } = useRecordProfileView();

  const targetUserId = profile?.userId || '';
  const { data: ratingSummary } = useRatingSummary(targetUserId);
  const { data: userReviews, isLoading: isReviewsLoading } = useUserReviews(targetUserId);
  const { data: blockStatus, refetch: refetchBlockStatus } = useBlockStatus(targetUserId);

  const { data: friendStatus, isLoading: isFriendLoading } = useFriendStatus(targetUserId);
  const { mutate: sendFriendRequest, isPending: isSendingFriend } = useSendFriendRequest();
  const { mutate: acceptFriendRequest, isPending: isAcceptingFriend } = useAcceptFriendRequest();
  const { mutate: declineFriendRequest, isPending: isDecliningFriend } = useDeclineFriendRequest();
  const { mutate: cancelFriendRequest, isPending: isCancellingFriend } = useCancelFriendRequest(targetUserId);

  React.useEffect(() => {
    if (targetUserId && currentProfile?.userId && targetUserId !== currentProfile.userId) {
      recordProfileView({ targetUserId });
    }
  }, [targetUserId, currentProfile?.userId, recordProfileView]);

  const { mutateAsync: createConversation, isPending: isCreatingChat } = useCreateConversation();

  const handleStartChat = async () => {
    if (!profile?.userId) return;
    if (friendStatus?.conversationId) {
      navigate(`/messages/${friendStatus.conversationId}`);
      return;
    }
    try {
      const conv = await createConversation(profile.userId);
      navigate(`/messages/${conv.id}`);
    } catch (err) {
      console.error('Failed to open chat:', err);
      navigate('/messages');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse" data-testid="public-profile-skeleton">
        <div className="h-8 bg-[#1E293B] rounded w-32" />
        <div className="rounded-2xl bg-[#111827] border border-slate-800 p-8 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-[#1E293B]" />
            <div className="space-y-2 flex-1">
              <div className="h-6 bg-[#1E293B] rounded w-1/3" />
              <div className="h-4 bg-[#1E293B]/60 rounded w-1/2" />
            </div>
          </div>
          <div className="h-16 bg-[#1E293B]/40 rounded" />
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="space-y-6">
        <Link to="/discover">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-[#94A3B8] hover:text-[#F8F5ED]">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Discover</span>
          </Button>
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle className="text-sm font-semibold">Student Profile Not Found</AlertTitle>
          <AlertDescription className="text-xs text-[#CBD5E1] mt-1 flex items-center justify-between">
            <span>{error?.message || 'We could not retrieve this student profile.'}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-7 text-xs border-red-500/40 text-red-400 gap-1 ml-4"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const formatYear = (year: string) => {
    switch (year) {
      case 'FIRST_YEAR': return 'First Year';
      case 'SECOND_YEAR': return 'Second Year';
      case 'THIRD_YEAR': return 'Third Year';
      case 'FOURTH_YEAR': return 'Fourth Year';
      default: return 'Student';
    }
  };

  const getProficiencyBadge = (proficiency: SkillProficiency) => {
    switch (proficiency) {
      case 'EXPERT':
        return (
          <Badge variant="warning" className="gap-1 font-semibold text-[11px]">
            <Sparkles className="w-3 h-3 text-[#F59E0B]" />
            Expert
          </Badge>
        );
      case 'ADVANCED':
        return (
          <Badge variant="secondary" className="gap-1 font-semibold text-[11px]">
            <Award className="w-3 h-3 text-[#38BDF8]" />
            Advanced
          </Badge>
        );
      case 'INTERMEDIATE':
        return (
          <Badge variant="success" className="gap-1 font-semibold text-[11px]">
            <Award className="w-3 h-3 text-[#10B981]" />
            Intermediate
          </Badge>
        );
      case 'BEGINNER':
      default:
        return (
          <Badge variant="info" className="gap-1 font-semibold text-[11px]">
            <Award className="w-3 h-3 text-[#38BDF8]" />
            Beginner
          </Badge>
        );
    }
  };

  const initial = profile.displayName ? profile.displayName.charAt(0).toUpperCase() : 'S';

  // Check reciprocal matches against authenticated user's skills
  const myLearningSkillIds = new Set(mySkills?.learning.map((s) => s.skillId) || []);
  const myTeachingSkillIds = new Set(mySkills?.teaching.map((s) => s.skillId) || []);

  const matchingTheyTeach = profile.teachingSkills.filter((s) => myLearningSkillIds.has(s.skillId));
  const matchingTheyLearn = profile.learningSkills.filter((s) => myTeachingSkillIds.has(s.skillId));
  const hasSkillMatch = matchingTheyTeach.length > 0 || matchingTheyLearn.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Back Button */}
      <div>
        <Link to="/discover">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-[#94A3B8] hover:text-[#F8F5ED]">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Discover</span>
          </Button>
        </Link>
      </div>

      {/* Main Student Header Card */}
      <div className="rounded-2xl bg-[#111827] border border-[rgba(212,175,106,0.22)] p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/[0.03] rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-700 shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-[#1E293B] border border-slate-700/60 flex items-center justify-center text-[#10B981] text-2xl font-extrabold shadow-md">
                {initial}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#F8F5ED] tracking-tight font-display">
                  {profile.displayName}
                </h1>
                <Badge variant="success" className="text-[10px] gap-1">
                  <UserCheck className="w-3 h-3 text-[#10B981]" />
                  Verified Student
                </Badge>
              </div>

              {/* Rating summary */}
              <div className="flex items-center gap-2 text-xs">
                {ratingSummary?.averageRating != null ? (
                  <div className="flex items-center gap-1.5 bg-[#1E293B]/70 px-2 py-0.5 rounded-lg border border-slate-700/60">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="font-bold text-amber-400">{ratingSummary.averageRating.toFixed(1)}</span>
                    <span className="text-neutral-500">({ratingSummary.reviewCount} {ratingSummary.reviewCount === 1 ? 'review' : 'reviews'})</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-neutral-400 bg-[#1E293B]/40 px-2 py-0.5 rounded-lg border border-slate-800">
                    No ratings yet
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[#94A3B8]">
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>{profile.collegeName}</span>
                </span>
                {profile.department && (
                  <>
                    <span>•</span>
                    <span>{profile.department}</span>
                  </>
                )}
                <span>•</span>
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>{formatYear(profile.yearOfStudy)}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons: Friend Request, Message, Request Exchange & Safety */}
          {currentProfile?.userId !== profile.userId && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Friend Connection & Direct Messaging Button Group */}
              {friendStatus?.status === 'ACCEPTED' ? (
                <div className="flex items-center gap-1.5">
                  <Badge variant="success" className="gap-1 text-xs py-1 px-2.5 bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                    <UserCheck className="w-3.5 h-3.5" />
                    Friends
                  </Badge>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleStartChat}
                    disabled={isCreatingChat || blockStatus?.blockedByMe || blockStatus?.blockedByTarget}
                    className="gap-1.5 text-xs bg-[#1E293B] hover:bg-[#334155] text-[#F8F5ED] border border-slate-700"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>{isCreatingChat ? 'Opening...' : 'Message'}</span>
                  </Button>
                </div>
              ) : friendStatus?.status === 'PENDING_SENT' ? (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="gap-1.5 text-xs border-amber-500/40 text-amber-400 bg-amber-500/10 cursor-default"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Request Sent
                  </Button>
                  {friendStatus.requestId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelFriendRequest(friendStatus.requestId!)}
                      disabled={isCancellingFriend}
                      title="Cancel friend request"
                      className="text-xs text-neutral-400 hover:text-red-400 h-8 px-2"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ) : friendStatus?.status === 'PENDING_RECEIVED' ? (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => friendStatus.requestId && acceptFriendRequest(friendStatus.requestId)}
                    disabled={isAcceptingFriend || blockStatus?.blockedByMe || blockStatus?.blockedByTarget}
                    className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 font-semibold"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isAcceptingFriend ? 'Accepting...' : 'Accept Request'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => friendStatus.requestId && declineFriendRequest(friendStatus.requestId)}
                    disabled={isDecliningFriend}
                    className="text-xs text-neutral-400 hover:text-red-400 border-slate-700 h-8 px-2.5"
                  >
                    Decline
                  </Button>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => sendFriendRequest(targetUserId)}
                  disabled={isSendingFriend || isFriendLoading || blockStatus?.blockedByMe || blockStatus?.blockedByTarget}
                  className="gap-1.5 text-xs border border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isSendingFriend ? 'Sending...' : 'Add Friend'}</span>
                </Button>
              )}

              <Button
                variant="default"
                size="sm"
                onClick={() => setRequestModalOpen(true)}
                disabled={blockStatus?.blockedByMe || blockStatus?.blockedByTarget}
                className="gap-2 text-xs font-semibold"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Request Exchange</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setBlockModalOpen(true)}
                title={blockStatus?.blockedByMe ? 'Unblock User' : 'Block User'}
                className={`text-xs px-2.5 ${
                  blockStatus?.blockedByMe
                    ? 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
                    : 'border-slate-700 text-neutral-400 hover:text-red-400 hover:border-red-500/40'
                }`}
              >
                {blockStatus?.blockedByMe ? <UserCheck className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setReportModalOpen(true)}
                title="Report User"
                className="text-xs px-2.5 border-slate-700 text-neutral-400 hover:text-red-400 hover:border-red-500/40"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Bio */}
        {profile.bio ? (
          <div className="mt-6 pt-5 border-t border-slate-800">
            <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">About Me</h2>
            <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed max-w-3xl">
              {profile.bio}
            </p>
          </div>
        ) : (
          <div className="mt-6 pt-5 border-t border-slate-800 text-xs text-[#94A3B8] italic">
            This student hasn&apos;t added a bio yet.
          </div>
        )}
      </div>

      {/* Match Compatibility Highlight */}
      {hasSkillMatch && (
        <div className="p-4 px-5 rounded-xl bg-[#111827] border border-[#10B981]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#10B981]/15 text-[#10B981] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#F8F5ED]">Skill Compatibility Insight</h3>
              <p className="text-[11px] text-[#94A3B8]">
                {matchingTheyTeach.length > 0 && `They can teach you ${matchingTheyTeach.map((s) => s.skillName).join(', ')}. `}
                {matchingTheyLearn.length > 0 && `You can teach them ${matchingTheyLearn.map((s) => s.skillName).join(', ')}.`}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30 shrink-0">
            Mutual Match
          </span>
        </div>
      )}

      {/* Two Columns: Skills I Teach & Skills I Want To Learn */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skills I Teach */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#10B981]/15 text-[#10B981] flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#F8F5ED]">Skills I Teach</h2>
                <p className="text-[11px] text-[#94A3B8]">Topics and skills available for peer tutoring</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#10B981] bg-[#10B981]/12 px-2 py-0.5 rounded-full border border-[#10B981]/25">
              {profile.teachingSkills.length}
            </span>
          </div>

          {profile.teachingSkills.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-[#111827] border border-slate-800 text-xs text-[#94A3B8] italic">
              No teaching skills listed yet.
            </div>
          ) : (
            <div className="space-y-3">
              {profile.teachingSkills.map((skill) => (
                <Card key={skill.id} className="glass-card">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-sm font-bold text-[#F8F5ED]">{skill.skillName}</CardTitle>
                        {skill.categoryName && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#94A3B8] mt-0.5">
                            <Tag className="w-3 h-3 text-[#10B981]" />
                            {skill.categoryName}
                          </span>
                        )}
                      </div>
                      <div>{getProficiencyBadge(skill.proficiency)}</div>
                    </div>
                  </CardHeader>
                  {skill.description && (
                    <CardContent className="p-4 pt-1 text-xs text-[#CBD5E1] italic">
                      &ldquo;{skill.description}&rdquo;
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Skills I Want To Learn */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#38BDF8]/15 text-[#38BDF8] flex items-center justify-center">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#F8F5ED]">Skills I Want To Learn</h2>
                <p className="text-[11px] text-[#94A3B8]">Topics and skills this student is interested in learning</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#38BDF8] bg-[#38BDF8]/12 px-2 py-0.5 rounded-full border border-[#38BDF8]/25">
              {profile.learningSkills.length}
            </span>
          </div>

          {profile.learningSkills.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-[#111827] border border-slate-800 text-xs text-[#94A3B8] italic">
              No learning skills listed yet.
            </div>
          ) : (
            <div className="space-y-3">
              {profile.learningSkills.map((skill) => (
                <Card key={skill.id} className="glass-card">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-sm font-bold text-[#F8F5ED]">{skill.skillName}</CardTitle>
                        {skill.categoryName && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#94A3B8] mt-0.5">
                            <Tag className="w-3 h-3 text-[#38BDF8]" />
                            {skill.categoryName}
                          </span>
                        )}
                      </div>
                      <div>{getProficiencyBadge(skill.proficiency)}</div>
                    </div>
                  </CardHeader>
                  {skill.description && (
                    <CardContent className="p-4 pt-1 text-xs text-[#CBD5E1] italic">
                      &ldquo;{skill.description}&rdquo;
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reviews & Ratings Section */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#F8F5ED]">Student Reviews & Ratings</h2>
              <p className="text-[11px] text-[#94A3B8]">Feedback received from verified peer exchange sessions</p>
            </div>
          </div>
          {ratingSummary?.averageRating != null && (
            <div className="flex items-center gap-2">
              <StarRating rating={ratingSummary.averageRating} size="sm" readOnly />
              <span className="text-xs font-bold text-amber-400">{ratingSummary.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <ReviewsList reviews={userReviews?.items || []} isLoading={isReviewsLoading} />
      </div>

      {/* Request Exchange Modal */}
      <RequestExchangeModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        recipient={profile}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        reportedUserId={profile.userId}
        reportedUserName={profile.displayName}
        onClose={() => setReportModalOpen(false)}
      />

      {/* Block Modal */}
      <BlockModal
        isOpen={blockModalOpen}
        userId={profile.userId}
        userName={profile.displayName}
        isCurrentlyBlocked={Boolean(blockStatus?.blockedByMe)}
        onClose={() => setBlockModalOpen(false)}
        onSuccess={() => refetchBlockStatus()}
      />
    </div>
  );
};
