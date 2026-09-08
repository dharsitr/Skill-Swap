import React, { useState } from 'react';
import { Calendar, Clock, Globe, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface SchedulePickerProps {
  initialStart?: string;
  initialEnd?: string;
  initialTimezone?: string;
  isReschedule?: boolean;
  onSubmit: (data: { startAt: string; endAt: string; timezone: string; reason?: string }) => Promise<unknown>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const SchedulePicker: React.FC<SchedulePickerProps> = ({
  initialStart,
  initialTimezone,
  isReschedule = false,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const defaultTz =
    initialTimezone ||
    (typeof Intl !== 'undefined' && Intl.DateTimeFormat
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'UTC');

  // Tomorrow 2:00 PM as default future time
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0] || '';

  const [date, setDate] = useState<string>(
    (initialStart ? initialStart.split('T')[0] : null) || defaultDateStr
  );
  const [time, setTime] = useState<string>(
    (initialStart ? initialStart.split('T')[1]?.substring(0, 5) : null) || '14:00'
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [timezone, setTimezone] = useState<string>(defaultTz);
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const calculateInterval = () => {
    try {
      const startDateTimeStr = `${date}T${time}:00`;
      const startDate = new Date(startDateTimeStr);
      const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
      return {
        startIso: startDate.toISOString(),
        endIso: endDate.toISOString(),
        startDate,
        endDate,
      };
    } catch {
      return null;
    }
  };

  const interval = calculateInterval();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!interval) {
      setError('Please provide a valid date and time.');
      return;
    }

    if (interval.startDate.getTime() <= Date.now()) {
      setError('Scheduled session start time must be in the future.');
      return;
    }

    try {
      await onSubmit({
        startAt: interval.startIso,
        endAt: interval.endIso,
        timezone,
        reason: isReschedule ? reason : undefined,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to schedule session';
      setError(msg);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <Card className="bg-[#111827] border-slate-800 shadow-xl overflow-hidden max-w-xl mx-auto">
      <CardHeader className="border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {isReschedule ? <RotateCcw className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-[#F8F5ED]">
              {isReschedule ? 'Reschedule Session' : 'Schedule Session Time'}
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              {isReschedule
                ? 'Select a new date and time for your peer exchange.'
                : 'Propose a confirmed date and time window for this learning session.'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Session Date</label>
              <input
                type="date"
                min={todayStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Time Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Start Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Duration Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Session Duration</label>
            <div className="grid grid-cols-4 gap-2">
              {[30, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    durationMinutes === mins
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-sm'
                      : 'bg-[#1E293B]/70 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          {/* Timezone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Timezone</label>
            <div className="relative">
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-[#1E293B] border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. America/New_York"
                required
              />
              <Globe className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Reschedule Reason */}
          {isReschedule && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Reason for Rescheduling (Optional)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Conflict with lab exam or travel"
                className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Live Preview Card */}
          {interval && (
            <div className="p-3.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 text-xs text-slate-300 flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold text-emerald-400 block">Proposed Window:</span>
                <span>
                  {interval.startDate.toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  • {time} – {interval.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({durationMinutes} mins, {timezone})
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={isLoading}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={isLoading}
              className="gap-2 text-xs px-5 h-9"
            >
              <Clock className="w-4 h-4" />
              {isLoading ? 'Saving...' : isReschedule ? 'Confirm Reschedule' : 'Confirm Schedule'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
