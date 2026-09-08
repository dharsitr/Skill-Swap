import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '@/App';
import { queryClient } from '@/lib/queryClient';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SkillSwap Application Shell & Landing Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('renders application branding and header navigation', () => {
    render(<App />);

    const brandElements = screen.getAllByText(/SkillSwap/i);
    expect(brandElements.length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Sign In/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Get Started/i }).length).toBeGreaterThan(0);
  });

  it('renders professional landing page hero, sections, and CTAs', () => {
    render(<App />);

    expect(screen.getByText(/Trade Knowledge. Master Any Skill./i)).toBeInTheDocument();
    expect(screen.getByText(/How SkillSwap Works/i)).toBeInTheDocument();
    expect(screen.getByText(/Popular Skills on Campus/i)).toBeInTheDocument();
    expect(screen.getByText(/Built for Serious Peer Collaboration/i)).toBeInTheDocument();
    expect(screen.getByText(/Ready to Unlock Your Skill Potential\?/i)).toBeInTheDocument();
  });

  it('renders trust stats and popular skill categories', () => {
    render(<App />);

    expect(screen.getByText(/Verified Skills/i)).toBeInTheDocument();
    expect(screen.getByText(/Campus Students/i)).toBeInTheDocument();
    expect(screen.getByText(/Coding & Tech/i)).toBeInTheDocument();
    expect(screen.getByText(/Design & Creative/i)).toBeInTheDocument();
  });
});
