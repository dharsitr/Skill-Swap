import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, User, Video, RotateCcw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SessionResponse } from '@/types/api';

interface SessionCalendarProps {
  sessions: SessionResponse[];
  currentUserId?: string;
  onRescheduleClick?: (sessionId: string) => void;
}

export const SessionCalendar: React.FC<SessionCalendarProps> = ({
  sessions,
  currentUserId,
  onRescheduleClick,
}) => {

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

  if (sessions.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-[#111827]/60 border border-slate-800 text-center space-y-2">
        <Calendar className="w-8 h-8 text-slate-500 mx-auto" />
        <p className="font-bold text-sm text-[#F8F5ED]">No upcoming scheduled sessions</p>
        <p className="text-xs text-slate-400">Accepted exchange sessions will appear here once scheduled.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="session-calendar">
      {sessions.map((session) => {
        const isTeacher = session.teacher.id === currentUserId;
        const counterpart = isTeacher ? session.learner : session.teacher;

        return (
          <div
            key={session.id}
            className="p-4 rounded-xl bg-[#111827] border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#1E293B] border border-slate-700/80 text-emerald-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#F8F5ED]">{session.skill.name}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-700 text-[#D4AF6A]">
                    {isTeacher ? 'Teaching' : 'Learning'}
                  </Badge>
                  <Badge
                    variant={session.status === 'IN_PROGRESS' ? 'success' : 'default'}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {session.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Partner: <span className="text-slate-300 font-medium">{counterpart.displayName}</span> ({counterpart.collegeName || 'Campus'})
                </p>
                <p className="text-[11px] text-emerald-400/90 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatSessionTime(session.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              {session.status === 'SCHEDULED' && onRescheduleClick && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRescheduleClick(session.id)}
                  className="text-xs h-8 border-slate-700 gap-1.5 text-slate-300 hover:text-white"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reschedule
                </Button>
              )}

              <Link to={`/sessions/${session.id}`}>
                <Button variant="default" size="sm" className="text-xs h-8 gap-1.5">
                  <Video className="w-3.5 h-3.5" />
                  Join Room
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
};
