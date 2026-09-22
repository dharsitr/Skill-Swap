"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/states/EmptyState";
import { MOCK_MENTORS, POPULAR_SKILLS, MentorProfile } from "@/data/mockData";
import { SKILL_CATEGORIES } from "@/constants/config";
import { Search, Star, Compass } from "lucide-react";

export default function DiscoverPage() {
  const { userCredits, showToast } = useApp();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("");

  const filteredMentors = MOCK_MENTORS.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.teaches.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
      m.wantsToLearn.some((l) => l.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory =
      category === "All" ||
      m.teaches.some((t) => {
        const skill = POPULAR_SKILLS.find((ps) => ps.name === t);
        return skill?.category === category;
      });
    return matchesSearch && matchesCategory;
  });

  const handleOpenSwapModal = (mentor: MentorProfile) => {
    setSelectedMentor(mentor);
    setSelectedTopic(mentor.teaches[0] || "General Mentorship");
    setModalOpen(true);
  };

  const handleConfirmSwap = () => {
    setModalOpen(false);
    showToast(`Swap request sent to ${selectedMentor?.name} for ${selectedTopic}!`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Discover Mentors & Skills"
        description="Connect with vetted peer experts ready to swap skills 1-on-1."
      />

      {/* Search & Category Pills */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by mentor name, skill (e.g. React, UI/UX, Python)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          {SKILL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                category === cat
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Mentors Grid or Empty State */}
      {filteredMentors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredMentors.map((mentor) => (
            <Card key={mentor.id} className="rounded-2xl border-slate-200 p-6 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <Avatar src={mentor.avatar} alt={mentor.name} size="lg" isOnline={true} />
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{mentor.name}</h4>
                    <p className="text-xs text-indigo-600 font-semibold">{mentor.headline}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-bold text-slate-700">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {mentor.rating}
                      </span>
                      <span>•</span>
                      <span>{mentor.swapsCompleted} swaps</span>
                      <span>•</span>
                      <span>{mentor.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills breakdown */}
              <div className="space-y-2 mb-4 text-xs">
                <div>
                  <span className="font-bold text-slate-600 block mb-1">Teaches:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {mentor.teaches.map((t) => (
                      <Badge key={t} variant="indigo" size="sm">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-600 block mb-1">Looking to learn:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {mentor.wantsToLearn.map((l) => (
                      <Badge key={l} variant="default" size="sm">
                        {l}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Available: {mentor.availableDays.join(", ")}
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenSwapModal(mentor)}
                  className="font-bold"
                >
                  Request Swap
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Compass className="h-6 w-6" />}
          title={`No mentors found for "${search}"`}
          description="Try broadening your search query or selecting another skill category."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch("");
            setCategory("All");
          }}
        />
      )}

      {/* Swap Request Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Request 1-on-1 Skill Swap"
        description={`Send a session exchange request to ${selectedMentor?.name}.`}
      >
        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs text-slate-700 space-y-1">
            <div><strong>Topic:</strong> {selectedTopic}</div>
            <div><strong>Cost:</strong> 1 Skill Credit (30 mins)</div>
            <div><strong>Your Balance:</strong> {userCredits} Credits Available</div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Note to mentor (optional)
            </label>
            <textarea
              rows={2}
              placeholder="Hi! I'd love to learn from your experience with this topic..."
              className="w-full p-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-indigo-500 resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmSwap} className="font-bold">
              Send Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
