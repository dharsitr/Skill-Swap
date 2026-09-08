import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfilePage } from '@/pages/ProfilePage';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/auth/AuthContext';
import { authService } from '@/auth/authService';
import { profileService } from '@/services/profileService';
import type { ProfileResponse } from '@/types/api';

vi.mock('@/auth/authService', () => ({
  authService: {
    getSession: vi.fn(),
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

describe('ProfilePage Component', () => {
  const mockProfile: ProfileResponse = {
    id: 'prof-123',
    userId: 'user-123',
    displayName: 'Alex Rivera',
    collegeName: 'Stanford University',
    department: 'Computer Science',
    bio: 'Learning full-stack development and distributed systems.',
    yearOfStudy: 'THIRD_YEAR',
    avatarUrl: 'https://example.com/alex.jpg',
    createdAt: '2026-08-29T10:00:00Z',
    updatedAt: '2026-08-29T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    vi.mocked(authService.getSession).mockResolvedValue({
      user: { id: 'user-123', email: 'alex@stanford.edu' } as any,
      access_token: 'token-123',
    } as any);
  });

  it('loads and renders student profile fields', async () => {
    vi.mocked(profileService.getCurrentProfile).mockResolvedValueOnce(mockProfile);

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <ProfilePage />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Alex Rivera')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Stanford University')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Computer Science')).toBeInTheDocument();
      expect(screen.getByDisplayValue(/Learning full-stack development/i)).toBeInTheDocument();
    });
  });

  it('updates profile and submits new values', async () => {
    vi.mocked(profileService.getCurrentProfile).mockResolvedValueOnce(mockProfile);
    vi.mocked(profileService.updateProfile).mockResolvedValueOnce({
      ...mockProfile,
      displayName: 'Alexandre Rivera',
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <ProfilePage />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Alex Rivera')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Display Name \*/i), {
      target: { value: 'Alexandre Rivera' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Save Profile/i }));

    await waitFor(() => {
      expect(profileService.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          displayName: 'Alexandre Rivera',
          collegeName: 'Stanford University',
        })
      );
      expect(screen.getByText(/Profile updated successfully/i)).toBeInTheDocument();
    });
  });
});
