import React from 'react';
import { Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  useMyAvailability,
  useCreateAvailability,
  useDeleteAvailability,
  useUpdateAvailability,
} from '@/hooks/useAvailability';
import { AvailabilityEditor } from '@/components/availability/AvailabilityEditor';

export const AvailabilityPage: React.FC = () => {
  const { data: slots = [], isLoading, isError, error, refetch, isFetching } = useMyAvailability();
  const createMutation = useCreateAvailability();
  const deleteMutation = useDeleteAvailability();
  const updateMutation = useUpdateAvailability();

  const handleAddSlot = async (req: Parameters<typeof createMutation.mutateAsync>[0]) => {
    await createMutation.mutateAsync(req);
  };

  const handleDeleteSlot = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    const slot = slots.find((s) => s.id === id);
    if (!slot) return;
    await updateMutation.mutateAsync({
      id,
      request: {
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        timezone: slot.timezone,
        active,
      },
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8F5ED] font-display">
                Weekly Availability
              </h1>
              <p className="text-sm text-slate-400">
                Configure your recurring hours so peers can schedule skill exchange sessions with you.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-slate-400 hover:text-white"
            title="Refresh availability"
            aria-label="Refresh availability"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive" className="bg-rose-950/20 border border-rose-900/40 text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load your availability schedule.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Editor & List */}
      <AvailabilityEditor
        slots={slots}
        onAddSlot={handleAddSlot}
        onDeleteSlot={handleDeleteSlot}
        onToggleActive={handleToggleActive}
        isLoading={isLoading || createMutation.isPending || deleteMutation.isPending}
      />
    </div>
  );
};
export default AvailabilityPage;
