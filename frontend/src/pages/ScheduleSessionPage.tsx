import React, { useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Clock, ArrowLeft, AlertCircle, CheckCircle2, User, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useSession } from '@/hooks/useSessions';
import {
  useSessionSchedule,
  useScheduleSession,
  useRescheduleSession,
} from '@/hooks/useScheduling';
import { SchedulePicker } from '@/components/scheduling/SchedulePicker';
import { useAuth } from '@/auth/useAuth';

export const ScheduleSessionPage: React.FC = () => {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isRescheduleRoute = location.pathname.endsWith('/reschedule');

  const {
    data: session,
    isLoading: isSessionLoading,
    isError: isSessionError,
    error: sessionError,
  } = useSession(sessionId || '');

  const {
    data: schedule,
    isLoading: isScheduleLoading,
    refetch: refetchSchedule,
  } = useSessionSchedule(sessionId || '');

  const scheduleMutation = useScheduleSession();
  const rescheduleMutation = useRescheduleSession();

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!sessionId) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center text-rose-400">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p>Invalid session identifier.</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/sessions')} className="mt-4">
          Back to Sessions
        </Button>
      </div>
    );
  }

  const isTeacher = session?.teacher.id === user?.id;
  const partner = isTeacher ? session?.learner : session?.teacher;
  const isReschedule = isRescheduleRoute || Boolean(schedule);

  const handleSubmit = async (data: {
    startAt: string;
    endAt: string;
    timezone: string;
    reason?: string;
  }) => {
    setSuccessMessage(null);
    if (isReschedule) {
      await rescheduleMutation.mutateAsync({
        sessionId,
        request: {
          startAt: data.startAt,
          endAt: data.endAt,
          timezone: data.timezone,
          reason: data.reason,
        },
      });
      setSuccessMessage('Session successfully rescheduled! Your partner has been notified.');
    } else {
      await scheduleMutation.mutateAsync({
        sessionId,
        request: {
          startAt: data.startAt,
          endAt: data.endAt,
          timezone: data.timezone,
        },
      });
      setSuccessMessage('Session successfully scheduled! Your partner has been notified.');
    }
    await refetchSchedule();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button and title */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="text-slate-400 hover:text-white gap-2 text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Link to={`/sessions/${sessionId}`}>
          <Button variant="outline" size="sm" className="text-xs border-slate-700">
            View Session Details
          </Button>
        </Link>
      </div>

      {/* Session summary card */}
      {session && (
        <Card className="bg-[#111827] border-slate-800">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[#F8F5ED]">{session.skill.name}</span>
                    <Badge variant="outline" className="text-xs border-slate-700 text-[#D4AF6A]">
                      {isTeacher ? 'You are Teaching' : 'You are Learning'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    Partner: <span className="text-slate-200 font-medium">{partner?.displayName}</span>
                    {partner?.collegeName && (
                      <span className="text-slate-500">({partner.collegeName})</span>
                    )}
                  </p>
                </div>
              </div>

              {schedule && (
                <div className="p-3 rounded-xl bg-[#1E293B]/60 border border-slate-700/60 text-xs space-y-1 sm:text-right">
                  <span className="text-slate-400 font-medium block">Current Confirmed Schedule</span>
                  <span className="text-[#D4AF6A] font-bold block flex items-center gap-1.5 sm:justify-end">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(schedule.startAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                  <span className="text-[11px] text-slate-400">Timezone: {schedule.timezone}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success banner */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-400 text-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <span className="font-bold">{successMessage}</span>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/sessions')}
            className="text-xs h-7"
          >
            Go to Sessions
          </Button>
        </div>
      )}

      {/* Error banner */}
      {isSessionError && (
        <Alert variant="destructive" className="bg-rose-950/20 border border-rose-900/40 text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <AlertDescription>
            {sessionError instanceof Error ? sessionError.message : 'Failed to load session details.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Scheduler form */}
      <SchedulePicker
        initialStart={schedule?.startAt}
        initialEnd={schedule?.endAt}
        initialTimezone={schedule?.timezone}
        isReschedule={isReschedule}
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
        isLoading={
          isSessionLoading ||
          isScheduleLoading ||
          scheduleMutation.isPending ||
          rescheduleMutation.isPending
        }
      />
    </div>
  );
};
export default ScheduleSessionPage;
