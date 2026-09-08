import { apiClient } from './apiClient';
import type {
  CategoryListResponse,
  CreateUserSkillRequest,
  Skill,
  SkillListResponse,
  UpdateUserSkillRequest,
  UserSkill,
  UserSkillProfileResponse,
} from '@/types/api';

export const skillService = {
  async getCategories(): Promise<CategoryListResponse> {
    return apiClient.get<CategoryListResponse>('/skills/categories');
  },

  async getSkills(search?: string, categoryId?: string): Promise<SkillListResponse> {
    return apiClient.get<SkillListResponse>('/skills', {
      params: {
        search: search || undefined,
        categoryId: categoryId || undefined,
      },
    });
  },

  async getSkillById(id: string): Promise<Skill> {
    return apiClient.get<Skill>(`/skills/${id}`);
  },

  async getMySkills(): Promise<UserSkillProfileResponse> {
    return apiClient.get<UserSkillProfileResponse>('/profile/me/skills');
  },

  async addUserSkill(request: CreateUserSkillRequest): Promise<UserSkill> {
    return apiClient.post<UserSkill>('/profile/me/skills', request);
  },

  async updateUserSkill(id: string, request: UpdateUserSkillRequest): Promise<UserSkill> {
    return apiClient.put<UserSkill>(`/profile/me/skills/${id}`, request);
  },

  async deleteUserSkill(id: string): Promise<void> {
    return apiClient.delete<void>(`/profile/me/skills/${id}`);
  },
};
