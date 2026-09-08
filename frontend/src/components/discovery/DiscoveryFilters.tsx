import React from 'react';
import { Search, X, BookOpen, Lightbulb, Compass, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useSkillCategories, useSkillsCatalog } from '@/hooks/useSkills';
import type { DiscoveryMode, SkillProficiency } from '@/types/api';

interface DiscoveryFiltersProps {
  mode: DiscoveryMode;
  onModeChange: (mode: DiscoveryMode) => void;
  search: string;
  onSearchChange: (search: string) => void;
  categoryId?: string;
  onCategoryChange: (categoryId?: string) => void;
  skillId?: string;
  onSkillChange: (skillId?: string) => void;
  proficiency?: SkillProficiency;
  onProficiencyChange: (proficiency?: SkillProficiency) => void;
  sort: string;
  onSortChange: (sort: string) => void;
  onReset: () => void;
}

export const DiscoveryFilters: React.FC<DiscoveryFiltersProps> = ({
  mode,
  onModeChange,
  search,
  onSearchChange,
  categoryId,
  onCategoryChange,
  skillId,
  onSkillChange,
  proficiency,
  onProficiencyChange,
  sort,
  onSortChange,
  onReset,
}) => {
  const { data: categoriesData } = useSkillCategories();
  const { data: skillsData } = useSkillsCatalog(undefined, categoryId);

  const categories = categoriesData?.items || [];
  const skills = skillsData?.items || [];

  const hasActiveFilters = Boolean(
    search || categoryId || skillId || proficiency || (mode !== 'GENERAL') || (sort !== 'score,desc')
  );

  return (
    <div className="space-y-4">
      {/* Top Bar: Mode Tabs + Search Input */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Mode Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-[#111827] border border-slate-800 self-start">
          <button
            type="button"
            onClick={() => onModeChange('LEARN')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'LEARN'
                ? 'bg-[#10B981] text-[#06131A] shadow-sm'
                : 'text-[#94A3B8] hover:text-[#F8F5ED] hover:bg-[#1E293B]'
            }`}
            aria-label="Find Teachers"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Learn Mode</span>
          </button>
          <button
            type="button"
            onClick={() => onModeChange('TEACH')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'TEACH'
                ? 'bg-[#10B981] text-[#06131A] shadow-sm'
                : 'text-[#94A3B8] hover:text-[#F8F5ED] hover:bg-[#1E293B]'
            }`}
            aria-label="Find Learners"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Teach Mode</span>
          </button>
          <button
            type="button"
            onClick={() => onModeChange('GENERAL')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'GENERAL'
                ? 'bg-[#1E293B] text-[#F8F5ED] font-semibold border border-slate-700/60 shadow-sm'
                : 'text-[#94A3B8] hover:text-[#F8F5ED] hover:bg-[#1E293B]'
            }`}
            aria-label="Explore All Students"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>All Students</span>
          </button>
        </div>

        {/* Search Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search skills or students..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-8 h-9 text-xs"
            aria-label="Search skills or students"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F8F5ED]"
              aria-label="Clear search query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Filters Row */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        {/* Category dropdown */}
        <div className="w-40 sm:w-48">
          <Select
            value={categoryId || ''}
            onChange={(e) => {
              onCategoryChange(e.target.value || undefined);
              onSkillChange(undefined); // reset skill when category changes
            }}
            className="h-8 text-xs"
            aria-label="Filter by Category"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Specific Skill dropdown */}
        <div className="w-40 sm:w-48">
          <Select
            value={skillId || ''}
            onChange={(e) => onSkillChange(e.target.value || undefined)}
            className="h-8 text-xs"
            disabled={!categoryId && skills.length === 0}
            aria-label="Filter by Skill"
          >
            <option value="">All Skills</option>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Proficiency dropdown */}
        <div className="w-36">
          <Select
            value={proficiency || ''}
            onChange={(e) => onProficiencyChange((e.target.value as SkillProficiency) || undefined)}
            className="h-8 text-xs"
            aria-label="Filter by Proficiency"
          >
            <option value="">All Levels</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
            <option value="EXPERT">Expert</option>
          </Select>
        </div>

        {/* Sort dropdown */}
        <div className="w-36">
          <Select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="h-8 text-xs"
            aria-label="Sort Candidates"
          >
            <option value="score,desc">Best Match</option>
            <option value="collegeName,asc">Institution</option>
            <option value="createdAt,desc">Newest First</option>
          </Select>
        </div>

        {/* Reset button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 text-xs gap-1 text-[#94A3B8] hover:text-[#F8F5ED]"
            aria-label="Reset Filters"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </Button>
        )}
      </div>
    </div>
  );
};
