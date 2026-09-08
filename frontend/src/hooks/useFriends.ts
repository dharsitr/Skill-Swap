import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { friendService } from '@/services/friendService';
import type { FriendshipStatusResponse, FriendRequestDto, FriendSummaryDto } from '@/types/api';

export const friendKeys = {
  all: ['friends'] as const,
  status: (userId: string) => [...friendKeys.all, 'status', userId] as const,
  incoming: () => [...friendKeys.all, 'incoming'] as const,
  outgoing: () => [...friendKeys.all, 'outgoing'] as const,
  list: () => [...friendKeys.all, 'list'] as const,
};

export const useFriendStatus = (targetUserId: string) => {
  return useQuery<FriendshipStatusResponse>({
    queryKey: friendKeys.status(targetUserId),
    queryFn: () => friendService.getFriendshipStatus(targetUserId),
    enabled: Boolean(targetUserId),
    staleTime: 1000 * 15,
  });
};

export const useIncomingFriendRequests = () => {
  return useQuery<FriendRequestDto[]>({
    queryKey: friendKeys.incoming(),
    queryFn: () => friendService.getIncomingRequests(),
    staleTime: 1000 * 30,
  });
};

export const useOutgoingFriendRequests = () => {
  return useQuery<FriendRequestDto[]>({
    queryKey: friendKeys.outgoing(),
    queryFn: () => friendService.getOutgoingRequests(),
    staleTime: 1000 * 30,
  });
};

export const useFriendsList = () => {
  return useQuery<FriendSummaryDto[]>({
    queryKey: friendKeys.list(),
    queryFn: () => friendService.getFriends(),
    staleTime: 1000 * 30,
  });
};

export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (receiverId: string) => friendService.sendFriendRequest(receiverId),
    onSuccess: (_, receiverId) => {
      queryClient.invalidateQueries({ queryKey: friendKeys.status(receiverId) });
      queryClient.invalidateQueries({ queryKey: friendKeys.outgoing() });
    },
  });
};

export const useAcceptFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => friendService.acceptFriendRequest(requestId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
      queryClient.invalidateQueries({ queryKey: friendKeys.status(data.senderId) });
      queryClient.invalidateQueries({ queryKey: friendKeys.status(data.receiverId) });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useDeclineFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => friendService.declineFriendRequest(requestId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
      queryClient.invalidateQueries({ queryKey: friendKeys.status(data.senderId) });
      queryClient.invalidateQueries({ queryKey: friendKeys.status(data.receiverId) });
    },
  });
};

export const useCancelFriendRequest = (targetUserId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => friendService.cancelFriendRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
      if (targetUserId) {
        queryClient.invalidateQueries({ queryKey: friendKeys.status(targetUserId) });
      }
    },
  });
};

export const useRemoveFriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendUserId: string) => friendService.removeFriend(friendUserId),
    onSuccess: (_, friendUserId) => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
      queryClient.invalidateQueries({ queryKey: friendKeys.status(friendUserId) });
    },
  });
};
