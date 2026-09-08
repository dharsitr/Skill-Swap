import { useQuery } from '@tanstack/react-query';
import { healthService } from '@/services/healthService';
import type { HealthResponse, VersionResponse } from '@/types/api';

export const HEALTH_QUERY_KEY = ['backend', 'health'] as const;
export const VERSION_QUERY_KEY = ['backend', 'version'] as const;

export function useBackendHealth() {
  return useQuery<HealthResponse, Error>({
    queryKey: HEALTH_QUERY_KEY,
    queryFn: () => healthService.getHealth(),
    refetchInterval: 15000, // Check every 15s in background
    retry: 1,
  });
}

export function useBackendVersion() {
  return useQuery<VersionResponse, Error>({
    queryKey: VERSION_QUERY_KEY,
    queryFn: () => healthService.getVersion(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}
