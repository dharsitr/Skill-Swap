import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PublicProfilePage } from '@/pages/PublicProfilePage';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/auth/AuthContext';
import { authService } from '@/auth/authService';
import { discoveryService } from '@/services/discoveryService';
import { skillService } from '@/services/skillService';
import { friendService } from '@/services/friendService';

import type { PublicProfile, UserSkillProfileResponse } from '@/types/api';

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
    getPublicProfile: vi.fn(),
    discoverStudents: vi.fn(),
    getRecommendedStudents: vi.fn(),
  },
}));

vi.mock('@/services/skillService', () => ({
  skillService: {
    getMySkills: vi.fn(),
    getCategories: vi.fn(),
    getSkills: vi.fn(),
  },
}));

vi.mock('@/services/friendService', () => ({
  friendService: {
    getFriendshipStatus: vi.fn(),
    sendFriendRequest: vi.fn(),
    acceptFriendRequest: vi.fn(),
    declineFriendRequest: vi.fn(),
    cancelFriendRequest: vi.fn(),
    getIncomingRequests: vi.fn(),
    getOutgoingRequests: vi.fn(),
    getFriends: vi.fn(),
  },
}));

describe('PublicProfilePage Component', () => {
  const mockPublicProfile: PublicProfile = {
    id: 'prof-1',
    userId: 'user-42',
    displayName: 'Bob Johnson',
    avatarUrl: null,
    bio: 'Avid coder and designer',
    collegeName: 'Stanford University',
    department: 'Design & CS',
    yearOfStudy: 'FOURTH_YEAR',
    teachingSkills: [
      {
        id: 'ts-1',
        skillId: 's-1',
        skillName: 'TypeScript',
        categoryName: 'Programming',
        relationshipType: 'TEACH',
        proficiency: 'EXPERT',
        description: 'Advanced TypeScript & ASTs',
      },
    ],
    learningSkills: [
      {
        id: 'ls-1',
        skillId: 's-2',
        skillName: 'Rust',
        categoryName: 'Programming',
        relationshipType: 'LEARN',
        proficiency: 'BEGINNER',
        description: 'Systems programming basics',
      },
    ],
    createdAt: '2026-08-29T10:00:00Z',
  };

  const mockMySkills: UserSkillProfileResponse = {
    teaching: [
      {
        id: 'my-ts-1',
        skillId: 's-2',
        skillName: 'Rust',
        relationshipType: 'TEACH',
        proficiency: 'ADVANCED',
        createdAt: '2026-08-29T10:00:00Z',
        updatedAt: '2026-08-29T10:00:00Z',
      },
    ],
    learning: [
      {
        id: 'my-ls-1',
        skillId: 's-1',
        skillName: 'TypeScript',
        relationshipType: 'LEARN',
        proficiency: 'BEGINNER',
        createdAt: '2026-08-29T10:00:00Z',
        updatedAt: '2026-08-29T10:00:00Z',
      },
    ],
  };

  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();

    vi.mocked(authService.getSession).mockResolvedValue({
      user: { id: 'usr-1', email: 'student@mit.edu' } as any,
      access_token: 'valid-token',
    } as any);

    vi.mocked(discoveryService.getPublicProfile).mockResolvedValue(mockPublicProfile);
    vi.mocked(skillService.getMySkills).mockResolvedValue(mockMySkills);
    vi.mocked(friendService.getFriendshipStatus).mockResolvedValue({ status: 'NONE' });
  });

  const renderComponent = (userId = 'user-42') =>
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={[`/users/${userId}`]}>
            <Routes>
              <Route path="/users/:id" element={<PublicProfilePage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

  it('renders student public profile, affiliation, and Add Friend button when not connected', async () => {
    renderComponent('user-42');

    await waitFor(() => {
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.getByText('Stanford University')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('Rust')).toBeInTheDocument();
      expect(screen.getByText('Verified Student')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add Friend/i })).toBeInTheDocument();
    });
  });

  it('renders Friends badge and Message button when friendship is ACCEPTED', async () => {
    vi.mocked(friendService.getFriendshipStatus).mockResolvedValue({
      status: 'ACCEPTED',
      requestId: 'req-1',
      conversationId: 'conv-123',
    });

    renderComponent('user-42');

    await waitFor(() => {
      expect(screen.getByText('Friends')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Message/i })).toBeInTheDocument();
    });
  });

  it('renders Accept Request button when status is PENDING_RECEIVED', async () => {
    vi.mocked(friendService.getFriendshipStatus).mockResolvedValue({
      status: 'PENDING_RECEIVED',
      requestId: 'req-1',
    });

    renderComponent('user-42');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Accept Request/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Decline/i })).toBeInTheDocument();
    });
  });

  it('handles profile not found error gracefully', async () => {
    vi.mocked(discoveryService.getPublicProfile).mockRejectedValue(new Error('Profile not found'));

    renderComponent('unknown-id');

    await waitFor(() => {
      expect(screen.getByText('Student Profile Not Found')).toBeInTheDocument();
    });
  });
});
