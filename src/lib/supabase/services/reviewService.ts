import { SupabaseClient } from "@supabase/supabase-js";
import {
  Database,
  ReviewDbRow,
} from "@/types/database.types";
import {
  ReviewWithProfiles,
  RatingSummary,
  CreateReviewInput,
  UpdateReviewInput,
} from "@/types";
import { resolveClient, checkConfigured, ServiceResult } from "./utils";
import { notificationService } from "./notificationService";
import {
  sanitizeReviewComment,
  isValidUuid,
  checkRateLimit,
} from "@/lib/security/sanitize";

export const reviewService = {
  /**
   * Retrieves all reviews received by a user (ordered newest first),
   * joined with the reviewer's profile data.
   */
  async getUserReviews(
    userId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<ReviewWithProfiles[]>> {
    if (!userId) {
      return { data: [], error: "User ID is required." };
    }

    if (!checkConfigured()) {
      return { data: [], error: null };
    }

    try {
      const sb = resolveClient(client);
      const { data, error } = await sb
        .from("reviews")
        .select(`
          *,
          reviewer:profiles!reviews_reviewer_id_fkey (
            id,
            display_name,
            avatar_url,
            headline
          ),
          reviewee:profiles!reviews_reviewee_id_fkey (
            id,
            display_name,
            avatar_url,
            headline
          )
        `)
        .eq("reviewee_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        return { data: null, error: error.message };
      }

      const formatted: ReviewWithProfiles[] = (data || []).map((r) => {
        const raw = r as unknown as ReviewDbRow & {
          reviewer?: { id: string; display_name: string | null; avatar_url: string | null; headline: string | null };
          reviewee?: { id: string; display_name: string | null; avatar_url: string | null; headline: string | null };
        };

        return {
          id: raw.id,
          sessionId: raw.session_id,
          reviewerId: raw.reviewer_id,
          revieweeId: raw.reviewee_id,
          rating: raw.rating,
          comment: raw.comment,
          createdAt: raw.created_at,
          updatedAt: raw.updated_at,
          reviewer: raw.reviewer
            ? {
                id: raw.reviewer.id,
                displayName: raw.reviewer.display_name,
                avatarUrl: raw.reviewer.avatar_url,
                headline: raw.reviewer.headline,
              }
            : undefined,
          reviewee: raw.reviewee
            ? {
                id: raw.reviewee.id,
                displayName: raw.reviewee.display_name,
                avatarUrl: raw.reviewee.avatar_url,
                headline: raw.reviewee.headline,
              }
            : undefined,
        };
      });

      return { data: formatted, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to load user reviews.",
      };
    }
  },

  /**
   * Calculates the rating summary (average, count, and 1-5 star distribution)
   * for a user.
   */
  async getUserRatingSummary(
    userId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<RatingSummary>> {
    const defaultSummary: RatingSummary = {
      averageRating: 0.0,
      totalReviews: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };

    if (!userId) {
      return { data: defaultSummary, error: "User ID is required." };
    }

    if (!checkConfigured()) {
      return { data: defaultSummary, error: null };
    }

    try {
      const sb = resolveClient(client);

      // Phase 17: Check privacy preference for rating summary
      const { data: priv } = await sb
        .from("privacy_preferences")
        .select("show_rating_summary")
        .eq("user_id", userId)
        .maybeSingle();

      if (priv && priv.show_rating_summary === false) {
        return { data: defaultSummary, error: null };
      }

      // Attempt using stored function RPC first
      const { data: rpcData, error: rpcErr } = await sb.rpc(
        "get_user_rating_summary",
        { p_user_id: userId }
      );


      if (!rpcErr && rpcData && rpcData.length > 0) {
        const row = rpcData[0];
        return {
          data: {
            averageRating: Number(row.average_rating) || 0.0,
            totalReviews: Number(row.total_reviews) || 0,
            distribution: {
              5: Number(row.five_star) || 0,
              4: Number(row.four_star) || 0,
              3: Number(row.three_star) || 0,
              2: Number(row.two_star) || 0,
              1: Number(row.one_star) || 0,
            },
          },
          error: null,
        };
      }

      // Fallback: Aggregate directly from reviews table
      const { data, error } = await sb
        .from("reviews")
        .select("rating")
        .eq("reviewee_id", userId);

      if (error) {
        return { data: defaultSummary, error: error.message };
      }

      const reviews = data || [];
      if (reviews.length === 0) {
        return { data: defaultSummary, error: null };
      }

      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let sum = 0;

      reviews.forEach((r) => {
        const rating = Math.min(5, Math.max(1, r.rating)) as 1 | 2 | 3 | 4 | 5;
        distribution[rating] = (distribution[rating] || 0) + 1;
        sum += rating;
      });

      const averageRating = Number((sum / reviews.length).toFixed(1));

      return {
        data: {
          averageRating,
          totalReviews: reviews.length,
          distribution,
        },
        error: null,
      };
    } catch (err: unknown) {
      return {
        data: defaultSummary,
        error: err instanceof Error ? err.message : "Failed to compute rating summary.",
      };
    }
  },

  /**
   * Batch queries rating summaries for multiple users simultaneously.
   * Prevents N+1 database queries on discovery cards.
   */
  async getBatchUserRatingSummaries(
    userIds: string[],
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<Record<string, { averageRating: number; totalReviews: number }>>> {
    const result: Record<string, { averageRating: number; totalReviews: number }> = {};
    userIds.forEach((id) => {
      result[id] = { averageRating: 0.0, totalReviews: 0 };
    });

    if (userIds.length === 0) {
      return { data: result, error: null };
    }

    if (!checkConfigured()) {
      return { data: result, error: null };
    }

    try {
      const sb = resolveClient(client);
      const { data, error } = await sb
        .from("reviews")
        .select("reviewee_id, rating")
        .in("reviewee_id", userIds);

      if (error) {
        return { data: result, error: error.message };
      }

      const userRatings: Record<string, number[]> = {};
      (data || []).forEach((row) => {
        if (!userRatings[row.reviewee_id]) {
          userRatings[row.reviewee_id] = [];
        }
        userRatings[row.reviewee_id].push(row.rating);
      });

      Object.entries(userRatings).forEach(([uid, ratings]) => {
        if (ratings.length > 0) {
          const sum = ratings.reduce((acc, curr) => acc + curr, 0);
          const avg = Number((sum / ratings.length).toFixed(1));
          result[uid] = {
            averageRating: avg,
            totalReviews: ratings.length,
          };
        }
      });

      return { data: result, error: null };
    } catch (err: unknown) {
      return {
        data: result,
        error: err instanceof Error ? err.message : "Failed to load batch ratings.",
      };
    }
  },

  /**
   * Checks whether a reviewer has already reviewed a given session.
   */
  async getSessionReview(
    sessionId: string,
    reviewerId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<ReviewWithProfiles | null>> {
    if (!sessionId || !reviewerId) {
      return { data: null, error: "Session ID and Reviewer ID are required." };
    }

    if (!checkConfigured()) {
      return { data: null, error: null };
    }

    try {
      const sb = resolveClient(client);
      const { data, error } = await sb
        .from("reviews")
        .select(`
          *,
          reviewer:profiles!reviews_reviewer_id_fkey (
            id,
            display_name,
            avatar_url,
            headline
          ),
          reviewee:profiles!reviews_reviewee_id_fkey (
            id,
            display_name,
            avatar_url,
            headline
          )
        `)
        .eq("session_id", sessionId)
        .eq("reviewer_id", reviewerId)
        .maybeSingle();

      if (error) {
        return { data: null, error: error.message };
      }

      if (!data) {
        return { data: null, error: null };
      }

      const raw = data as unknown as ReviewDbRow & {
        reviewer?: { id: string; display_name: string | null; avatar_url: string | null; headline: string | null };
        reviewee?: { id: string; display_name: string | null; avatar_url: string | null; headline: string | null };
      };

      const review: ReviewWithProfiles = {
        id: raw.id,
        sessionId: raw.session_id,
        reviewerId: raw.reviewer_id,
        revieweeId: raw.reviewee_id,
        rating: raw.rating,
        comment: raw.comment,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
        reviewer: raw.reviewer
          ? {
              id: raw.reviewer.id,
              displayName: raw.reviewer.display_name,
              avatarUrl: raw.reviewer.avatar_url,
              headline: raw.reviewer.headline,
            }
          : undefined,
        reviewee: raw.reviewee
          ? {
              id: raw.reviewee.id,
              displayName: raw.reviewee.display_name,
              avatarUrl: raw.reviewee.avatar_url,
              headline: raw.reviewee.headline,
            }
          : undefined,
      };

      return { data: review, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to load session review.",
      };
    }
  },

  /**
   * Submits a new review for a completed session.
   * Strictly validates session status, participants, rating range, and prevents duplicates.
   */
  async createReview(
    params: CreateReviewInput,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<ReviewDbRow>> {
    const { sessionId, reviewerId, revieweeId, rating, comment } = params;

    // Validate UUIDs
    if (!isValidUuid(sessionId) || !isValidUuid(reviewerId) || !isValidUuid(revieweeId)) {
      return { data: null, error: "Invalid session or participant identifier format." };
    }

    // Rate limiting: max 5 reviews per minute per user
    const rateCheck = checkRateLimit(`review_${reviewerId}`, 5, 60000);
    if (!rateCheck.allowed) {
      return {
        data: null,
        error: `Too many review actions. Please wait ${rateCheck.retryAfterSeconds} seconds.`,
      };
    }

    // 1. Validate rating range (1-5 integer)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return { data: null, error: "Rating must be an integer between 1 and 5." };
    }

    // 2. Validate & sanitize comment (max 1000)
    const sanitizedComment = comment ? sanitizeReviewComment(comment) : null;
    if (sanitizedComment && sanitizedComment.length > 1000) {
      return { data: null, error: "Review comment cannot exceed 1000 characters." };
    }

    // 3. Prevent self-review
    if (reviewerId === revieweeId) {
      return { data: null, error: "You cannot review yourself." };
    }

    if (!checkConfigured()) {
      const mockReview: ReviewDbRow = {
        id: `mock-review-${Date.now()}`,
        session_id: sessionId,
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        rating,
        comment: sanitizedComment,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return { data: mockReview, error: null };
    }

    try {
      const sb = resolveClient(client);

      // 4. Verify session exists and is completed
      const { data: session, error: sessionErr } = await sb
        .from("sessions")
        .select("id, status, teacher_id, learner_id")
        .eq("id", sessionId)
        .single();

      if (sessionErr || !session) {
        return { data: null, error: "Session not found." };
      }

      if (session.status !== "completed") {
        return {
          data: null,
          error: `Reviews can only be submitted for completed sessions (Current status: ${session.status}).`,
        };
      }

      // 5. Verify participants
      const isParticipant =
        (session.teacher_id === reviewerId && session.learner_id === revieweeId) ||
        (session.learner_id === reviewerId && session.teacher_id === revieweeId);

      if (!isParticipant) {
        return {
          data: null,
          error: "You can only review the participant you had the session with.",
        };
      }

      // 6. Prevent duplicate reviews
      const { data: existing } = await sb
        .from("reviews")
        .select("id")
        .eq("session_id", sessionId)
        .eq("reviewer_id", reviewerId)
        .maybeSingle();

      if (existing) {
        return {
          data: null,
          error: "You have already submitted a review for this session. You can edit your existing review instead.",
        };
      }

      // 7. Insert review
      const { data: newReview, error: insertErr } = await sb
        .from("reviews")
        .insert({
          session_id: sessionId,
          reviewer_id: reviewerId,
          reviewee_id: revieweeId,
          rating,
          comment: sanitizedComment,
        })
        .select()
        .single();

      if (insertErr || !newReview) {
        return { data: null, error: insertErr?.message || "Failed to create review." };
      }

      // 8. Send notification to reviewee asynchronously
      void (async () => {
        try {
          const { data: reviewerProfile } = await sb
            .from("profiles")
            .select("display_name")
            .eq("id", reviewerId)
            .single();

          const reviewerName = reviewerProfile?.display_name || "A peer";
          await notificationService.createNotification({
            userId: revieweeId,
            type: "review_received",
            title: "New Review Received",
            message: `${reviewerName} gave you a ${rating}-star review for your session.`,
            linkUrl: "/dashboard/profile",
            referenceId: newReview.id,
          });
        } catch {
          // Handled gracefully
        }
      })();

      return { data: newReview, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to submit review.",
      };
    }
  },

  /**
   * Updates an existing review. Only the original reviewer can edit.
   */
  async updateReview(
    params: UpdateReviewInput,
    reviewerId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<ReviewDbRow>> {
    const { reviewId, rating, comment } = params;

    if (!isValidUuid(reviewId) || !isValidUuid(reviewerId)) {
      return { data: null, error: "Invalid review or reviewer identifier format." };
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return { data: null, error: "Rating must be an integer between 1 and 5." };
    }

    const sanitizedComment = comment ? sanitizeReviewComment(comment) : null;
    if (sanitizedComment && sanitizedComment.length > 1000) {
      return { data: null, error: "Review comment cannot exceed 1000 characters." };
    }

    if (!checkConfigured()) {
      const mockUpdated: ReviewDbRow = {
        id: reviewId,
        session_id: "mock-session",
        reviewer_id: reviewerId,
        reviewee_id: "mock-reviewee",
        rating,
        comment: sanitizedComment,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return { data: mockUpdated, error: null };
    }

    try {
      const sb = resolveClient(client);

      const { data, error } = await sb
        .from("reviews")
        .update({
          rating,
          comment: sanitizedComment,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reviewId)
        .eq("reviewer_id", reviewerId)
        .select()
        .single();

      if (error || !data) {
        return { data: null, error: error?.message || "Failed to update review." };
      }

      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to update review.",
      };
    }
  },

  /**
   * Deletes a review. Only the original reviewer can delete.
   */
  async deleteReview(
    reviewId: string,
    reviewerId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<boolean>> {
    if (!reviewId || !reviewerId) {
      return { data: false, error: "Review ID and Reviewer ID are required." };
    }

    if (!checkConfigured()) {
      return { data: true, error: null };
    }

    try {
      const sb = resolveClient(client);
      const { error } = await sb
        .from("reviews")
        .delete()
        .eq("id", reviewId)
        .eq("reviewer_id", reviewerId);

      if (error) {
        return { data: false, error: error.message };
      }

      return { data: true, error: null };
    } catch (err: unknown) {
      return {
        data: false,
        error: err instanceof Error ? err.message : "Failed to delete review.",
      };
    }
  },
};
