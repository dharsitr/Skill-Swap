import React from 'react';
import { useDeleteUserSkill } from '@/hooks/useSkills';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { UserSkill } from '@/types/api';

interface DeleteSkillDialogProps {
  userSkill: UserSkill | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteSkillDialog: React.FC<DeleteSkillDialogProps> = ({
  userSkill,
  isOpen,
  onClose,
}) => {
  const { mutateAsync: deleteSkill, isPending: isDeleting } = useDeleteUserSkill();

  if (!isOpen || !userSkill) return null;

  const relationshipLabel = userSkill.relationshipType === 'TEACH' ? 'teaching' : 'learning';

  const handleConfirm = async () => {
    try {
      await deleteSkill(userSkill.id);
      onClose();
    } catch {
      // Error handled by TanStack Query
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#111827] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/15 text-red-400 border border-red-500/20 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F8F5ED]">Remove Skill</h3>
            <p className="text-xs text-[#94A3B8]">Confirmation required</p>
          </div>
        </div>

        <p className="text-xs text-[#CBD5E1] leading-relaxed">
          Are you sure you want to remove <span className="font-semibold text-[#F8F5ED]">{userSkill.skillName}</span> from your <span className="font-semibold text-[#F8F5ED]">{relationshipLabel}</span> skills?
        </p>

        <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-800">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="gap-1.5 text-xs font-semibold"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Removing...</span>
              </>
            ) : (
              <span>Remove Skill</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
