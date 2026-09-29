"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/states/EmptyState";
import { LoadingState } from "@/components/ui/states/LoadingState";
import { ErrorState } from "@/components/ui/states/ErrorState";
import {
  skillService,
  UserSkillWithDetails,
} from "@/lib/supabase/services";
import { SkillDbRow } from "@/types/database.types";
import { SKILL_CATEGORIES } from "@/data/mockData";
import {
  Plus,
  Trash2,
  GraduationCap,
  Sparkles,
  Search,
  BookOpen,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function MySkillsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast, updateOnboardingData } = useApp();

  // Skills state
  const [userSkills, setUserSkills] = useState<UserSkillWithDetails[]>([]);
  const [catalogSkills, setCatalogSkills] = useState<SkillDbRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal and Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [newSkillType, setNewSkillType] = useState<"teach" | "learn">("teach");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [customSkillName, setCustomSkillName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Load user skills and catalog
  const loadSkillsData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch user's active skills
      const userRes = await skillService.getUserSkills(user.id);
      if (userRes.error) throw new Error(userRes.error);
      setUserSkills(userRes.data || []);

      // 2. Fetch full catalog
      const catalogRes = await skillService.getAllSkills();
      if (catalogRes.error) throw new Error(catalogRes.error);
      setCatalogSkills(catalogRes.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load skills.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user?.id) {
      loadSkillsData();
    }
  }, [authLoading, user?.id, loadSkillsData]);

  // Derived teach and learn lists
  const teachSkills = useMemo(
    () => userSkills.filter((s) => s.type === "teach"),
    [userSkills]
  );
  const learnSkills = useMemo(
    () => userSkills.filter((s) => s.type === "learn"),
    [userSkills]
  );

  // Filtered catalog options in modal
  const filteredCatalog = useMemo(() => {
    return catalogSkills.filter((s) => {
      const matchesCat = selectedCategory === "All" || s.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchesCat && matchesSearch;
    });
  }, [catalogSkills, selectedCategory, searchQuery]);

  // Handle Adding Skill
  const handleAddSkill = async (skillToAdd?: SkillDbRow) => {
    if (!user?.id) return;

    let skillId: string | undefined;
    let skillName: string | undefined;
    const skillCategory = selectedCategory === "All" ? "Other" : selectedCategory;

    if (skillToAdd) {
      skillId = skillToAdd.id;
      skillName = skillToAdd.name;
    } else {
      const trimmed = customSkillName.trim();
      if (!trimmed) {
        setModalError("Please specify a skill name.");
        return;
      }
      skillName = trimmed;
    }

    // Check duplicate
    const alreadyExists = userSkills.some(
      (s) =>
        s.type === newSkillType &&
        s.skill?.name.toLowerCase() === skillName?.toLowerCase()
    );

    if (alreadyExists) {
      setModalError(
        `You have already added "${skillName}" to your ${newSkillType === "teach" ? "teaching" : "learning"} portfolio.`
      );
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      // If skillId not known, find or create in catalog
      if (!skillId && skillName) {
        const createRes = await skillService.findOrCreateSkill(skillName, skillCategory);
        if (createRes.error || !createRes.data) {
          throw new Error(createRes.error || "Could not register skill in catalog.");
        }
        skillId = createRes.data.id;
        skillName = createRes.data.name;
      }

      if (!skillId) {
        throw new Error("Invalid skill reference.");
      }

      // Add to user_skills
      const addRes = await skillService.addUserSkill({
        user_id: user.id,
        skill_id: skillId,
        type: newSkillType,
      });

      if (addRes.error) {
        throw new Error(addRes.error);
      }

      showToast(
        `Added "${skillName}" to ${newSkillType === "teach" ? "teaching skills" : "learning goals"}!`
      );

      // Refresh data
      await loadSkillsData();

      // Reset modal
      setCustomSkillName("");
      setSearchQuery("");
      setModalOpen(false);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Failed to add skill.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Removing Skill
  const handleRemoveSkill = async (userSkillId: string, skillName: string, type: "teach" | "learn") => {
    const res = await skillService.removeUserSkill(userSkillId);
    if (res.error) {
      showToast(res.error, "error");
      return;
    }

    setUserSkills((prev) => prev.filter((s) => s.id !== userSkillId));
    showToast(`Removed "${skillName}" from ${type === "teach" ? "teaching skills" : "learning goals"}.`);

    // Update AppContext for consistency
    if (type === "teach") {
      updateOnboardingData({
        teachingSkills: teachSkills
          .filter((s) => s.id !== userSkillId)
          .map((s) => s.skill?.name || ""),
      });
    } else {
      updateOnboardingData({
        learningSkills: learnSkills
          .filter((s) => s.id !== userSkillId)
          .map((s) => s.skill?.name || ""),
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="py-12">
        <LoadingState message="Loading your skills portfolio..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <ErrorState
          title="Could not load skills"
          message={error}
          onRetry={loadSkillsData}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <PageHeader
        title="My Skills Portfolio"
        description="Manage the disciplines you share as a mentor and the skills you are actively mastering."
        action={
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setModalError(null);
              setModalOpen(true);
            }}
            className="font-bold shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add New Skill
          </Button>
        }
      />

      {/* Skills You Teach */}
      <Card className="p-6 rounded-3xl border-slate-200 bg-white shadow-xs">
        <CardHeader className="p-0 mb-5 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
              <span>Skills You Teach ({teachSkills.length})</span>
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Offer mentoring sessions in these disciplines to earn skill credits.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNewSkillType("teach");
              setModalError(null);
              setModalOpen(true);
            }}
            className="text-xs font-bold"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Teaching Skill
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {teachSkills.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {teachSkills.map((item) => {
                const name = item.skill?.name || "Skill";
                const category = item.skill?.category || "General";
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between group hover:border-indigo-200 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 truncate">{name}</div>
                        <div className="text-[11px] text-indigo-600 font-semibold">{category} • Mentor</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveSkill(item.id, name, "teach")}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer shrink-0 ml-2"
                      title="Remove skill"
                      aria-label={`Remove ${name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<GraduationCap className="h-6 w-6" />}
              title="No teaching skills added"
              description="Share skills you are confident mentoring others in to start earning swap credits."
              actionLabel="Add Teaching Skill"
              onAction={() => {
                setNewSkillType("teach");
                setModalError(null);
                setModalOpen(true);
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Skills You Want to Learn */}
      <Card className="p-6 rounded-3xl border-slate-200 bg-white shadow-xs">
        <CardHeader className="p-0 mb-5 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              <span>Skills You Want to Learn ({learnSkills.length})</span>
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Peer mentors matching these topics will be recommended to you for exchanges.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNewSkillType("learn");
              setModalError(null);
              setModalOpen(true);
            }}
            className="text-xs font-bold"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Learning Goal
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {learnSkills.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {learnSkills.map((item) => {
                const name = item.skill?.name || "Skill";
                const category = item.skill?.category || "General";
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between group hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 truncate">{name}</div>
                        <div className="text-[11px] text-slate-500 font-semibold">{category} • Learner</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveSkill(item.id, name, "learn")}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer shrink-0 ml-2"
                      title="Remove skill"
                      aria-label={`Remove ${name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Sparkles className="h-6 w-6" />}
              title="No learning skills selected"
              description="Choose target topics you are excited to explore with peer mentors."
              actionLabel="Add Learning Skill"
              onAction={() => {
                setNewSkillType("learn");
                setModalError(null);
                setModalOpen(true);
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Skill Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Skill to Portfolio"
        description="Choose whether this is a skill you teach to earn credits, or a goal you want to learn."
      >
        <div className="space-y-4 pt-1">
          {modalError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{modalError}</span>
            </div>
          )}

          {/* Type Toggle */}
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setNewSkillType("teach");
                setModalError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                newSkillType === "teach"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Skill to Teach
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setNewSkillType("learn");
                setModalError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                newSkillType === "learn"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Skill to Learn
              </span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {SKILL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Catalog */}
          <div className="space-y-1.5">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search catalog skills..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>

            {/* Catalog Grid */}
            <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
              {filteredCatalog.length > 0 ? (
                filteredCatalog.map((skill) => {
                  const alreadySelected = userSkills.some(
                    (s) => s.skill_id === skill.id && s.type === newSkillType
                  );
                  return (
                    <div
                      key={skill.id}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/80 flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{skill.name}</span>
                        <span className="text-[10px] text-slate-400 ml-2">({skill.category})</span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant={alreadySelected ? "ghost" : "outline"}
                        disabled={alreadySelected || isSubmitting}
                        onClick={() => handleAddSkill(skill)}
                        className="text-[11px] h-7 px-2.5 font-bold"
                      >
                        {alreadySelected ? "Added" : "Select"}
                      </Button>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center italic">
                  No matching catalog skills found.
                </p>
              )}
            </div>
          </div>

          {/* Custom Skill Input */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Or Add a Custom Skill
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Next.js App Router, Japanese..."
                value={customSkillName}
                onChange={(e) => {
                  setCustomSkillName(e.target.value);
                  setModalError(null);
                }}
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="primary"
                onClick={() => handleAddSkill()}
                disabled={!customSkillName.trim() || isSubmitting}
                className="font-bold shrink-0"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Custom"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
