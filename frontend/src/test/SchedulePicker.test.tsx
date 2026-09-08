import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SchedulePicker } from '@/components/scheduling/SchedulePicker';

describe('SchedulePicker Component', () => {
  it('renders schedule session time header and inputs', () => {
    render(
      <SchedulePicker
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText('Schedule Session Time')).toBeInTheDocument();
    expect(screen.getByText('Session Date')).toBeInTheDocument();
    expect(screen.getByText('Start Time')).toBeInTheDocument();
    expect(screen.getByText('Session Duration')).toBeInTheDocument();
    expect(screen.getByText('60 min')).toBeInTheDocument();
    expect(screen.getByText('Confirm Schedule')).toBeInTheDocument();
  });

  it('renders reschedule mode with reason field and updated button text', () => {
    render(
      <SchedulePicker
        isReschedule={true}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText('Reschedule Session')).toBeInTheDocument();
    expect(screen.getByText('Reason for Rescheduling (Optional)')).toBeInTheDocument();
    expect(screen.getByText('Confirm Reschedule')).toBeInTheDocument();
  });

  it('allows changing duration preset', () => {
    render(
      <SchedulePicker
        onSubmit={vi.fn()}
      />
    );

    const btn90 = screen.getByText('90 min');
    fireEvent.click(btn90);

    expect(screen.getByText(/90 mins/i)).toBeInTheDocument();
  });

  it('rejects scheduling in the past', async () => {
    const onSubmit = vi.fn();
    render(
      <SchedulePicker
        onSubmit={onSubmit}
      />
    );

    const dateInput = screen.getByText('Session Date').parentElement?.querySelector('input')!;
    const timeInput = screen.getByText('Start Time').parentElement?.querySelector('input')!;

    // Set a date far in the past
    fireEvent.change(dateInput, { target: { value: '2020-01-01' } });
    fireEvent.change(timeInput, { target: { value: '10:00' } });

    const submitBtn = screen.getByText('Confirm Schedule');
    const form = submitBtn.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Scheduled session start time must be in the future.')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  it('submits valid future schedule window', async () => {
    const onSubmit = vi.fn().mockResolvedValue({});
    render(
      <SchedulePicker
        onSubmit={onSubmit}
      />
    );

    const dateInput = screen.getByText('Session Date').parentElement?.querySelector('input')!;
    const timeInput = screen.getByText('Start Time').parentElement?.querySelector('input')!;

    // Set tomorrow date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const dateStr = tomorrow.toISOString().split('T')[0]!;

    fireEvent.change(dateInput, { target: { value: dateStr } });
    fireEvent.change(timeInput, { target: { value: '15:00' } });

    const submitBtn = screen.getByText('Confirm Schedule');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        startAt: expect.stringContaining(dateStr),
        endAt: expect.any(String),
        timezone: expect.any(String),
        reason: undefined,
      });
    });
  });
});
