import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AvailabilityEditor } from '@/components/availability/AvailabilityEditor';
import type { UserAvailabilityResponse } from '@/types/api';

const mockSlots: UserAvailabilityResponse[] = [
  {
    id: 'slot-1',
    userId: 'usr-1',
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '12:00',
    timezone: 'UTC',
    active: true,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'slot-2',
    userId: 'usr-1',
    dayOfWeek: 'WEDNESDAY',
    startTime: '14:00',
    endTime: '16:30',
    timezone: 'UTC',
    active: false,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
];

describe('AvailabilityEditor Component', () => {
  it('renders weekly schedule and active slot counts', () => {
    render(
      <AvailabilityEditor
        slots={mockSlots}
        onAddSlot={vi.fn()}
        onDeleteSlot={vi.fn()}
      />
    );

    expect(screen.getByText('Define Weekly Availability')).toBeInTheDocument();
    expect(screen.getByText('1 Active Slot')).toBeInTheDocument();
    expect(screen.getAllByText('Monday').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Wednesday').length).toBeGreaterThan(0);
    expect(screen.getByText(/9:00 AM/i)).toBeInTheDocument();
    expect(screen.getByText(/4:30 PM/i)).toBeInTheDocument();
  });

  it('renders empty state when no slots exist', () => {
    render(
      <AvailabilityEditor
        slots={[]}
        onAddSlot={vi.fn()}
        onDeleteSlot={vi.fn()}
      />
    );

    expect(screen.getByText('No availability slots configured yet')).toBeInTheDocument();
    expect(screen.getByText('0 Active Slots')).toBeInTheDocument();
  });

  it('validates that end time is strictly after start time', async () => {
    const onAddSlot = vi.fn();
    render(
      <AvailabilityEditor
        slots={[]}
        onAddSlot={onAddSlot}
        onDeleteSlot={vi.fn()}
      />
    );

    const startInput = screen.getByText('Start Time').parentElement?.querySelector('input')!;
    const endInput = screen.getByText('End Time').parentElement?.querySelector('input')!;

    fireEvent.change(startInput, { target: { value: '15:00' } });
    fireEvent.change(endInput, { target: { value: '14:00' } });

    const submitBtn = screen.getByText('Add Availability Slot');
    const form = submitBtn.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('End time must be strictly after start time.')).toBeInTheDocument();
      expect(onAddSlot).not.toHaveBeenCalled();
    });
  });

  it('submits valid availability slot successfully', async () => {
    const onAddSlot = vi.fn().mockResolvedValue({});
    render(
      <AvailabilityEditor
        slots={[]}
        onAddSlot={onAddSlot}
        onDeleteSlot={vi.fn()}
      />
    );

    const startInput = screen.getByText('Start Time').parentElement?.querySelector('input')!;
    const endInput = screen.getByText('End Time').parentElement?.querySelector('input')!;

    fireEvent.change(startInput, { target: { value: '10:00' } });
    fireEvent.change(endInput, { target: { value: '12:00' } });

    const submitBtn = screen.getByText('Add Availability Slot');
    const form = submitBtn.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(onAddSlot).toHaveBeenCalledWith({
        dayOfWeek: 'MONDAY',
        startTime: '10:00',
        endTime: '12:00',
        timezone: expect.any(String),
        active: true,
      });
    });
  });

  it('triggers onDeleteSlot when delete button is clicked', async () => {
    const onDeleteSlot = vi.fn().mockResolvedValue({});
    render(
      <AvailabilityEditor
        slots={mockSlots}
        onAddSlot={vi.fn()}
        onDeleteSlot={onDeleteSlot}
      />
    );

    const deleteBtns = screen.getAllByTitle('Delete slot');
    expect(deleteBtns.length).toBe(2);

    fireEvent.click(deleteBtns[0]!);
    await waitFor(() => {
      expect(onDeleteSlot).toHaveBeenCalledWith('slot-1');
    });
  });

  it('triggers onToggleActive when status switch is toggled', async () => {
    const onToggleActive = vi.fn().mockResolvedValue({});
    render(
      <AvailabilityEditor
        slots={mockSlots}
        onAddSlot={vi.fn()}
        onDeleteSlot={vi.fn()}
        onToggleActive={onToggleActive}
      />
    );

    const toggleBtn = screen.getByLabelText('Mark inactive');
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(onToggleActive).toHaveBeenCalledWith('slot-1', false);
    });
  });
});
