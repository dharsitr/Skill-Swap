"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Zap,
  Video,
  ArrowRight,
} from "lucide-react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedMentor?: DiscoverableUser | null;
  preselectedSkillId?: string;
  initialImmediate?: boolean;
  onBookingSuccess?: (sessionId: string) => void;
}

export function BookingModal({
  isOpen,
  onClose,
  preselectedMentor,
  preselectedSkillId,
  initialImmediate = false,
  onBookingSuccess,
}: BookingModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useApp();

  // Mode: "immediate" or "scheduled"
  const [bookingMode, setBookingMode] = useState<"immediate" | "scheduled">(
    initialImmediate ? "immediate" : "scheduled"
  );

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

  // Post-booking immediate modal state
  const [immediateCreatedSessionId, setImmediateCreatedSessionId] = useState<string | null>(null);

  // Reset immediateCreatedSessionId on modal open
  useEffect(() => {
    if (isOpen) {
      setImmediateCreatedSessionId(null);
      if (initialImmediate) {
        setBookingMode("immediate");
      }
    }
  }, [isOpen, initialImmediate]);

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

  // Load slots whenever mentor or date changes (for scheduled mode)
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
    if (bookingMode === "scheduled" && selectedMentor?.id && selectedDate) {
      loadSlots(selectedMentor.id, selectedDate);
    }
  }, [bookingMode, selectedMentor?.id, selectedDate, loadSlots]);

  // Setup automatic immediate slot when in immediate mode
  useEffect(() => {
    if (bookingMode === "immediate") {
      const now = new Date();
      const targetTime = new Date(now.getTime() + 60 * 1000); // 1 min in future to pass database future check
      const endTargetTime = new Date(targetTime.getTime() + 30 * 60 * 1000);

      setSelectedSlot({
        slotTime: "Immediate (Now)",
        startTime: targetTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        endTime: endTargetTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isoString: targetTime.toISOString(),
        isAvailable: true,
      });
      setSelectedDate(now.toISOString().split("T")[0]);
    }
  }, [bookingMode]);

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
    if (!user?.id || !selectedMentor || !selectedSkill) {
      setBookingError("Please select a mentor and the skill you wish to learn.");
      return;
    }

    let slotToBook = selectedSlot;
    if (bookingMode === "immediate" || !slotToBook) {
      // Re-generate fresh immediate slot so timestamp is always validly ahead of now()
      const futureNow = new Date(Date.now() + 60 * 1000);
      slotToBook = {
        slotTime: "Immediate (Now)",
        startTime: futureNow.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        endTime: new Date(futureNow.getTime() + 30 * 60 * 1000).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isoString: futureNow.toISOString(),
        isAvailable: true,
      };
      setSelectedSlot(slotToBook);
    }

    if (new Date(slotToBook.isoString).getTime() <= Date.now()) {
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
        scheduledAt: slotToBook.isoString,
        duration: CREDIT_RULES.sessionDurationMinutes,
        creditAmount: cost,
      });

      if (res.error) {
        setBookingError(res.error);
        return;
      }

      const sessionId = res.data!.sessionId;

      if (bookingMode === "immediate") {
        setImmediateCreatedSessionId(sessionId);
        showToast(`Immediate session initiated with ${selectedMentor.displayName}!`);
        onBookingSuccess?.(sessionId);
      } else {
        showToast(`Session request sent to ${selectedMentor.displayName}!`);
        onBookingSuccess?.(sessionId);
        onClose();
      }
    } catch {
      setBookingError("Could not submit booking request. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  // Immediate Success view
  if (immediateCreatedSessionId) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Immediate Session Initiated!"
        description="Your 1-on-1 live session is ready. You can join the room right away."
        maxWidth="md"
      >
        <div className="space-y-5 pt-2 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center ring-8 ring-emerald-50">
            <Zap className="h-7 w-7 fill-emerald-500" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              Live Room Created with {selectedMentor?.displayName}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We notified {selectedMentor?.displayName} that you are waiting in the room. Hop in to start learning {selectedSkill?.name}!
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Topic:</span>
              <strong className="text-slate-900">{selectedSkill?.name}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Duration:</span>
              <strong className="text-slate-900">30 minutes</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Credits:</span>
              <strong className="text-amber-600 font-bold">{cost} Credits</strong>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex-1 font-semibold"
            >
              Close & View Sessions
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                router.push(`/dashboard/sessions/${immediateCreatedSessionId}/room`);
              }}
              className="flex-1 font-bold bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center justify-center gap-1.5"
            >
              <Video className="h-4 w-4" />
              Enter Live Room Now
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start or Schedule 1-on-1 Skill Swap"
      description="Connect live right now or pick an upcoming date to exchange knowledge."
      maxWidth="lg"
    >
      <div className="space-y-5 pt-1 max-h-[75vh] overflow-y-auto pr-1">
        {bookingError && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{bookingError}</span>
          </div>
        )}

        {/* Mode Selector Tabs: Immediate vs Scheduled */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setBookingMode("immediate")}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              bookingMode === "immediate"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Zap className={`h-4 w-4 ${bookingMode === "immediate" ? "fill-indigo-500 text-indigo-600" : "text-slate-400"}`} />
            <span>⚡ Start Immediate Session (Now)</span>
          </button>

          <button
            type="button"
            onClick={() => setBookingMode("scheduled")}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              bookingMode === "scheduled"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CalendarIcon className="h-4 w-4 text-slate-500" />
            <span>📅 Schedule for Later</span>
          </button>
        </div>

        {/* Immediate Mode Banner */}
        {bookingMode === "immediate" && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-indigo-50 border border-amber-200/80 flex items-start gap-3">
            <div className="p-1.5 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
              <Zap className="h-4 w-4 fill-white" />
            </div>
            <div className="text-xs space-y-0.5">
              <span className="font-bold text-slate-900 block">
                Immediate 1-on-1 Live Swap (Bypasses Mentor Schedule)
              </span>
              <p className="text-slate-600 leading-relaxed">
                You can start this live session right now even if the mentor is marked unavailable or has no calendar slots configured. Both of you can hop into the live video room immediately!
              </p>
            </div>
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
                Availability
              </span>
              <span className="text-xs font-semibold text-slate-700">
                {bookingMode === "immediate" ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1 justify-end">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Available Now
                  </span>
                ) : selectedMentor.availableDays.length > 0 ? (
                  selectedMentor.availableDays.slice(0, 3).join(", ")
                ) : (
                  "Flexible"
                )}
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

        {/* Scheduled Mode: Date & Slot Pickers */}
        {bookingMode === "scheduled" && (
          <>
            {/* 3. Date Picker */}
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
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-center text-xs text-slate-700 space-y-2">
                  <p className="text-slate-600">
                    Mentor has no pre-scheduled slots on this day.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setBookingMode("immediate")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
                  >
                    <Zap className="h-3.5 w-3.5 mr-1 fill-white" />
                    Start Immediate Session Instead
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

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
            Credits reserved upon confirmation. 100% refunded if cancelled.
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
              (bookingMode === "scheduled" && !selectedSlot) ||
              !hasEnoughCredits
            }
            className={`font-bold shadow-xs ${
              bookingMode === "immediate"
                ? "bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-700 hover:to-indigo-700 text-white"
                : ""
            }`}
          >
            {isBooking ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Initiating...
              </>
            ) : bookingMode === "immediate" ? (
              <>
                <Zap className="h-3.5 w-3.5 mr-1 fill-white" />
                ⚡ Start Immediate Session Now
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
