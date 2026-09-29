import { SupabaseClient } from "@supabase/supabase-js";
import {
  Database,
  SessionDbRow,
  SessionStatus,
  ProfileRow,
  SkillDbRow,
} from "@/types/database.types";
import { resolveClient, checkConfigured, ServiceResult } from "./utils";
import { CREDIT_RULES } from "@/constants/config";
import { creditService } from "./creditService";
import { notificationService } from "./notificationService";
import {
  isValidUuid,
  sanitizeSessionReason,
  checkRateLimit,
} from "@/lib/security/sanitize";

export interface SessionWithRelations extends SessionDbRow {
  teacher?: ProfileRow;
  learner?: ProfileRow;
  skill?: SkillDbRow;
}

export interface AvailableSlot {
  slotTime: string; // e.g. "09:00"
  startTime: string; // "09:00:00"
  endTime: string;   // "09:30:00"
  isoString: string; // Full ISO timestamp
  isAvailable: boolean;
  reason?: string;
}

export interface BookSessionParams {
  teacherId: string;
  learnerId: string;
  skillId: string;
  scheduledAt: string; // ISO 8601
  duration?: number;
  creditAmount?: number;
}

export interface SessionMutationResult {
  success: boolean;
  sessionId: string;
  status: SessionStatus;
  message?: string;
}

