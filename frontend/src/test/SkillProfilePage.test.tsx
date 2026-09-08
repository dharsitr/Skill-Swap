import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SkillProfilePage } from '@/pages/SkillProfilePage';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/auth/AuthContext';
import { authService } from '@/auth/authService';
import { skillService } from '@/services/skillService';
import type { UserSkillProfileResponse } from '@/types/api';

vi.mock('@/auth/authService', () => ({
  authService: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('@/services/skillService', () => ({
  skillService: {
    getMySkills: vi.fn(),
    getCategories: vi.fn(),
    getSkills: vi.fn(),
    addUserSkill: vi.fn(),
    updateUserSkill: vi.fn(),
    deleteUserSkill: vi.fn(),
  },
}));

describe('SkillProfilePage Component', () => {
  const mockSkillsProfile: UserSkillProfileResponse = {
    teaching: [
      {
        id: 'uskill-1',
        skillId: 's-1',
        skillName: 'Python',
        categoryId: 'c-1',
        categoryName: 'Programming',
        relationshipType: 'TEACH',
        proficiency: 'ADVANCED',
        description: 'Mentoring in backend Python and FastAPI',
        createdAt: '2026-08-29T10:00:00Z',
        updatedAt: '2026-08-29T10:00:00Z',
      },
    ],
    learning: [
      {
        id: 'uskill-2',
        skillId: 's-2',
        skillName: 'Machine Learning',
        categoryId: 'c-2',
        categoryName: 'AI & Machine Learning',
        relationshipType: 'LEARN',
        proficiency: 'BEGINNER',
        description: 'Exploring neural networks',
        createdAt: '2026-08-29T10:00:00Z',
        updatedAt: '2026-08-29T10:00:00Z',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    vi.mocked(authService.getSession).mockResolvedValue({
      user: { id: 'usr-1', email: 'student@mit.edu' } as any,
      access_token: 'valid-token',
    } as any);

    vi.mocked(skillService.getCategories).mockResolvedValue({
      items: [
        { id: 'c-1', name: 'Programming', description: 'Coding' },
        { id: 'c-2', name: 'AI & Machine Learning', description: 'AI' },
      ],
    });

    vi.mocked(skillService.getSkills).mockResolvedValue({
      items: [
        {
          id: 's-3',
          name: 'React',
          description: 'UI Library',
          category: { id: 'c-1', name: 'Programming' },
        },
      ],
    });
  });

  it('renders teaching and learning skill cards', async () => {
    vi.mocked(skillService.getMySkills).mockResolvedValueOnce(mockSkillsProfile);

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <SkillProfilePage />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText('Machine Learning')).toBeInTheDocument();
      expect(screen.getByText(/Mentoring in backend Python/i)).toBeInTheDocument();
      expect(screen.getByText(/Exploring neural networks/i)).toBeInTheDocument();
    });
  });

  it('opens add teaching skill modal and adds a new skill', async () => {
    vi.mocked(skillService.getMySkills).mockResolvedValueOnce(mockSkillsProfile);
    vi.mocked(skillService.addUserSkill).mockResolvedValueOnce({
      id: 'uskill-3',
      skillId: 's-3',
      skillName: 'React',
      categoryId: 'c-1',
      categoryName: 'Programming',
      relationshipType: 'TEACH',
      proficiency: 'INTERMEDIATE',
      description: 'Building custom hooks',
      createdAt: '2026-08-29T10:00:00Z',
      updatedAt: '2026-08-29T10:00:00Z',
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <SkillProfilePage />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Python')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Add Teaching Skill/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Add Teaching Skill/i })).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
    });

    // Select skill
    fireEvent.click(screen.getByText('React'));

    // Save
    fireEvent.click(screen.getByRole('button', { name: /Add to Profile/i }));

    await waitFor(() => {
      expect(skillService.addUserSkill).toHaveBeenCalledWith(
        expect.objectContaining({
          skillId: 's-3',
          relationshipType: 'TEACH',
        })
      );
    });
  });

  it('opens delete confirmation dialog and deletes skill', async () => {
    vi.mocked(skillService.getMySkills).mockResolvedValueOnce(mockSkillsProfile);
    vi.mocked(skillService.deleteUserSkill).mockResolvedValueOnce();

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <SkillProfilePage />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Python')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/Remove Python/i));

    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to remove/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Remove Skill/i }));

    await waitFor(() => {
      expect(skillService.deleteUserSkill).toHaveBeenCalledWith('uskill-1');
    });
  });
});
