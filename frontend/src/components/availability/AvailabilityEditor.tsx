import React, { useState } from 'react';
import { Plus, Clock, Calendar, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AvailabilitySlot } from './AvailabilitySlot';
import type { DayOfWeek, UserAvailabilityResponse, CreateAvailabilityRequest } from '@/types/api';

interface AvailabilityEditorProps {
  slots: UserAvailabilityResponse[];
  onAddSlot: (request: CreateAvailabilityRequest) => Promise<unknown>;
  onDeleteSlot: (id: string) => Promise<unknown>;
  onToggleActive?: (id: string, active: boolean) => Promise<unknown>;
  isLoading?: boolean;
}

const DAYS_OF_WEEK: { label: string; value: DayOfWeek }[] = [
  { label: 'Monday', value: 'MONDAY' },
  { label: 'Tuesday', value: 'TUESDAY' },
  { label: 'Wednesday', value: 'WEDNESDAY' },
  { label: 'Thursday', value: 'THURSDAY' },
  { label: 'Friday', value: 'FRIDAY' },
  { label: 'Saturday', value: 'SATURDAY' },
  { label: 'Sunday', value: 'SUNDAY' },
];

export const AvailabilityEditor: React.FC<AvailabilityEditorProps> = ({
  slots,
  onAddSlot,
  onDeleteSlot,
  onToggleActive,
  isLoading = false,
}) => {
  const defaultTimezone =
    typeof Intl !== 'undefined' && Intl.DateTimeFormat
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'UTC';

  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('MONDAY');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [timezone, setTimezone] = useState(defaultTimezone);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!startTime || !endTime) {
      setError('Both start time and end time are required.');
      return;
    }

    if (startTime >= endTime) {
      setError('End time must be strictly after start time.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddSlot({
        dayOfWeek,
        startTime,
        endTime,
        timezone,
        active: true,
      });
      // Reset times to sensible defaults for next slot
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save availability slot';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await onDeleteSlot(id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete slot';
      setError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  // Group slots by day
  const slotsByDay = DAYS_OF_WEEK.map((day) => ({
    ...day,
    slots: slots.filter((s) => s.dayOfWeek === day.value),
  }));

  const totalActiveSlots = slots.filter((s) => s.active).length;

  return (
    <div className="space-y-6">
      {/* 1. Add Slot Form Card */}
      <Card className="bg-[#111827] border-slate-800 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-slate-800/80 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-[#F8F5ED]">Define Weekly Availability</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Set recurring hours when you are free to teach or exchange skills.
                </CardDescription>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#D4AF6A] bg-[#D4AF6A]/10 border border-[#D4AF6A]/20 px-2.5 py-1 rounded-full">
              {totalActiveSlots} Active Slot{totalActiveSlots === 1 ? '' : 's'}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Day of Week */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Day of Week</label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Time */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* End Time */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Timezone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Timezone</label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="e.g. America/New_York"
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={isSubmitting || isLoading}
                className="gap-2 text-xs px-5 h-9"
              >
                <Plus className="w-4 h-4" />
                Add Availability Slot
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 2. Existing Slots By Day */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#F8F5ED] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            Your Weekly Schedule
          </h2>
        </div>

        {slots.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#111827]/60 border border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm text-[#F8F5ED]">No availability slots configured yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Add your free hours above so peers know when you can meet for skill exchange sessions.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {slotsByDay
              .filter((group) => group.slots.length > 0)
              .map((group) => (
                <div
                  key={group.value}
                  className="p-4 rounded-2xl bg-[#111827]/70 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F8F5ED]">
                      {group.label}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {group.slots.length} slot{group.slots.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {group.slots.map((slot) => (
                      <AvailabilitySlot
                        key={slot.id}
                        slot={slot}
                        onDelete={handleDelete}
                        onToggleActive={onToggleActive}
                        isDeleting={deletingId === slot.id}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
