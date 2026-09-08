import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StarRating } from '@/components/reviews/StarRating';
import { ReviewsList } from '@/components/reviews/ReviewsList';
import { ReviewModal } from '@/components/reviews/ReviewModal';
import { ReportModal } from '@/components/safety/ReportModal';
import { BlockModal } from '@/components/safety/BlockModal';
import { DisputeModal } from '@/components/safety/DisputeModal';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { reviewService } from '@/services/reviewService';
import { safetyService } from '@/services/safetyService';
import type { ReviewResponse } from '@/types/api';

vi.mock('@/services/reviewService', () => ({
  reviewService: {
    createReview: vi.fn(),
    getUserReviews: vi.fn(),
    getUserRatingSummary: vi.fn(),
    getSessionReviewStatus: vi.fn(),
  },
}));

vi.mock('@/services/safetyService', () => ({
  safetyService: {
    blockUser: vi.fn(),
    unblockUser: vi.fn(),
    getBlockedUsers: vi.fn(),
    getBlockStatus: vi.fn(),
    createReport: vi.fn(),
    getMyReports: vi.fn(),
    createDispute: vi.fn(),
    getMyDisputes: vi.fn(),
    getDisputeForSession: vi.fn(),
  },
}));

const renderWithQueryClient = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('Phase 10: Reviews, Ratings & Safety Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  describe('StarRating Component', () => {
    it('renders read-only star rating with accessible label', () => {
      render(<StarRating rating={4} readOnly size="md" />);
      const ratingContainer = screen.getByRole('img');
      expect(ratingContainer).toHaveAttribute('aria-label', '4 out of 5 stars');
    });

    it('handles interactive star selection', () => {
      const handleChange = vi.fn();
      render(<StarRating rating={3} readOnly={false} onChange={handleChange} />);
      const buttons = screen.getAllByRole('radio');
      expect(buttons).toHaveLength(5);

      fireEvent.click(buttons[4]!); // Click 5th star
      expect(handleChange).toHaveBeenCalledWith(5);
    });
  });

  describe('ReviewsList Component', () => {
    const mockReviews: ReviewResponse[] = [
      {
        id: 'rev-1',
        sessionId: 'sess-1',
        reviewerId: 'usr-alice',
        reviewerName: 'Alice Student',
        revieweeId: 'usr-bob',
        rating: 5,
        comment: 'Fantastic teacher, highly recommended!',
        createdAt: '2026-08-30T10:00:00Z',
      },
    ];

    it('renders empty message when no reviews exist', () => {
      render(<ReviewsList reviews={[]} />);
      expect(screen.getByText('No reviews yet.')).toBeInTheDocument();
    });

    it('renders review list with author, rating, and feedback comment', () => {
      render(<ReviewsList reviews={mockReviews} />);
      expect(screen.getByText('Alice Student')).toBeInTheDocument();
      expect(screen.getByText('Fantastic teacher, highly recommended!')).toBeInTheDocument();
    });
  });

  describe('ReviewModal Component', () => {
    it('submits review successfully when form is filled', async () => {
      const onSuccess = vi.fn();
      const onClose = vi.fn();
      vi.mocked(reviewService.createReview).mockResolvedValueOnce({
        id: 'rev-new',
        sessionId: 'sess-1',
        reviewerId: 'usr-1',
        reviewerName: 'Me',
        revieweeId: 'usr-bob',
        rating: 5,
        comment: 'Great session!',
        createdAt: '2026-08-30T10:00:00Z',
      });

      renderWithQueryClient(
        <ReviewModal
          isOpen={true}
          sessionId="sess-1"
          partnerName="Bob Tutor"
          skillName="React Fundamentals"
          onClose={onClose}
          onSuccess={onSuccess}
        />
      );

      expect(screen.getByText('Rate & Review Session')).toBeInTheDocument();
      expect(screen.getByText('React Fundamentals with Bob Tutor')).toBeInTheDocument();

      const textarea = screen.getByPlaceholderText(/Share what went well/i);
      fireEvent.change(textarea, { target: { value: 'Great session!' } });

      const submitBtn = screen.getByRole('button', { name: /Submit Review/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(reviewService.createReview).toHaveBeenCalledWith({
          sessionId: 'sess-1',
          rating: 5,
          comment: 'Great session!',
        });
        expect(onSuccess).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('ReportModal Component', () => {
    it('submits report with selected violation reason', async () => {
      const onClose = vi.fn();
      vi.mocked(safetyService.createReport).mockResolvedValueOnce({
        id: 'rep-1',
        reportedUserId: 'usr-bad',
        reportedUserName: 'Bad Actor',
        reason: 'HARASSMENT',
        description: 'Sent abusive messages',
        status: 'OPEN',
        createdAt: '2026-08-30T10:00:00Z',
      });

      renderWithQueryClient(
        <ReportModal
          isOpen={true}
          reportedUserId="usr-bad"
          reportedUserName="Bad Actor"
          onClose={onClose}
        />
      );

      expect(screen.getByText(/Report Bad Actor/i)).toBeInTheDocument();

      const harassmentRadio = screen.getByLabelText(/Harassment/i);
      fireEvent.click(harassmentRadio);

      const textarea = screen.getByPlaceholderText(/Provide any relevant context/i);
      fireEvent.change(textarea, { target: { value: 'Sent abusive messages' } });

      const submitBtn = screen.getByRole('button', { name: /Submit Report/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(safetyService.createReport).toHaveBeenCalledWith({
          reportedUserId: 'usr-bad',
          sessionId: undefined,
          reason: 'HARASSMENT',
          description: 'Sent abusive messages',
        });
      });
    });
  });

  describe('BlockModal Component', () => {
    it('blocks user on confirmation', async () => {
      const onClose = vi.fn();
      const onSuccess = vi.fn();
      vi.mocked(safetyService.blockUser).mockResolvedValueOnce({
        id: 'block-1',
        blockedUserId: 'usr-target',
        blockedUserName: 'Annoying User',
        createdAt: '2026-08-30T10:00:00Z',
      });

      renderWithQueryClient(
        <BlockModal
          isOpen={true}
          userId="usr-target"
          userName="Annoying User"
          isCurrentlyBlocked={false}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      );

      expect(screen.getByText('Block Annoying User')).toBeInTheDocument();
      const blockBtn = screen.getByRole('button', { name: /Block User/i });
      fireEvent.click(blockBtn);

      await waitFor(() => {
        expect(safetyService.blockUser).toHaveBeenCalledWith('usr-target');
        expect(onSuccess).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('unblocks user when currently blocked', async () => {
      const onClose = vi.fn();
      const onSuccess = vi.fn();
      vi.mocked(safetyService.unblockUser).mockResolvedValueOnce(undefined);

      renderWithQueryClient(
        <BlockModal
          isOpen={true}
          userId="usr-target"
          userName="Annoying User"
          isCurrentlyBlocked={true}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      );

      expect(screen.getByText('Unblock Annoying User')).toBeInTheDocument();
      const unblockBtn = screen.getByRole('button', { name: /Unblock User/i });
      fireEvent.click(unblockBtn);

      await waitFor(() => {
        expect(safetyService.unblockUser).toHaveBeenCalledWith('usr-target');
        expect(onSuccess).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('DisputeModal Component', () => {
    it('validates required description and submits dispute', async () => {
      const onClose = vi.fn();
      vi.mocked(safetyService.createDispute).mockResolvedValueOnce({
        id: 'disp-1',
        sessionId: 'sess-123',
        createdById: 'usr-1',
        createdByName: 'Me',
        reason: 'SESSION_DID_NOT_HAPPEN',
        description: 'Tutor did not show up on call',
        status: 'OPEN',
        createdAt: '2026-08-30T10:00:00Z',
      });

      renderWithQueryClient(
        <DisputeModal
          isOpen={true}
          sessionId="sess-123"
          skillName="React Basics"
          onClose={onClose}
        />
      );

      expect(screen.getByText('Report Session Problem')).toBeInTheDocument();

      const textarea = screen.getByPlaceholderText(/Explain what happened/i);
      fireEvent.change(textarea, { target: { value: 'Tutor did not show up on call' } });

      const submitBtn = screen.getByRole('button', { name: /Submit Dispute/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(safetyService.createDispute).toHaveBeenCalledWith({
          sessionId: 'sess-123',
          reason: 'SESSION_DID_NOT_HAPPEN',
          description: 'Tutor did not show up on call',
        });
      });
    });
  });
});
