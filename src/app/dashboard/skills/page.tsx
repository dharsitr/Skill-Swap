"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/states/EmptyState";
import { Plus, Trash2, GraduationCap } from "lucide-react";

export default function MySkillsPage() {
  const { onboardingData, updateOnboardingData, showToast } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillType, setNewSkillType] = useState<"teach" | "learn">("teach");

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkillName.trim();
    if (!trimmed) return;

    if (newSkillType === "teach") {
      if (!onboardingData.teachingSkills.includes(trimmed)) {
        updateOnboardingData({ teachingSkills: [...onboardingData.teachingSkills, trimmed] });
        showToast(`Added "${trimmed}" to teaching skills!`);
      }
    } else {
      if (!onboardingData.learningSkills.includes(trimmed)) {
        updateOnboardingData({ learningSkills: [...onboardingData.learningSkills, trimmed] });
        showToast(`Added "${trimmed}" to learning goals!`);
      }
    }
    setNewSkillName("");
    setModalOpen(false);
  };

  const removeTeachingSkill = (skill: string) => {
    updateOnboardingData({ teachingSkills: onboardingData.teachingSkills.filter((s) => s !== skill) });
    showToast(`Removed "${skill}" from teaching skills.`);
  };

  const removeLearningSkill = (skill: string) => {
    updateOnboardingData({ learningSkills: onboardingData.learningSkills.filter((s) => s !== skill) });
    showToast(`Removed "${skill}" from learning goals.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <PageHeader
        title="My Skills Portfolio"
        description="Manage the disciplines you share and the skills you are actively mastering."
        action={
          <Button variant="primary" size="md" onClick={() => setModalOpen(true)} className="font-bold shadow-xs">
            <Plus className="h-4 w-4 mr-1.5" />
            Add New Skill
          </Button>
        }
      />

      {/* Skills You Teach */}
      <Card className="p-6 rounded-3xl border-slate-200">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
            <span>Skills You Teach ({onboardingData.teachingSkills.length})</span>
          </CardTitle>
          <p className="text-xs text-slate-500">
            You earn 1 credit per 30 minutes mentoring peers in these areas.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {onboardingData.teachingSkills.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {onboardingData.teachingSkills.map((skill) => (
                <div
                  key={skill}
                  className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      {skill.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">{skill}</div>
                      <div className="text-[11px] text-indigo-600 font-semibold">Active Mentor</div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeTeachingSkill(skill)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer"
                    title="Remove skill"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<GraduationCap className="h-6 w-6" />}
              title="No teaching skills added"
              description="Add skills you are confident mentoring others in to start earning credits."
              actionLabel="Add Teaching Skill"
              onAction={() => {
                setNewSkillType("teach");
                setModalOpen(true);
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Skills You Want to Learn */}
      <Card className="p-6 rounded-3xl border-slate-200">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
            <span>Skills You Want to Learn ({onboardingData.learningSkills.length})</span>
          </CardTitle>
          <p className="text-xs text-slate-500">
            We match you with peers offering sessions for these topics.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {onboardingData.learningSkills.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {onboardingData.learningSkills.map((skill) => (
                <div
                  key={skill}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                      {skill.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">{skill}</div>
                      <div className="text-[11px] text-slate-500 font-semibold">Learning Target</div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeLearningSkill(skill)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer"
                    title="Remove skill"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<GraduationCap className="h-6 w-6" />}
              title="No learning skills selected"
              description="Choose target topics you are excited to explore."
              actionLabel="Add Learning Skill"
              onAction={() => {
                setNewSkillType("learn");
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
        description="Add a skill you can teach to earn credits, or a topic you want to learn."
      >
        <form onSubmit={handleAddSkill} className="space-y-4 pt-2">
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setNewSkillType("teach")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                newSkillType === "teach" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500"
              }`}
            >
              Skill to Teach
            </button>
            <button
              type="button"
              onClick={() => setNewSkillType("learn")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                newSkillType === "learn" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500"
              }`}
            >
              Skill to Learn
            </button>
          </div>

          <Input
            label="Skill Name"
            placeholder="e.g. Rust, UI Prototyping, Spanish..."
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            required
            autoFocus
          />

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="font-bold">
              Add to Portfolio
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
