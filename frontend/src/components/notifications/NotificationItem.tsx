import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { NotificationResponse, NotificationType } from '@/types/api';
import {
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  Calendar,
  PlayCircle,
  Award,
  MessageSquare,
  Star,
  AlertTriangle,
  Shield,
  Trash2,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotificationItemProps {
  notification: NotificationResponse;
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'EXCHANGE_REQUEST_RECEIVED':
      return <ArrowLeftRight className="w-4 h-4 text-emerald-400" />;
    case 'EXCHANGE_REQUEST_ACCEPTED':
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    case 'EXCHANGE_REQUEST_REJECTED':
      return <XCircle className="w-4 h-4 text-rose-400" />;
    case 'SESSION_CREATED':
      return <Calendar className="w-4 h-4 text-sky-400" />;
    case 'SESSION_STARTED':
      return <PlayCircle className="w-4 h-4 text-amber-400" />;
    case 'SESSION_COMPLETED':
      return <Award className="w-4 h-4 text-emerald-400" />;
    case 'NEW_MESSAGE':
      return <MessageSquare className="w-4 h-4 text-indigo-400" />;
    case 'REVIEW_RECEIVED':
      return <Star className="w-4 h-4 text-amber-400" />;
    case 'DISPUTE_UPDATED':
      return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    case 'SAFETY_UPDATE':
      return <Shield className="w-4 h-4 text-rose-400" />;
    default:
      return <Calendar className="w-4 h-4 text-slate-400" />;
  }
};

const formatTimeAgo = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSecs < 60) return 'just now';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return dateStr;
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkRead,
  onDelete,
  compact = false,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!notification.read && onMarkRead) {
      onMarkRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleMarkReadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkRead) {
      onMarkRead(notification.id);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(notification.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`group relative rounded-xl transition-all duration-200 cursor-pointer border text-left ${
        notification.read
          ? 'bg-[#1E293B]/40 hover:bg-[#1E293B]/70 border-slate-800/80 text-slate-300'
          : 'bg-[#1E293B]/90 hover:bg-[#1E293B] border-emerald-500/30 shadow-sm shadow-emerald-950/20 text-slate-100'
      } ${compact ? 'p-3' : 'p-4'}`}
      aria-label={`${notification.title}: ${notification.message} (${notification.read ? 'Read' : 'Unread'})`}
    >
      <div className="flex items-start gap-3">
        {/* Icon with circular container */}
        <div
          className={`shrink-0 p-2 rounded-xl border ${
            notification.read
              ? 'bg-slate-800/60 border-slate-700/40'
              : 'bg-emerald-950/40 border-emerald-500/40'
          }`}
        >
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-2 mb-0.5">
            <h4
              className={`text-sm tracking-tight truncate ${
                notification.read ? 'font-medium text-slate-200' : 'font-bold text-white'
              }`}
            >
              {notification.title}
            </h4>
            {!notification.read && (
              <span
                className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse"
                title="Unread"
                aria-label="Unread indicator"
              />
            )}
          </div>
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-1">
            {notification.message}
          </p>
          <span className="text-[11px] text-slate-500 font-mono">
            {formatTimeAgo(notification.createdAt)}
          </span>
        </div>

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!notification.read && onMarkRead && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40 rounded-lg"
              onClick={handleMarkReadClick}
              title="Mark as read"
              aria-label="Mark as read"
            >
              <Check className="w-3.5 h-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg"
              onClick={handleDeleteClick}
              title="Delete notification"
              aria-label="Delete notification"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
