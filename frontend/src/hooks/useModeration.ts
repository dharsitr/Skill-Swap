import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { moderationService } from '@/services/moderationService';
import type { DisputeStatus, ReportStatus, UpdateDisputeStatusRequest, UpdateReportStatusRequest } from '@/types/api';

export const useModerationReports = (status?: ReportStatus, page = 0, size = 20) => {
  return useQuery({
    queryKey: ['moderation', 'reports', status, page, size],
    queryFn: () => moderationService.getReports(status, page, size),
  });
};

export const useModerationReportDetail = (id: string) => {
  return useQuery({
    queryKey: ['moderation', 'report', id],
    queryFn: () => moderationService.getReportById(id),
    enabled: Boolean(id),
  });
};

export const useUpdateReportStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateReportStatusRequest }) =>
      moderationService.updateReportStatus(id, request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['moderation', 'reports'] });
      queryClient.invalidateQueries({ queryKey: ['moderation', 'report', data.id] });
    },
  });
};

export const useModerationDisputes = (status?: DisputeStatus, page = 0, size = 20) => {
  return useQuery({
    queryKey: ['moderation', 'disputes', status, page, size],
    queryFn: () => moderationService.getDisputes(status, page, size),
  });
};

export const useModerationDisputeDetail = (id: string) => {
  return useQuery({
    queryKey: ['moderation', 'dispute', id],
    queryFn: () => moderationService.getDisputeById(id),
    enabled: Boolean(id),
  });
};

export const useUpdateDisputeStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateDisputeStatusRequest }) =>
      moderationService.updateDisputeStatus(id, request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['moderation', 'disputes'] });
      queryClient.invalidateQueries({ queryKey: ['moderation', 'dispute', data.id] });
    },
  });
};
