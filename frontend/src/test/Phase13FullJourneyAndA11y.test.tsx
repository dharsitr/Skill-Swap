import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
      user: { id: 'usr-phase13', email: 'tester@college.edu' },
      access_token: 'valid-test-token',
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
    getUserActivity: vi.fn(),
  },
}));

const mockProfile: ProfileResponse = {
  id: 'prof-p13',
  userId: 'usr-phase13',
  displayName: 'Jordan Test',
  avatarUrl: 'https://example.com/avatar.png',
  bio: 'QA Specialist and CS student',
  collegeName: 'MIT',
  department: 'Computer Science',
  yearOfStudy: 'FOURTH_YEAR',
  createdAt: '2026-08-30T10:00:00Z',
  updatedAt: '2026-08-30T10:00:00Z',
};

const mockSkills: UserSkillProfileResponse = {
  teaching: [
    {
      id: 'us-1',
      skillId: 'sk-1',
      skillName: 'TypeScript & React',
      categoryId: 'cat-1',
      categoryName: 'Web Development',
      relationshipType: 'TEACH',
      proficiency: 'EXPERT',
      description: 'Full stack development',
      createdAt: '2026-08-30T10:00:00Z',
      updatedAt: '2026-08-30T10:00:00Z',
    },
  ],
  learning: [
    {
      id: 'us-2',
      skillId: 'sk-2',
      skillName: 'Rust Systems Programming',
      categoryId: 'cat-1',
      categoryName: 'Systems',
      relationshipType: 'LEARN',
      proficiency: 'BEGINNER',
      description: 'Learning memory safety and concurrency',
      createdAt: '2026-08-30T10:00:00Z',
      updatedAt: '2026-08-30T10:00:00Z',
    },
  ],
};

const mockBalance: CreditBalance = {
  balance: 15,
};

const mockDashboard: DashboardSummaryResponse = {
  profileCompletion: {
    completionPercentage: 100,
    isComplete: true,
    missingFields: [],
  },
  recommendedStudents: [
    {
      userId: 'usr-peer-1',
      displayName: 'Alex Rivers',
      avatarUrl: null,
      collegeName: 'Stanford',
      department: 'Computer Science',
      yearOfStudy: 'THIRD_YEAR',
      matchScore: 92,
      teachingSkills: [
        {
          id: 'sk-peer-1',
          name: 'Rust Systems Programming',
          categoryName: 'Systems',
          proficiency: 'ADVANCED',
          relationshipType: 'TEACH',
        },
      ],
      learningSkills: [
        {
          id: 'sk-peer-2',
          name: 'TypeScript & React',
          categoryName: 'Web Development',
          proficiency: 'BEGINNER',
          relationshipType: 'LEARN',
        },
      ],
      recommendationReasonType: 'MUTUAL_EXCHANGE',
      recommendationReason: 'Perfect mutual match for two-way skill exchange',
      matchHighlights: ['They teach Rust Systems Programming', 'You teach TypeScript & React'],
    },
  ],
  recommendedSkills: [
    {
      id: 'sk-rec-1',
      name: 'Docker & Kubernetes',
      categoryId: 'cat-1',
      categoryName: 'DevOps',
      description: 'Container orchestration',
      recommendationReasonType: 'POPULAR_PLATFORM',
      recommendationReason: 'Trending in Computer Science department',
    },
  ],
  requestSummary: {
    incomingPendingCount: 1,
    outgoingPendingCount: 0,
    recentRequests: [
      {
        requestId: 'req-1',
        type: 'INCOMING',
        counterpartName: 'Alex Rivers',
        counterpartAvatarUrl: null,
        skillName: 'TypeScript & React',
        status: 'PENDING',
        createdAt: '2026-08-30T12:00:00Z',
      },
    ],
  },
  sessionSummary: {
    upcomingCount: 1,
    completedCount: 3,
    nextSession: {
      sessionId: 'ses-1',
      counterpartName: 'Alex Rivers',
      counterpartAvatarUrl: null,
      skillName: 'TypeScript & React',
      scheduledStartTime: '2026-08-31T15:00:00Z',
      durationMinutes: 60,
      status: 'SCHEDULED',
      role: 'TEACHER',
    },
  },
  recentActivity: [
    {
      id: 'act-1',
      activityType: 'SESSION_COMPLETED',
      title: 'Completed Session',
      description: 'Taught TypeScript & React to Alex Rivers',
      timestamp: '2026-08-30T14:00:00Z',
      entityType: 'SESSION',
      entityId: 'ses-completed-1',
      actionUrl: '/sessions',
    },
  ],
  notificationSummary: {
    unreadCount: 2,
  },
  recentlyViewed: [
    {
      userId: 'usr-peer-1',
      displayName: 'Alex Rivers',
      avatarUrl: null,
      collegeName: 'Stanford',
      department: 'Computer Science',
      yearOfStudy: 'THIRD_YEAR',
      topSkills: ['Rust Systems Programming'],
      viewedAt: '2026-08-30T13:00:00Z',
    },
  ],
  recentSearches: [
    {
      id: 'srch-1',
      query: 'Rust Concurrency',
      categoryId: null,
      categoryName: null,
      skillId: null,
      skillName: null,
      searchedAt: '2026-08-30T11:00:00Z',
    },
  ],
};

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppDashboardPage />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe('Phase 13 Full Journey, Quality Assurance & A11y Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(profileService.getCurrentProfile).mockResolvedValue(mockProfile);
    vi.mocked(skillService.getMySkills).mockResolvedValue(mockSkills);
    vi.mocked(walletService.getBalance).mockResolvedValue(mockBalance);
    vi.mocked(personalizationService.getDashboardSummary).mockResolvedValue(mockDashboard);
    vi.mocked(personalizationService.clearSearchHistory).mockResolvedValue({ success: true, message: 'Cleared' });
    vi.mocked(personalizationService.clearProfileHistory).mockResolvedValue({ success: true, message: 'Cleared' });
  });

  it('renders complete personalized dashboard with user greeting, stats, and recommendations', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Jordan Test/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Alex Rivers/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Rust Systems Programming/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Docker & Kubernetes/i)).toBeInTheDocument();
    });
  });

  it('verifies accessibility landmarks, semantic headers, and interactive buttons', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Explore Catalog/i })).toBeInTheDocument();
      expect(screen.getByText(/Recently Viewed/i)).toBeInTheDocument();
    });

    const exploreBtn = screen.getByRole('link', { name: /Explore Catalog/i });
    expect(exploreBtn).toHaveAttribute('href', '/discover');
  });

  it('handles partial dashboard failures gracefully without crashing entire interface', async () => {
    vi.mocked(personalizationService.getDashboardSummary).mockRejectedValueOnce(new Error('Network temporary outage'));
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Jordan Test/i)).toBeInTheDocument();
    });
  });
});
