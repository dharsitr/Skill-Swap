import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMySkills } from '@/hooks/useSkills';
import { SkillCard } from '@/components/skills/SkillCard';
import { AddSkillModal } from '@/components/skills/AddSkillModal';
import { EditSkillModal } from '@/components/skills/EditSkillModal';
import { DeleteSkillDialog } from '@/components/skills/DeleteSkillDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sparkles,
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
  User,
  GraduationCap,
  ArrowLeft,
  Lightbulb,
} from 'lucide-react';
import type { SkillRelationshipType, UserSkill } from '@/types/api';

export const SkillProfilePage: React.FC = () => {
  const { data: skillsData, isLoading, isError, error, refetch } = useMySkills();

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [activeRelationship, setActiveRelationship] = useState<SkillRelationshipType>('TEACH');
  const [editingSkill, setEditingSkill] = useState<UserSkill | null>(null);
  const [deletingSkill, setDeletingSkill] = useState<UserSkill | null>(null);

  const teachingSkills = skillsData?.teaching || [];
  const learningSkills = skillsData?.learning || [];
  const allUserSkills = [...teachingSkills, ...learningSkills];

  const handleOpenAdd = (type: SkillRelationshipType) => {
    setActiveRelationship(type);
    setAddModalOpen(true);
  };

  const handleOpenEdit = (skill: UserSkill) => {
    setEditingSkill(skill);
  };

  const handleOpenDelete = (skill: UserSkill) => {
    setDeletingSkill(skill);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header & Sub-navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link to="/profile" className="text-[#94A3B8] hover:text-[#F8F5ED] inline-flex items-center gap-1 text-xs transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Personal Profile
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8F5ED] font-display">Student Skill Profile</h1>
          <p className="text-xs sm:text-sm text-[#94A3B8]">
            Manage the topics you can mentor peers on and the skills you want to learn.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-[#111827] p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <Link to="/profile">
            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-[#94A3B8] hover:text-[#F8F5ED]">
              <User className="w-3.5 h-3.5" />
              Personal Info
            </Button>
          </Link>
          <Button variant="default" size="sm" className="h-8 text-xs gap-1.5 font-semibold">
            <GraduationCap className="w-3.5 h-3.5" />
            Skills Catalog Profile
          </Button>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <Alert variant="destructive" className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="text-xs">
              {error instanceof Error ? error.message : 'Failed to load your skill profile.'}
            </AlertDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-7 text-xs gap-1 border-red-500/40 text-red-400">
            <RefreshCw className="w-3 h-3" />
            Try Again
          </Button>
        </Alert>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 text-[#94A3B8]">
          <Loader2 className="w-8 h-8 animate-spin text-[#10B981]" />
          <p className="text-xs font-medium">Loading your skill portfolio...</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* SECTION 1: Skills I Teach */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111827] border border-[rgba(212,175,106,0.22)] p-4 sm:p-5 rounded-2xl shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#F8F5ED] font-display">Skills I Teach</h2>
                    <Badge variant="default" className="text-[11px] font-mono">
                      {teachingSkills.length}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#94A3B8]">
                    Knowledge you can share with fellow students in peer learning sessions
                  </p>
                </div>
              </div>

              <Button
                variant="default"
                size="sm"
                onClick={() => handleOpenAdd('TEACH')}
                className="gap-1.5 text-xs font-semibold shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Teaching Skill
              </Button>
            </div>

            {teachingSkills.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teachingSkills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    userSkill={skill}
                    onEdit={handleOpenEdit}
                    onDelete={handleOpenDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-[#111827] border border-slate-800 space-y-2">
                <p className="text-xs text-[#94A3B8]">You haven&apos;t added any teaching skills yet.</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleOpenAdd('TEACH')}
                  className="text-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#10B981] mr-1" />
                  Add Your First Teaching Skill
                </Button>
              </div>
            )}
          </section>

          {/* SECTION 2: Skills I Want to Learn */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111827] border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#F8F5ED] font-display">Skills I Want to Learn</h2>
                    <Badge variant="info" className="text-[11px] font-mono">
                      {learningSkills.length}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#94A3B8]">
                    Topics and competencies you are eager to master from peers
                  </p>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOpenAdd('LEARN')}
                className="gap-1.5 text-xs font-semibold shrink-0"
              >
                <Plus className="w-4 h-4 text-[#38BDF8]" />
                Add Learning Goal
              </Button>
            </div>

            {learningSkills.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {learningSkills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    userSkill={skill}
                    onEdit={handleOpenEdit}
                    onDelete={handleOpenDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-[#111827] border border-slate-800 space-y-2">
                <p className="text-xs text-[#94A3B8]">You haven&apos;t added any learning goals yet.</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleOpenAdd('LEARN')}
                  className="text-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#38BDF8] mr-1" />
                  Add Your First Learning Goal
                </Button>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Modals */}
      <AddSkillModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        relationshipType={activeRelationship}
        existingSkills={allUserSkills}
      />

      <EditSkillModal
        isOpen={Boolean(editingSkill)}
        onClose={() => setEditingSkill(null)}
        userSkill={editingSkill}
      />

      <DeleteSkillDialog
        isOpen={Boolean(deletingSkill)}
        onClose={() => setDeletingSkill(null)}
        userSkill={deletingSkill}
      />
    </div>
  );
};
