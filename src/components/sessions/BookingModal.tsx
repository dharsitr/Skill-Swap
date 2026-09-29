"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  sessionService,
  creditService,
  discoveryService,
  AvailableSlot,
  DiscoverableUser,
  DiscoverableSkill,
} from "@/lib/supabase/services";
import { CREDIT_RULES } from "@/constants/config";
import {
  Calendar as CalendarIcon,
  Clock,
  Coins,
  GraduationCap,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ChevronRight,
  User,
  Globe,
} from "lucide-react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedMentor?: DiscoverableUser | null;
  preselectedSkillId?: string;
  onBookingSuccess?: (sessionId: string) => void;
}

export function BookingModal({
  isOpen,
  onClose,
  preselectedMentor,
  preselectedSkillId,
  onBookingSuccess,
}: BookingModalProps) {
  const { user } = useAuth();
  const { showToast } = useApp();

  // Mentor & Skill selection
  const [selectedMentor, setSelectedMentor] = useState<DiscoverableUser | null>(
    preselectedMentor || null
  );
  const [availableMentors, setAvailableMentors] = useState<DiscoverableUser[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<DiscoverableSkill | null>(null);

  // Date & Slot selection
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Credits & Balance
  const [userBalance, setUserBalance] = useState<number>(50);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Generate next 14 days
  const dateOptions = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const fullDay = d.toLocaleDateString("en-US", { weekday: "long" });
      const monthDay = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      days.push({ iso, dayName, fullDay, monthDay });
    }
    return days;
  }, []);

  // Sync preselected mentor
  useEffect(() => {
    if (preselectedMentor) {
      setSelectedMentor(preselectedMentor);
      if (preselectedMentor.teachSkills.length > 0) {
        if (preselectedSkillId) {
          const found = preselectedMentor.teachSkills.find((s) => s.id === preselectedSkillId);
          setSelectedSkill(found || preselectedMentor.teachSkills[0]);
        } else {
          setSelectedSkill(preselectedMentor.teachSkills[0]);
        }
      }
    }
  }, [preselectedMentor, preselectedSkillId]);

  // Load mentors if not preselected
  useEffect(() => {
    if (!preselectedMentor && isOpen) {
      discoveryService.getDiscoverableUsers(user?.id).then((res) => {
        if (res.data) {
          setAvailableMentors(res.data);
          if (res.data.length > 0 && !selectedMentor) {
            setSelectedMentor(res.data[0]);
            if (res.data[0].teachSkills.length > 0) {
              setSelectedSkill(res.data[0].teachSkills[0]);
            }
          }
        }
      });
    }
  }, [preselectedMentor, isOpen, user?.id, selectedMentor]);

  // Load user credit balance
  useEffect(() => {
    if (user?.id && isOpen) {
      creditService.getUserCreditBalance(user.id).then((res) => {
        if (res.data) setUserBalance(res.data.balance);
      });
    }
  }, [user?.id, isOpen]);

  // Default to first date option
  useEffect(() => {
    if (isOpen && dateOptions.length > 0 && !selectedDate) {
      setSelectedDate(dateOptions[0].iso);
    }
  }, [isOpen, dateOptions, selectedDate]);

  // Load slots whenever mentor or date changes
  const loadSlots = useCallback(async (mentorId: string, dateStr: string) => {
    setIsLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const res = await sessionService.getTeacherAvailableSlots(mentorId, dateStr);
      setAvailableSlots(res.data || []);
    } catch {
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (selectedMentor?.id && selectedDate) {
      loadSlots(selectedMentor.id, selectedDate);
    }
  }, [selectedMentor?.id, selectedDate, loadSlots]);

  const cost = CREDIT_RULES.learnCostPerSession;
  const hasEnoughCredits = userBalance >= cost;

  // Local user timezone
  const userTimeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);

  // Handle Booking submission
  const handleConfirmBooking = async () => {
    if (!user?.id || !selectedMentor || !selectedSkill || !selectedSlot) {
      setBookingError("Please pick a skill, date, and available time slot.");
      return;
    }

    if (new Date(selectedSlot.isoString).getTime() <= Date.now()) {
      setBookingError("The selected time slot has already passed. Please select a future time slot.");
      return;
    }

    if (!hasEnoughCredits) {
      setBookingError(`Insufficient credits. You need ${cost} credits, but have ${userBalance}.`);
      return;
    }

    setIsBooking(true);
    setBookingError(null);

    try {
      const res = await sessionService.bookSession({
        teacherId: selectedMentor.id,
        learnerId: user.id,
        skillId: selectedSkill.id,
        scheduledAt: selectedSlot.isoString,
        duration: CREDIT_RULES.sessionDurationMinutes,
        creditAmount: cost,
      });

      if (res.error) {
        setBookingError(res.error);
        return;
      }

      showToast(`Session request sent to ${selectedMentor.displayName}!`);
      onBookingSuccess?.(res.data!.sessionId);
      onClose();
    } catch {
      setBookingError("Could not submit booking request. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule 1-on-1 Skill Swap"
      description="Select topic, date, and available time slot to book your peer learning session."
      maxWidth="lg"
    >
      <div className="space-y-5 pt-2 max-h-[75vh] overflow-y-auto pr-1">
        {bookingError && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{bookingError}</span>
          </div>
        )}

        {/* 1. Mentor Selection (if not preselected) */}
        {!preselectedMentor && availableMentors.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Select Mentor
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableMentors.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedMentor(m);
                    if (m.teachSkills.length > 0) setSelectedSkill(m.teachSkills[0]);
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    selectedMentor?.id === m.id
                      ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <Avatar src={m.avatarUrl || undefined} alt={m.displayName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 truncate">{m.displayName}</div>
                    <div className="text-[11px] text-slate-500 truncate">{m.headline}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mentor Card Preview (if preselected or selected) */}
        {selectedMentor && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                src={selectedMentor.avatarUrl || undefined}
                alt={selectedMentor.displayName}
                size="md"
                isOnline={true}
              />
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate">
                  {selectedMentor.displayName}
                </span>
                <span className="text-[11px] text-indigo-600 font-semibold truncate block">
                  {selectedMentor.headline}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Available Days
              </span>
              <span className="text-xs font-semibold text-slate-700">
                {selectedMentor.availableDays.length > 0
                  ? selectedMentor.availableDays.slice(0, 3).join(", ")
                  : "Flexible"}
              </span>
            </div>
          </div>
        )}

        {/* 2. Skill Selection */}
        {selectedMentor && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
              <span>Skill to Learn</span>
            </label>

            {selectedMentor.teachSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedMentor.teachSkills.map((s) => {
                  const isSelected = selectedSkill?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSkill(s)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">This mentor has no skills listed.</p>
            )}
          </div>
        )}

        {/* 3. Date Picker (Next 14 Days Horizontal Slider) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5 text-indigo-600" />
            <span>Select Date</span>
          </label>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {dateOptions.map((d) => {
              const isSelected = selectedDate === d.iso;
              const isMentorAvailable =
                selectedMentor?.availableDays.some(
                  (day) => day.toLowerCase() === d.fullDay.toLowerCase()
                ) ?? true;

              return (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => setSelectedDate(d.iso)}
                  className={`flex flex-col items-center justify-center p-2.5 min-w-[70px] rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                      : isMentorAvailable
                      ? "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      : "border-slate-100 bg-slate-50/60 text-slate-400 opacity-60"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {d.dayName}
                  </span>
                  <span className="text-xs font-extrabold mt-0.5">{d.monthDay}</span>
                  {isMentorAvailable && !isSelected && (
                    <span className="h-1 w-1 rounded-full bg-emerald-500 mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Time Slot Selection */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-indigo-600" />
              <span>Available Time Slots (30 mins)</span>
            </label>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                <Globe className="h-3 w-3 text-slate-400" />
                {userTimeZone}
              </span>
              {selectedDate && (
                <span className="text-slate-400">
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>

          {isLoadingSlots ? (
            <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              <span>Checking mentor availability...</span>
            </div>
          ) : availableSlots.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {availableSlots.map((slot) => {
                const isSelected = selectedSlot?.slotTime === slot.slotTime;
                const isPast = slot.reason === "Past time";
                const canSelect = slot.isAvailable;

                return (
                  <button
                    key={slot.slotTime}
                    type="button"
                    disabled={!canSelect}
                    onClick={() => setSelectedSlot(slot)}
                    title={isPast ? "Past time" : !slot.isAvailable ? slot.reason || "Unavailable" : undefined}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : canSelect
                        ? "bg-white border-slate-200 text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer"
                        : "bg-slate-100/60 border-slate-200 text-slate-400 cursor-not-allowed line-through"
                    }`}
                  >
                    {slot.slotTime}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center text-xs text-slate-500">
              Mentor has no open availability slots on this day. Please pick another date.
            </div>
          )}
        </div>

        {/* 5. Booking & Credit Summary */}
        <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-500 fill-amber-400" />
              <span className="font-bold text-indigo-950">Session Cost: {cost} Credits</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 font-medium">30 mins exchange</span>
            </div>
            <div className="text-slate-500 text-[11px]">
              Your Balance: <strong className="text-slate-800">{userBalance} Credits</strong>
              {!hasEnoughCredits && (
                <span className="text-rose-600 font-bold ml-1.5">(Insufficient balance)</span>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 max-w-xs sm:text-right">
            Credits are reserved upon teacher confirmation. 100% refunded if cancelled.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isBooking}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirmBooking}
            disabled={
              isBooking ||
              !selectedMentor ||
              !selectedSkill ||
              !selectedSlot ||
              !hasEnoughCredits
            }
            className="font-bold shadow-xs"
          >
            {isBooking ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Booking...
              </>
            ) : (
              <>
                Confirm Booking Request
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
