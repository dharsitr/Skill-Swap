import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import { authService } from '@/auth/authService';

vi.mock('@/auth/authService', () => ({
  authService: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated user to /login', async () => {
    vi.mocked(authService.getSession).mockResolvedValueOnce(null);

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/app']}>
          <Routes>
            <Route path="/login" element={<div>Login Page Target</div>} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <div>Secret Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Page Target')).toBeInTheDocument();
      expect(screen.queryByText('Secret Protected Content')).not.toBeInTheDocument();
    });
  });

  it('renders protected child component when authenticated', async () => {
    vi.mocked(authService.getSession).mockResolvedValueOnce({
      user: { id: 'usr-1', email: 'test@college.edu' } as any,
      access_token: 'valid-token',
    } as any);

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/app']}>
          <Routes>
            <Route path="/login" element={<div>Login Page Target</div>} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <div>Secret Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Secret Protected Content')).toBeInTheDocument();
    });
  });
});
