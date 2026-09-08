import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { safetyService } from '@/services/safetyService';
import type { CreateDisputeRequest, CreateReportRequest } from '@/types/api';

// Blocking hooks
export const useBlockStatus = (userId: string) => {
  return useQuery({
    queryKey: ['blocks', 'status', userId],
    queryFn: () => safetyService.getBlockStatus(userId),
    enabled: Boolean(userId),
  });
};

export const useBlockedUsers = (page = 0, size = 20) => {
  return useQuery({
    queryKey: ['blocks', 'my', page, size],
    queryFn: () => safetyService.getBlockedUsers(page, size),
  });
};

export const useBlockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (blockedUserId: string) => safetyService.blockUser(blockedUserId),
    onSuccess: (_, blockedUserId) => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      queryClient.invalidateQueries({ queryKey: ['blocks', 'status', blockedUserId] });
      queryClient.invalidateQueries({ queryKey: ['discover'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useUnblockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (blockedUserId: string) => safetyService.unblockUser(blockedUserId),
    onSuccess: (_, blockedUserId) => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      queryClient.invalidateQueries({ queryKey: ['blocks', 'status', blockedUserId] });
      queryClient.invalidateQueries({ queryKey: ['discover'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

// Reporting hooks
export const useCreateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateReportRequest) => safetyService.createReport(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'my'] });
    },
  });
};

export const useMyReports = (page = 0, size = 10) => {
  return useQuery({
    queryKey: ['reports', 'my', page, size],
    queryFn: () => safetyService.getMyReports(page, size),
  });
};

// Dispute hooks
export const useCreateDispute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateDisputeRequest) => safetyService.createDispute(request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['disputes', 'my'] });
      queryClient.invalidateQueries({ queryKey: ['disputes', 'session', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessions', variables.sessionId] });
    },
  });
};

export const useSessionDispute = (sessionId: string) => {
  return useQuery({
    queryKey: ['disputes', 'session', sessionId],
    queryFn: () => safetyService.getDisputeForSession(sessionId),
    enabled: Boolean(sessionId),
  });
};

export const useMyDisputes = (page = 0, size = 10) => {
  return useQuery({
    queryKey: ['disputes', 'my', page, size],
    queryFn: () => safetyService.getMyDisputes(page, size),
  });
};
