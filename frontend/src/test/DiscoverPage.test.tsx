import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DiscoverPage } from '@/pages/DiscoverPage';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/auth/AuthContext';
import { authService } from '@/auth/authService';
import { discoveryService } from '@/services/discoveryService';
import { skillService } from '@/services/skillService';

import type { DiscoveryCandidate, PageResponse } from '@/types/api';

vi.mock('@/auth/authService', () => ({
  authService: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('@/services/discoveryService', () => ({
  discoveryService: {
    discoverStudents: vi.fn(),
    getRecommendedStudents: vi.fn(),
    getPublicProfile: vi.fn(),
  },
}));

vi.mock('@/services/skillService', () => ({
  skillService: {
    getCategories: vi.fn(),
    getSkills: vi.fn(),
    getMySkills: vi.fn(),
  },
}));

describe('DiscoverPage Component', () => {
  const mockCandidates: PageResponse<DiscoveryCandidate> = {
    items: [
      {
        candidate: {
          id: 'prof-1',
          userId: 'user-1',
          displayName: 'Alice Smith',
          avatarUrl: null,
          bio: 'CS junior loving Python and AI',
          collegeName: 'MIT',
          department: 'Computer Science',
          yearOfStudy: 'THIRD_YEAR',
          teachingSkills: [
            {
              id: 'ts-1',
              skillId: 's-1',
              skillName: 'Python',
              categoryName: 'Programming',
              relationshipType: 'TEACH',
              proficiency: 'ADVANCED',
              description: 'Backend Python mentorship',
            },
          ],
          learningSkills: [
            {
              id: 'ls-1',
              skillId: 's-2',
              skillName: 'Figma',
              categoryName: 'Design',
              relationshipType: 'LEARN',
              proficiency: 'BEGINNER',
              description: 'UI/UX basics',
            },
          ],
          createdAt: '2026-08-29T10:00:00Z',
        },
        score: 88,
        matchedSkills: ['Python', 'Figma'],
        explanation: [
          'They teach Python at Advanced level',
          'You want to learn Python',
          'Direct 2-way skill exchange match!',
        ],
      },
    ],
    page: 0,
    size: 9,
    totalElements: 1,
    totalPages: 1,
    first: true,
    last: true,
  };

  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();

    vi.mocked(authService.getSession).mockResolvedValue({
      user: { id: 'usr-1', email: 'student@mit.edu' } as any,
      access_token: 'valid-token',
    } as any);

    vi.mocked(skillService.getCategories).mockResolvedValue({
      items: [{ id: 'cat-1', name: 'Programming', description: null }],
    });


    vi.mocked(skillService.getSkills).mockResolvedValue({
      items: [{ id: 's-1', name: 'Python', description: null, category: { id: 'cat-1', name: 'Programming' } }],
    });

    vi.mocked(discoveryService.discoverStudents).mockResolvedValue(mockCandidates);
    vi.mocked(discoveryService.getRecommendedStudents).mockResolvedValue(mockCandidates);
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <DiscoverPage />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

  it('renders discovery header, filters, and candidate cards with match score', async () => {
    renderComponent();

    expect(screen.getByText('Discover Students')).toBeInTheDocument();
    expect(screen.getByText('Learn Mode')).toBeInTheDocument();
    expect(screen.getByText('Teach Mode')).toBeInTheDocument();
    expect(screen.getByText('All Students')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('Alice Smith').length).toBeGreaterThan(0);
      expect(screen.getAllByText('88% Match').length).toBeGreaterThan(0);
      expect(screen.getAllByText('They teach Python at Advanced level').length).toBeGreaterThan(0);
    });
  });


  it('switches discovery mode tab and updates query', async () => {
    renderComponent();

    const teachModeBtn = screen.getByRole('button', { name: 'Find Learners' });
    fireEvent.click(teachModeBtn);

    await waitFor(() => {
      expect(discoveryService.discoverStudents).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'TEACH' })
      );
    });
  });

  it('handles empty state when no students match query', async () => {
    vi.mocked(discoveryService.discoverStudents).mockResolvedValue({
      items: [],
      page: 0,
      size: 9,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    });
    vi.mocked(discoveryService.getRecommendedStudents).mockResolvedValue({
      items: [],
      page: 0,
      size: 3,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No matching students found')).toBeInTheDocument();
    });
  });
});
