import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Users, ChevronLeft, ChevronRight, AlertCircle, RefreshCw, History, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { DiscoveryFilters } from '@/components/discovery/DiscoveryFilters';
import { StudentCard } from '@/components/discovery/StudentCard';
import { useDiscoverStudents, useRecommendedStudents } from '@/hooks/useDiscovery';
import { useSearchHistory, useRecordSearch, useClearSearchHistory } from '@/hooks/usePersonalization';
import type { DiscoveryMode, SkillProficiency } from '@/types/api';

export const DiscoverPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [mode, setMode] = useState<DiscoveryMode>('LEARN');
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [skillId, setSkillId] = useState<string | undefined>(undefined);
  const [proficiency, setProficiency] = useState<SkillProficiency | undefined>(undefined);
  const [sort, setSort] = useState('score,desc');
  const [page, setPage] = useState(0);
  const pageSize = 9;

  const { data: searchHistory } = useSearchHistory(6);
  const { mutate: recordSearch } = useRecordSearch();
  const { mutate: clearSearchHistory } = useClearSearchHistory();

  // Debounce search input and record search history
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(0); // reset to page 0 on search query change

      if (searchInput.trim().length >= 2) {
        recordSearch({ query: searchInput.trim(), categoryId, skillId });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, categoryId, skillId, recordSearch]);

  const {
    data: discoveryData,
    isLoading,
    isError,
    error,
    refetch,
  } = useDiscoverStudents({
    mode,
    search: debouncedSearch,
    categoryId,
    skillId,
    proficiency,
    sort,
    page,
    size: pageSize,
  });

  const { data: recommendedData } = useRecommendedStudents(0, 3);

  const handleResetFilters = () => {
    setMode('GENERAL');
    setSearchInput('');
    setDebouncedSearch('');
    setCategoryId(undefined);
    setSkillId(undefined);
    setProficiency(undefined);
    setSort('score,desc');
    setPage(0);
    setSearchParams({});
  };

  const handleSelectRecentSearch = (query: string) => {
    setSearchInput(query);
    setDebouncedSearch(query);
  };

  const students = discoveryData?.items || [];
  const totalElements = discoveryData?.totalElements || 0;
  const totalPages = discoveryData?.totalPages || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="gap-1 text-[10px]">
              <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
              Skill Match Engine
            </Badge>
            <span className="text-xs text-[#94A3B8]">• Deterministic Compatibility</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8F5ED] mt-1.5 font-display">
            Discover Students
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5 max-w-2xl">
            Find peers who teach what you want to learn, or connect with students looking for skills you can share.
          </p>
        </div>
      </div>

      {/* Recommended For You Section */}
      {!debouncedSearch && !categoryId && !skillId && page === 0 && recommendedData && recommendedData.items.length > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#111827] border border-[rgba(212,175,106,0.22)] space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#1E293B] border border-slate-700/60 text-[#10B981] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#F8F5ED] font-display">Top Recommended Matches</h2>
                <p className="text-[11px] text-[#94A3B8]">Highest mutual skill compatibility based on your profile</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-[#10B981] bg-[#10B981]/12 px-2.5 py-0.5 rounded-full border border-[#10B981]/25">
              Personalized
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedData.items.slice(0, 3).map((candidate) => (
              <StudentCard key={candidate.candidate.id} candidate={candidate} />
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="space-y-3">
        <DiscoveryFilters
          mode={mode}
          onModeChange={(newMode) => {
            setMode(newMode);
            setPage(0);
          }}
          search={searchInput}
          onSearchChange={setSearchInput}
          categoryId={categoryId}
          onCategoryChange={(newCat) => {
            setCategoryId(newCat);
            setPage(0);
          }}
          skillId={skillId}
          onSkillChange={(newSkill) => {
            setSkillId(newSkill);
            setPage(0);
          }}
          proficiency={proficiency}
          onProficiencyChange={(newProf) => {
            setProficiency(newProf);
            setPage(0);
          }}
          sort={sort}
          onSortChange={(newSort) => {
            setSort(newSort);
            setPage(0);
          }}
          onReset={handleResetFilters}
        />

        {/* Recent Searches Chips */}
        {searchHistory && searchHistory.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#94A3B8]">
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
              <History className="w-3.5 h-3.5 text-[#D4AF6A]" />
              Recent searches:
            </span>
            {searchHistory.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectRecentSearch(item.query)}
                className="px-2.5 py-1 rounded-lg bg-[#1E293B] border border-slate-700/80 hover:border-[#10B981] hover:text-[#10B981] transition-colors text-[11px] text-[#F8F5ED]"
              >
                {item.query}
              </button>
            ))}
            <button
              onClick={() => clearSearchHistory()}
              className="text-[10px] text-slate-500 hover:text-slate-300 ml-1 flex items-center gap-0.5 underline"
            >
              <X className="w-2.5 h-2.5" /> Clear
            </button>
          </div>
        )}
      </div>

      {/* Results Header: Count & Active mode indicator */}
      <div className="flex items-center justify-between text-xs text-[#94A3B8] pt-1">
        <div>
          {isLoading ? (
            <span>Searching candidate pool...</span>
          ) : (
            <span>
              Found <strong className="text-[#F8F5ED] font-semibold">{totalElements}</strong> matching student{totalElements === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </div>

      {/* Error View */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Discovery Search Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error instanceof Error ? error.message : 'Could not fetch discovery candidates.'}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-7 text-xs border-red-500/40 text-red-400">
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="h-64 rounded-2xl bg-[#111827] border border-slate-800 animate-pulse p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#1E293B]" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-[#1E293B] rounded w-24" />
                  <div className="h-3 bg-[#1E293B]/60 rounded w-36" />
                </div>
              </div>
              <div className="h-16 bg-[#1E293B]/40 rounded-xl" />
              <div className="h-8 bg-[#1E293B] rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Candidates Grid */}
      {!isLoading && !isError && students.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((candidate) => (
            <StudentCard key={candidate.candidate.id} candidate={candidate} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && students.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-[#111827] border border-slate-800 space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#1E293B] border border-slate-700 text-[#10B981] flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#F8F5ED]">No matching students found</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Try switching your discovery mode, broadening your search keyword, or clearing the category and proficiency filters.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleResetFilters} className="text-xs gap-1.5">
            Reset All Filters
          </Button>
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <span className="text-xs text-[#94A3B8]">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((prev) => Math.max(0, prev - 1))}
              className="h-8 text-xs gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((prev) => prev + 1)}
              className="h-8 text-xs gap-1"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
