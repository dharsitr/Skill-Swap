import React, { useState, useEffect } from 'react';
import { useUpdateUserSkill } from '@/hooks/useSkills';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Loader2, AlertCircle, Edit } from 'lucide-react';
import type { SkillProficiency, UserSkill } from '@/types/api';

interface EditSkillModalProps {
  userSkill: UserSkill | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditSkillModal: React.FC<EditSkillModalProps> = ({
  userSkill,
  isOpen,
  onClose,
}) => {
  const [proficiency, setProficiency] = useState<SkillProficiency>('INTERMEDIATE');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutateAsync: updateSkill, isPending: isSubmitting } = useUpdateUserSkill();

  useEffect(() => {
    if (userSkill) {
      setProficiency(userSkill.proficiency);
      setDescription(userSkill.description || '');
      setErrorMessage(null);
    }
  }, [userSkill]);

  if (!isOpen || !userSkill) return null;

  const isTeaching = userSkill.relationshipType === 'TEACH';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      await updateSkill({
        id: userSkill.id,
        request: {
          proficiency,
          description: description.trim() || null,
        },
      });

      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update skill details.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#111827] border border-[rgba(212,175,106,0.22)] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0E1522]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#1E293B] border border-slate-700/60 text-[#10B981]">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F8F5ED] font-display">
                Edit {userSkill.skillName}
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Update proficiency or details for this {isTeaching ? 'teaching' : 'learning'} skill
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#94A3B8] hover:text-[#F8F5ED]"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <Alert variant="destructive" className="py-2.5">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="editProficiency" className="text-xs font-semibold text-[#F8F5ED]">
              {isTeaching ? 'Teaching Proficiency Level' : 'Current Knowledge Level'}
            </Label>
            <Select
              id="editProficiency"
              value={proficiency}
              onChange={(e) => setProficiency(e.target.value as SkillProficiency)}
              className="text-xs"
            >
              <option value="BEGINNER">Beginner (Foundations & Concepts)</option>
              <option value="INTERMEDIATE">Intermediate (Practical Application)</option>
              <option value="ADVANCED">Advanced (Deep Technical Expertise)</option>
              {isTeaching && <option value="EXPERT">Expert (Mastery & Mentorship)</option>}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="editDescription" className="text-xs font-semibold text-[#F8F5ED]">
              Description / Notes
            </Label>
            <Textarea
              id="editDescription"
              placeholder="What specifically can you teach or what topics are you exploring?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={1000}
              className="text-xs"
            />
            <span className="text-[10px] text-[#94A3B8] block text-right">
              {description.length} / 1000 characters
            </span>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={isSubmitting}
              className="gap-2 text-xs font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
