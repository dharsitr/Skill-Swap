import React from 'react';
import { Clock, Globe, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { UserAvailabilityResponse } from '@/types/api';

interface AvailabilitySlotProps {
  slot: UserAvailabilityResponse;
  onDelete: (id: string) => void;
  onToggleActive?: (id: string, active: boolean) => void;
  isDeleting?: boolean;
}

export const AvailabilitySlot: React.FC<AvailabilitySlotProps> = ({
  slot,
  onDelete,
  onToggleActive,
  isDeleting = false,
}) => {
  const formatTime = (timeStr: string) => {
    // If format is HH:mm:ss, strip seconds for cleaner display
    const parts = timeStr.split(':');
    if (parts.length >= 2 && parts[0] && parts[1]) {
      const hour = parseInt(parts[0], 10);
      const minute = parts[1];
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minute} ${ampm}`;
    }
    return timeStr;
  };

  return (
    <div
      data-testid={`availability-slot-${slot.id}`}
      className={`p-4 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        slot.active
          ? 'bg-[#111827]/80 border-slate-800 hover:border-emerald-500/40 shadow-sm'
          : 'bg-slate-900/40 border-slate-800/60 opacity-60'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg ${
            slot.active
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-[#F8F5ED]">
              {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
            </span>
            <Badge
              variant={slot.active ? 'success' : 'outline'}
              className="text-[10px] px-1.5 py-0"
            >
              {slot.active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
            <span className="capitalize font-medium text-slate-300">{slot.dayOfWeek.toLowerCase()}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-slate-500" />
              {slot.timezone}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center">
        {onToggleActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleActive(slot.id, !slot.active)}
            className="text-xs h-8 text-slate-400 hover:text-white"
            title={slot.active ? 'Mark inactive' : 'Mark active'}
            aria-label={slot.active ? 'Mark inactive' : 'Mark active'}
          >
            {slot.active ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-slate-500" />
            )}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(slot.id)}
          disabled={isDeleting}
          className="text-xs h-8 text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10"
          title="Delete slot"
          aria-label="Delete availability slot"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
