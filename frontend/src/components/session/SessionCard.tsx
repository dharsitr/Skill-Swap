import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Play,
  CheckCircle,
  Ban,
  Clock,
  ArrowRight,
  Video,
  RotateCcw,
} from 'lucide-react';

import type { Session, SessionStatus } from '@/types/api';

interface SessionCardProps {
  session: Session;
  currentUserId?: string;
  onStart?: (id: string) => void;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
  isProcessing?: boolean;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  currentUserId,
  onStart,
  onComplete,
  isProcessing = false,
}) => {
  const isTeacher = currentUserId === session.teacher.id;
  const partner = isTeacher ? session.learner : session.teacher;
  const partnerInitial = partner.displayName ? partner.displayName.charAt(0).toUpperCase() : 'S';

  const getStatusBadge = (status: SessionStatus) => {
    switch (status) {
      case 'SCHEDULED':
        return (
          <Badge variant="info" className="gap-1 font-semibold text-[11px]">
            <Clock className="w-3 h-3 text-[#38BDF8]" />
            Scheduled
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge variant="warning" className="gap-1 font-semibold text-[11px] animate-pulse">
            <Play className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
            In Progress
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge variant="success" className="gap-1 font-semibold text-[11px]">
            <CheckCircle className="w-3 h-3 text-[#10B981]" />
            Completed
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="outline" className="gap-1 font-semibold text-[11px]">
            <Ban className="w-3 h-3 text-[#94A3B8]" />
            Cancelled
          </Badge>
        );
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <Card className="glass-card flex flex-col justify-between overflow-hidden">
      <div>
        <CardHeader className="p-5 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-[#F8F5ED] font-display">{session.skill.name}</span>
                {getStatusBadge(session.status)}
              </div>
              {session.skill.categoryName && (
                <p className="text-[11px] text-[#94A3B8]">{session.skill.categoryName}</p>
              )}
            </div>

            {/* Role indicator */}
            {isTeacher ? (
              <Badge variant="default" className="text-[10px] font-semibold">
                You are Teaching
              </Badge>
            ) : (
              <Badge variant="info" className="text-[10px] font-semibold">
                You are Learning
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-5 pb-3 space-y-3">
          {/* Partner Chip */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#1E293B]/70 border border-slate-800">
            <div className="flex items-center gap-3 min-w-0">
              {partner.avatarUrl ? (
                <img
                  src={partner.avatarUrl}
                  alt={partner.displayName}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#1E293B] border border-slate-700/60 flex items-center justify-center text-[#10B981] font-bold text-sm">
                  {partnerInitial}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider">
                  {isTeacher ? 'Student Learner' : 'Student Tutor'}
                </p>
                <p className="text-xs font-semibold text-[#F8F5ED] truncate">{partner.displayName}</p>
                <p className="text-[11px] text-[#94A3B8] truncate">{partner.collegeName}</p>
              </div>
            </div>

            <Link
              to={`/users/${partner.id}`}
              className="text-xs text-[#94A3B8] hover:text-[#F8F5ED] font-medium"
            >
              Profile
            </Link>
          </div>

          {/* Date info */}
          <div className="flex items-center justify-between text-[11px] text-[#94A3B8] pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#10B981]" />
              Scheduled: {formatDate(session.scheduledAt || session.createdAt)}
            </span>
          </div>
        </CardContent>
      </div>

      {/* Action Footer */}
      <CardFooter className="p-4 px-5 pt-2 border-t border-slate-800/80 mt-1 flex items-center justify-between gap-2">
        <Link to={`/sessions/${session.id}`} className="text-xs text-[#94A3B8] hover:text-[#F8F5ED] flex items-center gap-1 font-medium">
          <span>Manage Session</span>
          <ArrowRight className="w-3 h-3" />
        </Link>

        {/* Dynamic Buttons */}
        <div className="flex items-center gap-2">
          {(session.status === 'SCHEDULED' || session.status === 'IN_PROGRESS') && (
            <Link to={`/sessions/${session.id}/call`}>
              <Button
                variant="secondary"
                size="sm"
                className="h-8 text-xs font-semibold gap-1 text-[#10B981] hover:text-[#34D399]"
              >
                <Video className="w-3 h-3 text-[#10B981]" />
                <span>Call</span>
              </Button>
            </Link>
          )}

          {session.status === 'SCHEDULED' && (
            <Link to={`/sessions/${session.id}/reschedule`}>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-semibold gap-1 border-slate-700 text-slate-300 hover:text-white"
                title="Reschedule session"
              >
                <RotateCcw className="w-3 h-3 text-[#D4AF6A]" />
                <span className="hidden sm:inline">Reschedule</span>
              </Button>
            </Link>
          )}

          {session.status === 'SCHEDULED' && onStart && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onStart(session.id)}
              disabled={isProcessing}
              className="h-8 text-xs font-semibold gap-1"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Start Session</span>
            </Button>
          )}

          {session.status === 'IN_PROGRESS' && onComplete && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onComplete(session.id)}
              disabled={isProcessing}
              className="h-8 text-xs font-semibold gap-1"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Mark Completed</span>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
