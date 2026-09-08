import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/services/profileService';
import { useAuth } from '@/auth/useAuth';
import type { ProfileResponse, UpdateProfileRequest } from '@/types/api';

export const PROFILE_QUERY_KEY = ['profile', 'me'] as const;

export function useCurrentProfile() {
  const { isAuthenticated } = useAuth();

  return useQuery<ProfileResponse, Error>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: () => profileService.getCurrentProfile(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<ProfileResponse, Error, UpdateProfileRequest>({
    mutationFn: (request: UpdateProfileRequest) => profileService.updateProfile(request),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, updatedProfile);
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });
}
