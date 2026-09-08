import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '@/services/reviewService';
import type { CreateReviewRequest } from '@/types/api';

export const useUserReviews = (userId: string, page = 0, size = 10) => {
  return useQuery({
    queryKey: ['reviews', 'profile', userId, page, size],
    queryFn: () => reviewService.getUserReviews(userId, page, size),
    enabled: Boolean(userId),
  });
};

export const useRatingSummary = (userId: string) => {
  return useQuery({
    queryKey: ['rating-summary', userId],
    queryFn: () => reviewService.getUserRatingSummary(userId),
    enabled: Boolean(userId),
  });
};

export const useSessionReviewStatus = (sessionId: string) => {
  return useQuery({
    queryKey: ['reviews', 'session-status', sessionId],
    queryFn: () => reviewService.getSessionReviewStatus(sessionId),
    enabled: Boolean(sessionId),
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateReviewRequest) => reviewService.createReview(request),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['reviews', 'session-status', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['reviews', 'profile', data.revieweeId] });
      queryClient.invalidateQueries({ queryKey: ['rating-summary', data.revieweeId] });
      queryClient.invalidateQueries({ queryKey: ['sessions', variables.sessionId] });
    },
  });
};
