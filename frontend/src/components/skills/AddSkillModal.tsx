import React, { useState, useMemo } from 'react';
import { useSkillCategories, useSkillsCatalog, useAddUserSkill } from '@/hooks/useSkills';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Search, Check, Loader2, AlertCircle, Sparkles, BookOpen } from 'lucide-react';
import type { SkillProficiency, SkillRelationshipType, UserSkill } from '@/types/api';

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  relationshipType: SkillRelationshipType;
  existingSkills: UserSkill[];
}

export const AddSkillModal: React.FC<AddSkillModalProps> = ({
  isOpen,
  onClose,
  relationshipType,
  existingSkills,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [proficiency, setProficiency] = useState<SkillProficiency>('INTERMEDIATE');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: categoriesData, isLoading: categoriesLoading } = useSkillCategories();
  const { data: skillsData, isLoading: skillsLoading } = useSkillsCatalog(searchQuery, selectedCategoryId);
  const { mutateAsync: addSkill, isPending: isSubmitting } = useAddUserSkill();

  const existingSkillIds = useMemo(() => {
    return new Set(
      existingSkills
        .filter((s) => s.relationshipType === relationshipType)
        .map((s) => s.skillId)
    );
  }, [existingSkills, relationshipType]);

  if (!isOpen) return null;

  const handleSelectSkill = (id: string) => {
    if (existingSkillIds.has(id)) {
      setErrorMessage('You have already added this skill to your ' + (relationshipType === 'TEACH' ? 'teaching' : 'learning') + ' list.');
      return;
    }
    setErrorMessage(null);
    setSelectedSkillId(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedSkillId) {
      setErrorMessage('Please select a skill from the catalog.');
      return;
    }

    try {
      await addSkill({
        skillId: selectedSkillId,
        relationshipType,
        proficiency,
        description: description.trim() || null,
      });

      // Reset and close
      setSearchQuery('');
      setSelectedCategoryId('');
      setSelectedSkillId('');
      setDescription('');
      setProficiency('INTERMEDIATE');
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add skill to your profile.');
    }
  };

  const isTeaching = relationshipType === 'TEACH';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#111827] border border-[rgba(212,175,106,0.22)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0E1522]">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${isTeaching ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30' : 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30'}`}>
              {isTeaching ? <Sparkles className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F8F5ED] font-display">
                {isTeaching ? 'Add Teaching Skill' : 'Add Learning Skill'}
              </h2>
              <p className="text-xs text-[#94A3B8]">
                {isTeaching ? 'Share what you can teach other campus peers' : 'Choose topics you want to learn from students'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#F8F5ED] hover:bg-[#1E293B] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Filter Catalog */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-[#F8F5ED]">Select Skill from Catalog *</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Category selector */}
              <Select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                disabled={categoriesLoading}
                className="h-9 text-xs"
              >
                <option value="">All Categories</option>
                {categoriesData?.items.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>

              {/* Search keywords */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Search skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>
            </div>

            {/* Skill Selector List */}
            <div className="border border-slate-800 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-800/60 bg-[#0E1522]">
              {skillsLoading ? (
                <div className="p-4 text-center text-xs text-[#94A3B8] flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#10B981]" />
                  <span>Loading catalog...</span>
                </div>
              ) : skillsData?.items && skillsData.items.length > 0 ? (
                skillsData.items.map((s) => {
                  const isSelected = selectedSkillId === s.id;
                  const isAlreadyAdded = existingSkillIds.has(s.id);

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectSkill(s.id)}
                      disabled={isAlreadyAdded}
                      className={`w-full p-2.5 px-3 text-left flex items-center justify-between text-xs transition-colors ${
                        isSelected
                          ? 'bg-[#10B981]/15 text-[#34D399] font-semibold'
                          : isAlreadyAdded
                          ? 'opacity-40 cursor-not-allowed bg-slate-900/40 text-[#64748B]'
                          : 'text-[#CBD5E1] hover:bg-[#1E293B]'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="truncate font-medium">{s.name}</p>
                        {(s.category?.name || s.categoryName) && (
                          <p className="text-[10px] text-[#94A3B8] truncate">{s.category?.name || s.categoryName}</p>
                        )}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#10B981] shrink-0" />}
                      {isAlreadyAdded && <span className="text-[10px] text-[#64748B]">Added</span>}
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-[#94A3B8]">
                  No skills matching your criteria.
                </div>
              )}
            </div>
          </div>

          {/* Proficiency Level */}
          <div className="space-y-1.5">
            <Label htmlFor="proficiency" className="text-xs font-semibold text-[#F8F5ED]">Proficiency Level *</Label>
            <Select
              id="proficiency"
              value={proficiency}
              onChange={(e) => setProficiency(e.target.value as SkillProficiency)}
              className="h-9 text-xs"
            >
              <option value="BEGINNER">Beginner (Foundational)</option>
              <option value="INTERMEDIATE">Intermediate (Competent)</option>
              <option value="ADVANCED">Advanced (Highly Skilled)</option>
              <option value="EXPERT">Expert (Mastery / Teaching-Ready)</option>
            </Select>
          </div>

          {/* Notes / Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold text-[#F8F5ED]">
              {isTeaching ? 'What will you cover / teach? (Optional)' : 'What are your goals in this subject? (Optional)'}
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isTeaching ? "e.g. Can teach React hooks, TypeScript setup, and API integration..." : "e.g. Want help understanding calculus optimization or dynamic programming..."}
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Footer Action */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2.5">
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
              disabled={isSubmitting || !selectedSkillId}
              className="text-xs font-semibold gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Add to Profile'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
