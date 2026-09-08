import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { availabilityService } from '@/services/availabilityService';
import type {
  UserAvailabilityResponse,
  CreateAvailabilityRequest,
  UpdateAvailabilityRequest,
} from '@/types/api';

export const AVAILABILITY_KEYS = {
  all: ['availability'] as const,
  mine: () => [...AVAILABILITY_KEYS.all, 'me'] as const,
};

export const useMyAvailability = () => {
  return useQuery<UserAvailabilityResponse[], Error>({
    queryKey: AVAILABILITY_KEYS.mine(),
    queryFn: () => availabilityService.getMyAvailability(),
  });
};

export const useCreateAvailability = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateAvailabilityRequest) => availabilityService.createAvailability(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AVAILABILITY_KEYS.mine() });
    },
  });
};

export const useUpdateAvailability = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateAvailabilityRequest }) =>
      availabilityService.updateAvailability(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AVAILABILITY_KEYS.mine() });
    },
  });
};

export const useDeleteAvailability = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => availabilityService.deleteAvailability(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AVAILABILITY_KEYS.mine() });
    },
  });
};
