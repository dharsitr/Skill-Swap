import React, { useState } from 'react';
import { useBlockUser, useUnblockUser } from '@/hooks/useSafety';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Ban, Loader2, UserCheck, X } from 'lucide-react';

interface BlockModalProps {
  isOpen: boolean;
  userId: string;
  userName: string;
  isCurrentlyBlocked: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BlockModal: React.FC<BlockModalProps> = ({
  isOpen,
  userId,
  userName,
  isCurrentlyBlocked,
  onClose,
  onSuccess,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutateAsync: blockUser, isPending: isBlocking } = useBlockUser();
  const { mutateAsync: unblockUser, isPending: isUnblocking } = useUnblockUser();

  const isPending = isBlocking || isUnblocking;

  if (!isOpen) return null;

  const handleAction = async () => {
    setErrorMessage(null);
    try {
      if (isCurrentlyBlocked) {
        await unblockUser(userId);
      } else {
        await blockUser(userId);
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update block settings. Please try again.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="block-modal-title"
    >
      <div className="bg-[#111827] border border-slate-700/80 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl relative text-neutral-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isCurrentlyBlocked
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {isCurrentlyBlocked ? <UserCheck className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
            </div>
            <div>
              <h2 id="block-modal-title" className="text-base font-bold text-[#F8F5ED]">
                {isCurrentlyBlocked ? `Unblock ${userName}` : `Block ${userName}`}
              </h2>
              <p className="text-xs text-[#94A3B8]">
                {isCurrentlyBlocked ? 'Restore communication & interaction' : 'Manage privacy and interactions'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 p-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-neutral-300 space-y-2">
          {isCurrentlyBlocked ? (
            <p>
              Unblocking <strong className="text-white">{userName}</strong> will allow them to view your profile, send exchange requests, and exchange messages with you again.
            </p>
          ) : (
            <>
              <p>
                Are you sure you want to block <strong className="text-white">{userName}</strong>?
              </p>
              <ul className="list-disc pl-5 space-y-1 text-neutral-400">
                <li>They will not be able to send you exchange requests.</li>
                <li>They cannot message you or initiate chat conversations.</li>
                <li>Neither of you will see each other in discovery recommendations.</li>
                <li>They will not be notified that they were blocked.</li>
              </ul>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isPending}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={isCurrentlyBlocked ? 'default' : 'destructive'}
            size="sm"
            onClick={handleAction}
            disabled={isPending}
            className={`text-xs font-semibold gap-1.5 ${
              isCurrentlyBlocked
                ? 'bg-[#10B981] hover:bg-[#059669] text-[#06131A]'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : isCurrentlyBlocked ? (
              <span>Unblock User</span>
            ) : (
              <span>Block User</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
