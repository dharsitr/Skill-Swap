import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterPage } from '@/pages/RegisterPage';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';

vi.mock('@/auth/authService', () => ({
  authService: {
    getSession: vi.fn().mockResolvedValue(null),
    onAuthStateChange: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

describe('RegisterPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders registration form fields correctly', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/Full Display Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/College \/ University/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/College Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Register Account/i })).toBeInTheDocument();
  });

  it('validates password mismatch on registration', async () => {
    const { container } = render(
      <BrowserRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/Full Display Name/i), {
      target: { value: 'Alex Rivera' },
    });
    fireEvent.change(screen.getByLabelText(/College \/ University/i), {
      target: { value: 'Stanford' },
    });
    fireEvent.change(screen.getByLabelText(/College Email/i), {
      target: { value: 'alex@stanford.edu' },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: 'secret123' },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: 'different123' },
    });

    const form = container.querySelector('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    });
  });
});
