import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building,
  Clock,
  Check,
  X,
  Ban,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

import type { ExchangeRequest, ExchangeRequestStatus } from '@/types/api';

interface ExchangeRequestCardProps {
  request: ExchangeRequest;
  type: 'incoming' | 'outgoing';
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onCancel?: (id: string) => void;
  isProcessing?: boolean;
}

export const ExchangeRequestCard: React.FC<ExchangeRequestCardProps> = ({
  request,
  type,
  onAccept,
  onReject,
  onCancel,
  isProcessing = false,
}) => {
  const otherUser = type === 'incoming' ? request.requester : request.recipient;
  const initial = otherUser.displayName ? otherUser.displayName.charAt(0).toUpperCase() : 'S';

  const getStatusBadge = (status: ExchangeRequestStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="warning" className="gap-1 font-semibold text-[11px]">
            <Clock className="w-3 h-3 text-[#F59E0B]" />
            Pending
          </Badge>
        );
      case 'ACCEPTED':
        return (
          <Badge variant="success" className="gap-1 font-semibold text-[11px]">
            <Check className="w-3 h-3 text-[#10B981]" />
            Accepted
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive" className="gap-1 font-semibold text-[11px]">
            <X className="w-3 h-3 text-red-400" />
            Rejected
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
            <div className="flex items-center gap-3">
              {otherUser.avatarUrl ? (
                <img
                  src={otherUser.avatarUrl}
                  alt={otherUser.displayName}
                  className="w-11 h-11 rounded-xl object-cover border border-slate-700"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-[#1E293B] border border-slate-700/60 flex items-center justify-center text-[#10B981] font-bold text-base shadow-sm">
                  {initial}
                </div>
              )}
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[#94A3B8] uppercase tracking-wider font-semibold">
                    {type === 'incoming' ? 'From' : 'To'}
                  </span>
                  <Link
                    to={`/users/${otherUser.id}`}
                    className="font-bold text-sm text-[#F8F5ED] hover:text-[#10B981] transition-colors"
                  >
                    {otherUser.displayName}
                  </Link>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
                  <span className="flex items-center gap-1 truncate max-w-[130px]">
                    <Building className="w-3 h-3 text-[#10B981]" />
                    {otherUser.collegeName}
                  </span>
                  {otherUser.department && (
                    <>
                      <span>•</span>
                      <span>{otherUser.department}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div>{getStatusBadge(request.status)}</div>
          </div>
        </CardHeader>

        <CardContent className="px-5 pb-3 space-y-3">
          {/* Skill Box */}
          <div className="p-3 rounded-xl bg-[#1E293B]/70 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#10B981] tracking-wider">
              {type === 'incoming' ? 'Requested Skill to Learn' : 'Requested to Learn'}
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-bold text-[#F8F5ED]">
                {request.skill.name}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1E293B] border border-slate-700 text-[#CBD5E1]">
                {request.skill.proficiency}
              </span>
            </div>
            {request.skill.categoryName && (
              <p className="text-[10px] text-[#94A3B8]">{request.skill.categoryName}</p>
            )}
          </div>

          {/* Proposal Message */}
          {request.message && (
            <div className="p-2.5 rounded-lg bg-[#1E293B]/40 border border-slate-800/80 text-xs text-[#CBD5E1] italic leading-relaxed">
              &ldquo;{request.message}&rdquo;
            </div>
          )}

          {/* Date info */}
          <div className="flex items-center gap-1 text-[11px] text-[#94A3B8]">
            <Clock className="w-3 h-3 text-[#64748B]" />
            <span>Requested on {formatDate(request.createdAt)}</span>
          </div>
        </CardContent>
      </div>

      {/* Action Footer */}
      <CardFooter className="p-4 px-5 pt-2 border-t border-slate-800/80 mt-1 flex items-center justify-between gap-2">
        <Link to={`/requests/${request.id}`} className="text-xs text-[#94A3B8] hover:text-[#F8F5ED] flex items-center gap-1 font-medium">
          <span>View Details</span>
          <ArrowRight className="w-3 h-3" />
        </Link>

        {/* Action buttons based on status & role */}
        <div className="flex items-center gap-2">
          {request.status === 'PENDING' && type === 'incoming' && (
            <>
              {onReject && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReject(request.id)}
                  disabled={isProcessing}
                  className="h-8 text-xs text-[#94A3B8] hover:text-red-400 hover:bg-red-500/10"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Decline
                </Button>
              )}
              {onAccept && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onAccept(request.id)}
                  disabled={isProcessing}
                  className="h-8 text-xs font-semibold gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Accept
                </Button>
              )}
            </>
          )}

          {request.status === 'PENDING' && type === 'outgoing' && onCancel && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onCancel(request.id)}
              disabled={isProcessing}
              className="h-8 text-xs text-[#94A3B8] hover:text-red-400"
            >
              <Ban className="w-3 h-3 mr-1" />
              Cancel Request
            </Button>
          )}

          {request.status === 'ACCEPTED' && (
            <Link to={`/requests/${request.id}`}>
              <Button variant="default" size="sm" className="h-8 text-xs gap-1 font-semibold">
                <Sparkles className="w-3 h-3" />
                <span>Manage Session</span>
              </Button>
            </Link>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
