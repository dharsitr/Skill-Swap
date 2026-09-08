import { useQuery } from '@tanstack/react-query';
import { discoveryService } from '@/services/discoveryService';
import { useAuth } from '@/auth/useAuth';
import type {
  DiscoveryCandidate,
  DiscoveryFilterParams,
  PageResponse,
  PublicProfile,
} from '@/types/api';

export const DISCOVERY_QUERY_KEY = ['discovery', 'students'] as const;
export const RECOMMENDED_QUERY_KEY = ['discovery', 'recommended'] as const;
export const PUBLIC_PROFILE_QUERY_KEY = ['users', 'public-profile'] as const;

export function useDiscoverStudents(params: DiscoveryFilterParams = {}) {
  const { isAuthenticated } = useAuth();

  return useQuery<PageResponse<DiscoveryCandidate>, Error>({
    queryKey: [...DISCOVERY_QUERY_KEY, params],
    queryFn: () => discoveryService.discoverStudents(params),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}


export function useRecommendedStudents(page = 0, size = 6) {
  const { isAuthenticated } = useAuth();

  return useQuery<PageResponse<DiscoveryCandidate>, Error>({
    queryKey: [...RECOMMENDED_QUERY_KEY, { page, size }],
    queryFn: () => discoveryService.getRecommendedStudents(page, size),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function usePublicProfile(userId: string) {
  const { isAuthenticated } = useAuth();

  return useQuery<PublicProfile, Error>({
    queryKey: [...PUBLIC_PROFILE_QUERY_KEY, userId],
    queryFn: () => discoveryService.getPublicProfile(userId),
    enabled: isAuthenticated && Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });
}
