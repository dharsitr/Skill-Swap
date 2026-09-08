import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AppDashboardPage } from '@/pages/AppDashboardPage';
import { personalizationService } from '@/services/personalizationService';
import { profileService } from '@/services/profileService';
import { skillService } from '@/services/skillService';
import { walletService } from '@/services/walletService';
import { AuthProvider } from '@/auth/AuthContext';
import type { DashboardSummaryResponse, ProfileResponse, UserSkillProfileResponse, CreditBalance } from '@/types/api';

vi.mock('@/auth/authService', () => ({
  authService: {
    getSession: vi.fn().mockResolvedValue({
      user: { id: 'usr-1', email: 'alex@college.edu' },
      access_token: 'fake-token',
    }),
    onAuthStateChange: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('@/services/profileService', () => ({
  profileService: {
    getCurrentProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

vi.mock('@/services/skillService', () => ({
  skillService: {
    getMySkills: vi.fn(),
    getCategories: vi.fn(),
    getSkills: vi.fn(),
    addSkill: vi.fn(),
    deleteSkill: vi.fn(),
  },
}));

vi.mock('@/services/walletService', () => ({
  walletService: {
    getBalance: vi.fn(),
    getTransactions: vi.fn(),
  },
}));

vi.mock('@/services/personalizationService', () => ({
  personalizationService: {
    getDashboardSummary: vi.fn(),
    getRecommendedStudents: vi.fn(),
    getRecommendedSkills: vi.fn(),
    getRecentlyViewedProfiles: vi.fn(),
    recordProfileView: vi.fn(),
    clearProfileHistory: vi.fn(),
    getSearchHistory: vi.fn(),
    recordSearch: vi.fn(),
    clearSearchHistory: vi.fn(),
    getRecentActivity: vi.fn(),
  },
}));

const mockProfile: ProfileResponse = {
  id: 'prof-1',
  userId: 'usr-1',
  displayName: 'Alex Rivers',
  collegeName: 'MIT',
  department: 'Computer Science',
  yearOfStudy: 'THIRD_YEAR',
  bio: 'Interested in AI and distributed systems',
  avatarUrl: 'https://example.com/avatar.jpg',
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
};

const mockSkills: UserSkillProfileResponse = {
  teaching: [
    {
      id: 'us-1',
      skillId: 'sk-1',
      skillName: 'Python Programming',
      proficiency: 'ADVANCED',
      relationshipType: 'TEACH',
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
    },
  ],
  learning: [
    {
      id: 'us-2',
      skillId: 'sk-2',
      skillName: 'React Frontend',
      proficiency: 'BEGINNER',
      relationshipType: 'LEARN',
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
    },
  ],
};

const mockBalance: CreditBalance = {
  balance: 15,
};

const mockDashboardSummary: DashboardSummaryResponse = {
  profileCompletion: {
    completionPercentage: 85,
    isComplete: false,
    missingFields: [
      {
        fieldKey: 'bio',
        label: 'Write a short bio',
        actionUrl: '/profile',
        weight: 15,
      },
    ],
  },
  recommendedStudents: [
    {
      userId: 'usr-2',
      displayName: 'Samantha Ray',
      avatarUrl: null,
      collegeName: 'MIT',
      department: 'Data Science',
      yearOfStudy: 'SECOND_YEAR',
      matchScore: 92.5,
      teachingSkills: [
        {
          id: 'sk-2',
          name: 'React Frontend',
          categoryName: 'Tech',
          proficiency: 'EXPERT',
          relationshipType: 'TEACH',
        },
      ],
      learningSkills: [],
      recommendationReasonType: 'SKILL_MATCH',
      recommendationReason: 'Teaches React Frontend which you want to learn',
      matchHighlights: ['They teach React Frontend at EXPERT level'],
    },
  ],
  recommendedSkills: [
    {
      id: 'sk-3',
      name: 'Docker & Kubernetes',
      categoryId: 'cat-1',
      categoryName: 'Cloud',
      description: 'Container orchestration',
      recommendationReasonType: 'POPULAR_PLATFORM',
      recommendationReason: 'Popular skill on SkillSwap',
    },
  ],
  requestSummary: {
    incomingPendingCount: 2,
    outgoingPendingCount: 1,
    recentRequests: [
      {
        requestId: 'req-1',
        type: 'INCOMING',
        counterpartName: 'Samantha Ray',
        counterpartAvatarUrl: null,
        skillName: 'Python Programming',
        status: 'PENDING',
        createdAt: '2026-08-30T10:00:00Z',
      },
    ],
  },
  sessionSummary: {
    upcomingCount: 1,
    completedCount: 4,
    nextSession: {
      sessionId: 'sess-1',
      counterpartName: 'Samantha Ray',
      counterpartAvatarUrl: null,
      skillName: 'React Frontend',
      role: 'LEARNER',
      status: 'SCHEDULED',
      scheduledStartTime: '2026-09-02T14:00:00Z',
      durationMinutes: 60,
    },
  },
  recentActivity: [
    {
      id: 'act-1',
      activityType: 'SESSION_COMPLETED',
      title: 'Completed Session in Python Programming',
      description: 'Taught Samantha Ray (60 mins)',
      timestamp: '2026-08-29T16:00:00Z',
      entityType: 'SESSION',
      entityId: 'sess-0',
      actionUrl: '/sessions/sess-0',
    },
  ],
  notificationSummary: {
    unreadCount: 3,
  },
  recentlyViewed: [
    {
      userId: 'usr-2',
      displayName: 'Samantha Ray',
      avatarUrl: null,
      collegeName: 'MIT',
      department: 'Data Science',
      yearOfStudy: 'SECOND_YEAR',
      topSkills: ['React Frontend', 'Python'],
      viewedAt: '2026-08-30T12:00:00Z',
    },
  ],
  recentSearches: [
    {
      id: 'sh-1',
      query: 'React Frontend',
      categoryId: 'cat-1',
      categoryName: 'Tech',
      skillId: 'sk-2',
      skillName: 'React Frontend',
      searchedAt: '2026-08-30T11:00:00Z',
    },
  ],
};

describe('Phase 12: Advanced User Experience & Personalization', () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
    vi.mocked(profileService.getCurrentProfile).mockResolvedValue(mockProfile);
    vi.mocked(skillService.getMySkills).mockResolvedValue(mockSkills);
    vi.mocked(walletService.getBalance).mockResolvedValue(mockBalance);
    vi.mocked(personalizationService.getDashboardSummary).mockResolvedValue(mockDashboardSummary);
  });

  const renderDashboard = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <AppDashboardPage />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

  it('renders personalized dashboard with welcome hero, wallet, and notifications', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Welcome back,/i)).toBeInTheDocument();
      expect(screen.getByText(/Alex Rivers/i)).toBeInTheDocument();
      expect(screen.getByText(/15 Balance/i)).toBeInTheDocument();
      expect(screen.getByText(/New Alerts/i)).toBeInTheDocument();
    });
  });

  it('displays profile completion progress bar and missing field action pills', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Profile Completeness:/i)).toBeInTheDocument();
      expect(screen.getByText(/85%/i)).toBeInTheDocument();
      expect(screen.getByText(/Write a short bio/i)).toBeInTheDocument();
      expect(screen.getByText(/Complete Profile/i)).toBeInTheDocument();
    });
  });

  it('renders student peer recommendations with match score and reasons', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Recommended Student Peers/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Samantha Ray/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/93%/i)).toBeInTheDocument(); // 92.5 rounded
      expect(screen.getByText(/Teaches React Frontend which you want to learn/i)).toBeInTheDocument();
    });
  });

  it('renders recommended skills with explore links', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Recommended Skills to Explore/i)).toBeInTheDocument();
      expect(screen.getByText(/Docker & Kubernetes/i)).toBeInTheDocument();
    });
  });

  it('renders exchange request counts and upcoming live sessions', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getAllByText(/Exchange Requests/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Live Sessions/i)).toBeInTheDocument();
      expect(screen.getByText(/Open Session Room/i)).toBeInTheDocument();
    });
  });

  it('renders recently viewed peers', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Recently Viewed Peers/i)).toBeInTheDocument();
      expect(screen.queryByText(/Recent Platform Activity/i)).not.toBeInTheDocument();
    });
  });
});
