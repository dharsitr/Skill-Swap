import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { useAuth } from '@/auth/useAuth';
import type { UserResponse } from '@/types/api';

export const USER_QUERY_KEY = ['user', 'me'] as const;

export function useCurrentUser() {
  const { isAuthenticated } = useAuth();

  return useQuery<UserResponse, Error>({
    queryKey: USER_QUERY_KEY,
    queryFn: () => userService.getCurrentUser(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });
}