export const sessionService = {
  /**
   * Retrieves all sessions where the user is either the teacher or the learner.
   */
  async getUserSessions(
    userId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<SessionWithRelations[]>> {
    if (!checkConfigured()) {
      return { data: [], error: null };
    }

    try {
      const sb = resolveClient(client);
      const { data, error } = await sb
        .from("sessions")
        .select(`
          *,
          teacher:profiles!sessions_teacher_id_fkey (*),
          learner:profiles!sessions_learner_id_fkey (*),
          skill:skills (*)
        `)
        .or(`teacher_id.eq.${userId},learner_id.eq.${userId}`)
        .order("scheduled_at", { ascending: false });

      if (error) {
        return { data: null, error: error.message };
      }

      return {
        data: (data as unknown as SessionWithRelations[]) ?? [],
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to load sessions.",
      };
    }
  },

  /**
   * Calculates available booking slots for a teacher on a specific date (YYYY-MM-DD),
   * based on their availability schedule and existing active bookings.
   */
  async getTeacherAvailableSlots(
    teacherId: string,
    dateString: string, // YYYY-MM-DD
    slotDurationMinutes = 30,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<AvailableSlot[]>> {
    if (!teacherId || !dateString) {
      return { data: [], error: "Teacher ID and date are required." };
    }

    // Parse date and day of week
    const targetDate = new Date(`${dateString}T00:00:00`);
    if (isNaN(targetDate.getTime())) {
      return { data: [], error: "Invalid date format. Expected YYYY-MM-DD." };
    }
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    if (!checkConfigured()) {
      // Offline fallback: generate mock slots 9am-5pm
      const fallbackSlots: AvailableSlot[] = [];
      for (let h = 9; h <= 17; h++) {
        const hh = h.toString().padStart(2, "0");
        fallbackSlots.push({
          slotTime: `${hh}:00`,
          startTime: `${hh}:00:00`,
          endTime: `${hh}:30:00`,
          isoString: new Date(`${dateString}T${hh}:00:00`).toISOString(),
          isAvailable: true,
        });
      }
      return { data: fallbackSlots, error: null };
    }

    try {
      const sb = resolveClient(client);

      // 1. Fetch teacher's recurring availability for this day of week
      const { data: availData, error: availErr } = await sb
        .from("availability")
        .select("*")
        .eq("user_id", teacherId)
        .eq("day_of_week", dayOfWeek);

      if (availErr) {
        return { data: null, error: availErr.message };
      }

      if (!availData || availData.length === 0) {
        return { data: [], error: null }; // Teacher not available on this day
      }

      // 2. Fetch teacher's existing sessions for this date
      const startOfDay = new Date(`${dateString}T00:00:00Z`).toISOString();
      const endOfDay = new Date(`${dateString}T23:59:59Z`).toISOString();

      const { data: existingSessions, error: sessErr } = await sb
        .from("sessions")
        .select("scheduled_at, duration, status")
        .eq("teacher_id", teacherId)
        .in("status", ["pending", "confirmed"])
        .gte("scheduled_at", startOfDay)
        .lte("scheduled_at", endOfDay);

      if (sessErr) {
        return { data: null, error: sessErr.message };
      }

      const bookedTimestamps = new Set(
        (existingSessions || []).map((s) => new Date(s.scheduled_at).getTime())
      );

      const nowTime = Date.now();
      const slots: AvailableSlot[] = [];

      // 3. Slice each availability window into slotDurationMinutes intervals
      availData.forEach((range) => {
        const [startH, startM] = range.start_time.split(":").map(Number);
        const [endH, endM] = range.end_time.split(":").map(Number);

        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        for (
          let m = startMinutes;
          m + slotDurationMinutes <= endMinutes;
          m += slotDurationMinutes
        ) {
          const slotH = Math.floor(m / 60);
          const slotM = m % 60;
          const endSlotM = m + slotDurationMinutes;
          const endSlotH = Math.floor(endSlotM / 60);
          const endSlotMin = endSlotM % 60;

          const hh = slotH.toString().padStart(2, "0");
          const mm = slotM.toString().padStart(2, "0");
          const endHh = endSlotH.toString().padStart(2, "0");
          const endMm = endSlotMin.toString().padStart(2, "0");

          const slotTime = `${hh}:${mm}`;
          const startTime = `${hh}:${mm}:00`;
          const endTime = `${endHh}:${endMm}:00`;

          const slotDate = new Date(`${dateString}T${startTime}`);
          const slotTimestamp = slotDate.getTime();

          const isPast = slotTimestamp <= nowTime;
          const isBooked = bookedTimestamps.has(slotTimestamp);

          slots.push({
            slotTime,
            startTime,
            endTime,
            isoString: slotDate.toISOString(),
            isAvailable: !isPast && !isBooked,
            reason: isPast
              ? "Past time"
              : isBooked
              ? "Already booked"
              : undefined,
          });
        }
      });

      // Sort chronological
      slots.sort((a, b) => a.startTime.localeCompare(b.startTime));

      return { data: slots, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to calculate slots.",
      };
    }
  },

  /**
   * Books a new 1-on-1 session request.
   */
  async bookSession(
    params: BookSessionParams,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<SessionMutationResult>> {
    const {
      teacherId,
      learnerId,
      skillId,
      scheduledAt,
      duration = CREDIT_RULES.sessionDurationMinutes,
      creditAmount = CREDIT_RULES.learnCostPerSession,
    } = params;

    if (!teacherId || !learnerId || !skillId || !scheduledAt) {
      return { data: null, error: "All booking details are required." };
    }

    if (teacherId === learnerId) {
      return { data: null, error: "You cannot book a session with yourself." };
    }

    // Handle demo / fallback mentors during development
    if (teacherId.startsWith("m-") || teacherId.startsWith("mock-") || skillId.startsWith("mock-")) {
      return {
        data: {
          success: true,
          sessionId: `mock-sess-${Date.now()}`,
          status: "pending",
          message: "Demo session booking submitted successfully.",
        },
        error: null,
      };
    }

    if (!isValidUuid(teacherId) || !isValidUuid(learnerId) || !isValidUuid(skillId)) {
      return { data: null, error: "Invalid identifier format in booking parameters." };
    }

    // Rate limit: max 8 booking actions per minute per learner
    const rateCheck = checkRateLimit(`book_${learnerId}`, 8, 60000);
    if (!rateCheck.allowed) {
      return {
        data: null,
        error: `Too many booking attempts. Please wait ${rateCheck.retryAfterSeconds} seconds.`,
      };
    }

    if (new Date(scheduledAt).getTime() <= Date.now()) {
      return { data: null, error: "Booking time must be in the future." };
    }

    if (!checkConfigured()) {
      return {
        data: {
          success: true,
          sessionId: `local-sess-${Date.now()}`,
          status: "pending",
          message: "Session request submitted.",
        },
        error: null,
      };
    }

    try {
      const sb = resolveClient(client);

      // Attempt using the atomic stored procedure
      const { data, error } = await sb.rpc("book_session", {
        p_teacher_id: teacherId,
        p_learner_id: learnerId,
        p_skill_id: skillId,
        p_scheduled_at: scheduledAt,
        p_duration: duration,
        p_credit_amount: creditAmount,
      });

      if (error) {
        // Fallback to client-side insert if RPC is not loaded yet
        const { data: insertData, error: insertErr } = await sb
          .from("sessions")
          .insert({
            teacher_id: teacherId,
            learner_id: learnerId,
            skill_id: skillId,
            scheduled_at: scheduledAt,
            duration,
            credit_amount: creditAmount,
            status: "pending",
          })
          .select()
          .single();

        if (insertErr) {
          return { data: null, error: insertErr.message };
        }

        const newSessionId = insertData.id;
        notificationService
          .createNotification({
            userId: teacherId,
            type: "session_booking",
            title: "New Session Booking Request",
            content: "A peer has requested a swap session with you.",
            linkUrl: "/dashboard/sessions",
            referenceId: newSessionId,
          })
          .catch(() => {});

        return {
          data: {
            success: true,
            sessionId: newSessionId,
            status: "pending",
          },
          error: null,
        };
      }

      interface BookRpcResult {
        success: boolean;
        session_id: string;
        status: SessionStatus;
      }
      const rpcData = data as unknown as BookRpcResult;

      if (rpcData.success && rpcData.session_id) {
        notificationService
          .createNotification({
            userId: teacherId,
            type: "session_booking",
            title: "New Session Booking Request",
            content: "A peer has requested a swap session with you.",
            linkUrl: "/dashboard/sessions",
            referenceId: rpcData.session_id,
          })
          .catch(() => {});
      }

      return {
        data: {
          success: rpcData.success,
          sessionId: rpcData.session_id,
          status: rpcData.status,
        },
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to book session.",
      };
    }
  },

  /**
   * Confirms a pending session request (Teacher accepts, learner credits deducted).
   */
  async confirmSession(
    sessionId: string,
    callerId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<SessionMutationResult>> {
    if (!checkConfigured()) {
      return {
        data: { success: true, sessionId, status: "confirmed" },
        error: null,
      };
    }

    try {
      const sb = resolveClient(client);
      const { data: _data, error } = await sb.rpc("confirm_session", {
        p_session_id: sessionId,
        p_caller_id: callerId,
      });

      if (error) {
        // Fallback: update status and charge learner
        const { data: sess, error: getErr } = await sb
          .from("sessions")
          .select("*, skill:skills(name)")
          .eq("id", sessionId)
          .single();

        if (getErr || !sess) {
          return { data: null, error: error.message };
        }

        const skillName = (sess.skill as unknown as { name?: string })?.name || "Skill Swap";
        await creditService.chargeLearnerForSession(
          sess.learner_id,
          sessionId,
          skillName,
          sess.credit_amount
        );

        const { error: updErr } = await sb
          .from("sessions")
          .update({ status: "confirmed" })
          .eq("id", sessionId);

        if (updErr) return { data: null, error: updErr.message };

        // Notify learner asynchronously
        notificationService
          .createNotification({
            userId: sess.learner_id,
            type: "session_confirmed",
            title: "Session Confirmed!",
            content: "Your session has been accepted. You can join the room at the scheduled time.",
            linkUrl: `/dashboard/sessions/${sessionId}/room`,
            referenceId: sessionId,
          })
          .catch(() => {});

        return {
          data: { success: true, sessionId, status: "confirmed" },
          error: null,
        };
      }

      // Notify learner on successful RPC confirmation
      void (async () => {
        try {
          const { data: sess } = await sb
            .from("sessions")
            .select("learner_id")
            .eq("id", sessionId)
            .single();

          if (sess?.learner_id) {
            await notificationService.createNotification({
              userId: sess.learner_id,
              type: "session_confirmed",
              title: "Session Confirmed!",
              content: "Your session has been accepted. You can join the room at the scheduled time.",
              linkUrl: `/dashboard/sessions/${sessionId}/room`,
              referenceId: sessionId,
            });
          }
        } catch {
          // Handled
        }
      })();

      return {
        data: { success: true, sessionId, status: "confirmed" },
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to confirm session.",
      };
    }
  },

  /**
   * Cancels a session (Refunds learner credits if session was already confirmed).
   */
  async cancelSession(
    sessionId: string,
    callerId: string,
    reason?: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<SessionMutationResult>> {
    if (!isValidUuid(sessionId) || !isValidUuid(callerId)) {
      return { data: null, error: "Invalid session or user identifier." };
    }

    const cleanReason = reason ? sanitizeSessionReason(reason) : null;

    if (!checkConfigured()) {
      return {
        data: { success: true, sessionId, status: "cancelled" },
        error: null,
      };
    }

    try {
      const sb = resolveClient(client);
      const { data: _data, error } = await sb.rpc("cancel_session", {
        p_session_id: sessionId,
        p_caller_id: callerId,
        p_reason: cleanReason,
      });

      if (error) {
        // Fallback: check if confirmed and refund
        const { data: sess } = await sb
          .from("sessions")
          .select("*, skill:skills(name)")
          .eq("id", sessionId)
          .single();

        if (sess && sess.status === "confirmed") {
          const skillName = (sess.skill as unknown as { name?: string })?.name || "Skill Swap";
          await creditService.executeCreditTransaction(
            sess.learner_id,
            sess.credit_amount,
            "refund",
            `Refund for cancelled session: ${skillName}`,
            sessionId
          );
        }

        await sb
          .from("sessions")
          .update({ status: "cancelled" })
          .eq("id", sessionId);

        if (sess) {
          const targetId = callerId === sess.teacher_id ? sess.learner_id : sess.teacher_id;
          notificationService
            .createNotification({
              userId: targetId,
              type: "session_cancelled",
              title: "Session Cancelled",
              content: `A swap session was cancelled.${reason ? ` Reason: ${reason}` : ""}`,
              linkUrl: "/dashboard/sessions",
              referenceId: sessionId,
            })
            .catch(() => {});
        }

        return {
          data: { success: true, sessionId, status: "cancelled" },
          error: null,
        };
      }

      // Notify peer on RPC cancellation
      void (async () => {
        try {
          const { data: sess } = await sb
            .from("sessions")
            .select("teacher_id, learner_id")
            .eq("id", sessionId)
            .single();

          if (sess) {
            const targetId = callerId === sess.teacher_id ? sess.learner_id : sess.teacher_id;
            await notificationService.createNotification({
              userId: targetId,
              type: "session_cancelled",
              title: "Session Cancelled",
              content: `A swap session was cancelled.${reason ? ` Reason: ${reason}` : ""}`,
              linkUrl: "/dashboard/sessions",
              referenceId: sessionId,
            });
          }
        } catch {
          // Handled
        }
      })();

      return {
        data: { success: true, sessionId, status: "cancelled" },
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to cancel session.",
      };
    }
  },

  /**
   * Declines a pending session request.
   */
  async rejectSession(
    sessionId: string,
    callerId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<SessionMutationResult>> {
    if (!checkConfigured()) {
      return {
        data: { success: true, sessionId, status: "rejected" },
        error: null,
      };
    }

    try {
      const sb = resolveClient(client);
      const { data: _data, error } = await sb.rpc("reject_session", {
        p_session_id: sessionId,
        p_caller_id: callerId,
      });

      if (error) {
        await sb
          .from("sessions")
          .update({ status: "rejected" })
          .eq("id", sessionId);
      }

      // Notify learner
      void (async () => {
        try {
          const { data: sess } = await sb
            .from("sessions")
            .select("learner_id")
            .eq("id", sessionId)
            .single();

          if (sess?.learner_id) {
            await notificationService.createNotification({
              userId: sess.learner_id,
              type: "session_rejected",
              title: "Session Request Declined",
              content: "Your session booking request could not be accepted at this time.",
              linkUrl: "/dashboard/sessions",
              referenceId: sessionId,
            });
          }
        } catch {
          // Handled
        }
      })();

      return {
        data: { success: true, sessionId, status: "rejected" },
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to decline session.",
      };
    }
  },

  /**
   * Marks a session as completed (Awards credits to teacher).
   */
  async completeSession(
    sessionId: string,
    callerId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<SessionMutationResult>> {
    if (!checkConfigured()) {
      return {
        data: { success: true, sessionId, status: "completed" },
        error: null,
      };
    }

    try {
      const sb = resolveClient(client);
      const { data: _data, error } = await sb.rpc("complete_session", {
        p_session_id: sessionId,
        p_caller_id: callerId,
      });

      if (error) {
        const { data: sess } = await sb
          .from("sessions")
          .select("*, skill:skills(name)")
          .eq("id", sessionId)
          .single();

        if (sess) {
          const skillName = (sess.skill as unknown as { name?: string })?.name || "Skill Swap";
          await creditService.rewardTeacherForSession(
            sess.teacher_id,
            sessionId,
            skillName,
            sess.credit_amount
          );
        }

        await sb
          .from("sessions")
          .update({ status: "completed" })
          .eq("id", sessionId);

        if (sess) {
          notificationService
            .createNotification({
              userId: sess.teacher_id,
              type: "session_completed",
              title: "Session Completed & Rewarded",
              content: "Your teaching session is complete and credits have been added to your balance.",
              linkUrl: "/dashboard/credits",
              referenceId: sessionId,
            })
            .catch(() => {});

          notificationService
            .createNotification({
              userId: sess.learner_id,
              type: "session_completed",
              title: "Session Completed",
              content: "Your learning session has ended. Thank you for swapping skills!",
              linkUrl: "/dashboard/sessions",
              referenceId: sessionId,
            })
            .catch(() => {});
        }

        return {
          data: { success: true, sessionId, status: "completed" },
          error: null,
        };
      }

      // Notify both participants on RPC completion
      void (async () => {
        try {
          const { data: sess } = await sb
            .from("sessions")
            .select("teacher_id, learner_id")
            .eq("id", sessionId)
            .single();

          if (sess) {
            await notificationService.createNotification({
              userId: sess.teacher_id,
              type: "session_completed",
              title: "Session Completed & Rewarded",
              content: "Your teaching session is complete and credits have been added to your balance.",
              linkUrl: "/dashboard/credits",
              referenceId: sessionId,
            });

            await notificationService.createNotification({
              userId: sess.learner_id,
              type: "session_completed",
              title: "Session Completed",
              content: "Your learning session has ended. Thank you for swapping skills!",
              linkUrl: "/dashboard/sessions",
              referenceId: sessionId,
            });
          }
        } catch {
          // Handled
        }
      })();

      return {
        data: { success: true, sessionId, status: "completed" },
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to complete session.",
      };
    }
  },
};
