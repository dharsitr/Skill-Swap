import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { personalizationService } from '@/services/personalizationService';
import type { RecordProfileViewRequest, RecordSearchRequest } from '@/types/api';

export const PERSONALIZATION_KEYS = {
  all: ['personalization'] as const,
  dashboard: ['dashboard'] as const,
  recommendedStudents: (limit = 10) => ['recommendations', 'students', { limit }] as const,
  recommendedSkills: (limit = 10) => ['recommendations', 'skills', { limit }] as const,
  viewedProfiles: (limit = 20) => ['history', 'profiles', { limit }] as const,
  searchHistory: (limit = 10) => ['history', 'searches', { limit }] as const,
  activity: (limit = 10) => ['activity', 'recent', { limit }] as const,
};

export const useDashboardSummary = () => {
  return useQuery({
    queryKey: PERSONALIZATION_KEYS.dashboard,
    queryFn: () => personalizationService.getDashboardSummary(),
    staleTime: 1000 * 30, // 30 seconds
  });
};

export const useRecommendedStudents = (limit = 10) => {
  return useQuery({
    queryKey: PERSONALIZATION_KEYS.recommendedStudents(limit),
    queryFn: () => personalizationService.getRecommendedStudents(limit),
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useRecommendedSkills = (limit = 10) => {
  return useQuery({
    queryKey: PERSONALIZATION_KEYS.recommendedSkills(limit),
    queryFn: () => personalizationService.getRecommendedSkills(limit),
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useRecentlyViewedProfiles = (limit = 20) => {
  return useQuery({
    queryKey: PERSONALIZATION_KEYS.viewedProfiles(limit),
    queryFn: () => personalizationService.getRecentlyViewedProfiles(limit),
    staleTime: 1000 * 30,
  });
};

export const useRecordProfileView = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: RecordProfileViewRequest) => personalizationService.recordProfileView(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history', 'profiles'] });
      queryClient.invalidateQueries({ queryKey: PERSONALIZATION_KEYS.dashboard });
    },
  });
};

export const useClearProfileHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => personalizationService.clearProfileHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history', 'profiles'] });
      queryClient.invalidateQueries({ queryKey: PERSONALIZATION_KEYS.dashboard });
    },
  });
};

export const useSearchHistory = (limit = 10) => {
  return useQuery({
    queryKey: PERSONALIZATION_KEYS.searchHistory(limit),
    queryFn: () => personalizationService.getSearchHistory(limit),
    staleTime: 1000 * 30,
  });
};

export const useRecordSearch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: RecordSearchRequest) => personalizationService.recordSearch(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history', 'searches'] });
      queryClient.invalidateQueries({ queryKey: PERSONALIZATION_KEYS.dashboard });
    },
  });
};

export const useClearSearchHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => personalizationService.clearSearchHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history', 'searches'] });
      queryClient.invalidateQueries({ queryKey: PERSONALIZATION_KEYS.dashboard });
    },
  });
};

export const useRecentActivity = (limit = 10) => {
  return useQuery({
    queryKey: PERSONALIZATION_KEYS.activity(limit),
    queryFn: () => personalizationService.getRecentActivity(limit),
    staleTime: 1000 * 30,
  });
};
