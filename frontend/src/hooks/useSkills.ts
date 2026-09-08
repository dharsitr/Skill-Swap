import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { skillService } from '@/services/skillService';
import { useAuth } from '@/auth/useAuth';
import type {
  CategoryListResponse,
  CreateUserSkillRequest,
  SkillListResponse,
  UpdateUserSkillRequest,
  UserSkill,
  UserSkillProfileResponse,
} from '@/types/api';

export const SKILL_CATEGORIES_QUERY_KEY = ['skills', 'categories'] as const;
export const MY_SKILLS_QUERY_KEY = ['skills', 'me'] as const;

export function useSkillCategories() {
  return useQuery<CategoryListResponse, Error>({
    queryKey: SKILL_CATEGORIES_QUERY_KEY,
    queryFn: () => skillService.getCategories(),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useSkillsCatalog(search?: string, categoryId?: string) {
  return useQuery<SkillListResponse, Error>({
    queryKey: ['skills', 'catalog', { search, categoryId }],
    queryFn: () => skillService.getSkills(search, categoryId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useMySkills() {
  const { isAuthenticated } = useAuth();

  return useQuery<UserSkillProfileResponse, Error>({
    queryKey: MY_SKILLS_QUERY_KEY,
    queryFn: () => skillService.getMySkills(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useAddUserSkill() {
  const queryClient = useQueryClient();

  return useMutation<UserSkill, Error, CreateUserSkillRequest>({
    mutationFn: (request: CreateUserSkillRequest) => skillService.addUserSkill(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_SKILLS_QUERY_KEY });
    },
  });
}

export function useUpdateUserSkill() {
  const queryClient = useQueryClient();

  return useMutation<UserSkill, Error, { id: string; request: UpdateUserSkillRequest }>({
    mutationFn: ({ id, request }) => skillService.updateUserSkill(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_SKILLS_QUERY_KEY });
    },
  });
}

export function useDeleteUserSkill() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id: string) => skillService.deleteUserSkill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_SKILLS_QUERY_KEY });
    },
  });
}
