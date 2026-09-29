/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import {
  profileService,
  storageService,
  skillService,
  availabilityService,
  DAY_INDEX_MAP,
  SLOT_TIME_MAP,
} from "@/lib/supabase/services";
import { AvailabilityInsert } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { SkillCard } from "@/components/ui/skill-card";
import { Avatar } from "@/components/ui/avatar";
import confetti from "canvas-confetti";
import {
  POPULAR_SKILLS,
  SKILL_CATEGORIES,
  AVATAR_OPTIONS,
  DAYS_OF_WEEK,
  TIME_SLOTS,
  SESSION_DURATIONS,
  LOCATIONS,
  TIMEZONES,
  SkillItem,
} from "@/data/mockData";
import {
  Sparkles,
  Search,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  MapPin,
  Globe,
  Upload,
  Coins,
  PartyPopper,
  Plus,
  AlertCircle,
  User,
  Briefcase,
  BookOpen,
  Calendar,
  Loader2,
} from "lucide-react";

const HEADLINE_SUGGESTIONS = [
  "Full Stack Developer",
  "UI/UX Designer",
  "Frontend Engineer",
  "Software Engineer",
  "Product Manager",
  "Data Scientist",
  "CS Student & Learner",
  "Language & Culture Enthusiast",
] as const;

export function OnboardingView() {
  const router = useRouter();
  const {
    onboardingStep,
    setOnboardingStep,
    onboardingData,
    updateOnboardingData,
    setActiveScreen,
    setActiveTab,
    awardWelcomeCredits,
    showToast,
  } = useApp();
  const { user, refreshProfile } = useAuth();

  // Search & category states
  const [teachSearch, setTeachSearch] = useState("");
  const [teachCategory, setTeachCategory] = useState("All");

  const [learnSearch, setLearnSearch] = useState("");
  const [learnCategory, setLearnCategory] = useState("All");

  // Dynamic catalog and loading states
  const [catalogSkills, setCatalogSkills] = useState<SkillItem[]>([...POPULAR_SKILLS]);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Load existing profile & skills from Supabase on mount if authenticated
  useEffect(() => {
    let mounted = true;

    async function loadInitialData() {
      try {
        // 1. Fetch catalog skills from Supabase
        const catRes = await skillService.getAllSkills();
        if (mounted && catRes.data && catRes.data.length > 0) {
          const existingNames = new Set(POPULAR_SKILLS.map((p) => p.name.toLowerCase()));
          const combined = [...POPULAR_SKILLS];
          catRes.data.forEach((s, idx) => {
            if (!existingNames.has(s.name.toLowerCase())) {
              combined.push({
                id: s.id,
                name: s.name,
                category: s.category as SkillItem["category"],
                icon: "Code2",
                learners: `${Math.floor(4 + (idx % 8) * 1.5)}k learners`,
                badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-100",
              });
            }
          });
          setCatalogSkills(combined);
        }

        // 2. Fetch authenticated user data if returning
        if (user?.id) {
          const profileRes = await profileService.getProfile(user.id);
          if (mounted && profileRes.data) {
            const p = profileRes.data;
            updateOnboardingData({
              fullName: p.display_name || user.user_metadata?.full_name || onboardingData.fullName,
              headline: p.headline || "",
              bio: p.bio || "",
              avatarUrl: p.avatar_url || onboardingData.avatarUrl,
              location: p.location || onboardingData.location,
              timezone: p.timezone || onboardingData.timezone,
            });
          }

          const userSkillsRes = await skillService.getUserSkills(user.id);
          if (mounted && userSkillsRes.data && userSkillsRes.data.length > 0) {
            const teach = userSkillsRes.data
              .filter((s) => s.type === "teach")
              .map((s) => s.skill?.name)
              .filter(Boolean) as string[];
            const learn = userSkillsRes.data
              .filter((s) => s.type === "learn")
              .map((s) => s.skill?.name)
              .filter(Boolean) as string[];
            if (teach.length > 0) updateOnboardingData({ teachingSkills: teach });
            if (learn.length > 0) updateOnboardingData({ learningSkills: learn });
          }

          const availRes = await availabilityService.getUserAvailability(user.id);
          if (mounted && availRes.data && availRes.data.length > 0) {
            const daysSet = new Set<string>();
            availRes.data.forEach((slot) => {
              const dayName = Object.keys(DAY_INDEX_MAP).find(
                (k) => DAY_INDEX_MAP[k] === slot.day_of_week
              );
              if (dayName) daysSet.add(dayName);
            });
            if (daysSet.size > 0) {
              updateOnboardingData({ availableDays: Array.from(daysSet) });
            }
          }
        }
      } catch {
        // Non-blocking
      }
    }

    loadInitialData();

    return () => {
      mounted = false;
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Step 3 validation errors
  const [profileErrors, setProfileErrors] = useState<{ fullName?: string; headline?: string; bio?: string }>({});

  // Step 4 validation error
  const [availabilityError, setAvailabilityError] = useState("");

  // Confetti effect on Step 5
  useEffect(() => {
    if (onboardingStep === 5) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#6366f1", "#4f46e5", "#818cf8", "#10b981", "#f59e0b"],
        });
      } catch {
        // Safe fallback
      }
      awardWelcomeCredits();
    }
  }, [onboardingStep, awardWelcomeCredits]);

  // Step 1: toggle teaching skills
  const toggleTeachingSkill = (skillName: string) => {
    const current = [...onboardingData.teachingSkills];
    const index = current.indexOf(skillName);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(skillName);
    }
    updateOnboardingData({ teachingSkills: current });
  };

  const addCustomTeachSkill = () => {
    const trimmed = teachSearch.trim();
    if (!trimmed) return;
    if (!onboardingData.teachingSkills.includes(trimmed)) {
      updateOnboardingData({ teachingSkills: [...onboardingData.teachingSkills, trimmed] });
      showToast(`Added "${trimmed}" to teaching skills!`);
    }
    setTeachSearch("");
  };

  // Step 2: toggle learning skills
  const toggleLearningSkill = (skillName: string) => {
    const current = [...onboardingData.learningSkills];
    const index = current.indexOf(skillName);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(skillName);
    }
    updateOnboardingData({ learningSkills: current });
  };

  const addCustomLearnSkill = () => {
    const trimmed = learnSearch.trim();
    if (!trimmed) return;
    if (!onboardingData.learningSkills.includes(trimmed)) {
      updateOnboardingData({ learningSkills: [...onboardingData.learningSkills, trimmed] });
      showToast(`Added "${trimmed}" to learning goals!`);
    }
    setLearnSearch("");
  };

  // Step 3: Avatar upload handler
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Please choose an image under 5MB.", "error");
      return;
    }

    if (user?.id) {
      setIsUploadingAvatar(true);
      const res = await storageService.uploadAvatar(user.id, file);
      setIsUploadingAvatar(false);

      if (res.data?.publicUrl) {
        updateOnboardingData({ avatarUrl: res.data.publicUrl });
        showToast("Profile photo uploaded to storage successfully!");
        return;
      }
      if (res.error) {
        showToast(res.error, "error");
      }
    }

    // Fallback preview
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        updateOnboardingData({ avatarUrl: event.target.result as string });
        showToast("Profile photo preview updated!");
      }
    };
    reader.readAsDataURL(file);
  };

  // Step 4: Toggle available days
  const toggleDay = (day: string) => {
    setAvailabilityError("");
    const current = [...onboardingData.availableDays];
    const index = current.indexOf(day);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(day);
    }
    updateOnboardingData({ availableDays: current });
  };

  // Step 4: Toggle time slot
  const toggleTimeSlot = (slot: string) => {
    setAvailabilityError("");
    const current = [...onboardingData.preferredSlots];
    const index = current.indexOf(slot);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(slot);
    }
    updateOnboardingData({ preferredSlots: current });
  };

  // Validations & Progression handlers
  const handleNext = () => {
    // Step 1 validation
    if (onboardingStep === 1) {
      if (onboardingData.teachingSkills.length === 0) {
        showToast("Please select at least 1 skill you can teach.", "error");
        return;
      }
    }

    // Step 2 validation
    if (onboardingStep === 2) {
      if (onboardingData.learningSkills.length === 0) {
        showToast("Please select at least 1 skill you want to learn.", "error");
        return;
      }
    }

    // Step 3 validation
    if (onboardingStep === 3) {
      const errors: { fullName?: string; headline?: string; bio?: string } = {};
      if (!onboardingData.fullName.trim() || onboardingData.fullName.trim().length < 2) {
        errors.fullName = "Please enter your full name (at least 2 characters).";
      }
      if (!onboardingData.headline.trim() || onboardingData.headline.trim().length < 3) {
        errors.headline = "Please enter a brief headline (e.g. Student, Designer).";
      }
      if (!onboardingData.bio.trim() || onboardingData.bio.trim().length < 10) {
        errors.bio = "Please write a short bio (at least 10 characters).";
      }

      if (Object.keys(errors).length > 0) {
        setProfileErrors(errors);
        showToast("Please fill out all required profile fields.", "error");
        return;
      }
      setProfileErrors({});
    }

    // Step 4 validation
    if (onboardingStep === 4) {
      if (onboardingData.availableDays.length === 0) {
        setAvailabilityError("Please select at least 1 day you are available.");
        showToast("Please select at least 1 available day.", "error");
        return;
      }
      if (onboardingData.preferredSlots.length === 0) {
        setAvailabilityError("Please select at least 1 preferred time slot.");
        showToast("Please select at least 1 time slot.", "error");
        return;
      }
      setAvailabilityError("");
    }

    if (onboardingStep < 5) {
      setOnboardingStep(onboardingStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (onboardingStep > 1) {
      setOnboardingStep(onboardingStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setActiveScreen("landing");
      router.push("/");
    }
  };

  const handleFinishOnboarding = async () => {
    setIsFinishing(true);

    if (user?.id) {
      try {
        // 1. Persist full profile to Supabase
        await profileService.updateProfile(user.id, {
          display_name: onboardingData.fullName,
          headline: onboardingData.headline,
          bio: onboardingData.bio,
          avatar_url: onboardingData.avatarUrl,
          location: onboardingData.location,
          timezone: onboardingData.timezone,
        });

        // 2. Persist teaching and learning skills to user_skills
        await skillService.syncUserSkills(
          user.id,
          onboardingData.teachingSkills,
          onboardingData.learningSkills
        );

        // 3. Persist availability slots to availability table
        const slots: AvailabilityInsert[] = [];
        for (const day of onboardingData.availableDays) {
          const dayIdx = DAY_INDEX_MAP[day] ?? 1;
          for (const slotName of onboardingData.preferredSlots) {
            const times = SLOT_TIME_MAP[slotName] || { start: "09:00:00", end: "12:00:00" };
            slots.push({
              user_id: user.id,
              day_of_week: dayIdx,
              start_time: times.start,
              end_time: times.end,
            });
          }
        }
        if (slots.length > 0) {
          await availabilityService.syncUserAvailability(user.id, slots);
        }

        await refreshProfile();
      } catch (err) {
        console.warn("[OnboardingView] Supabase sync note:", err);
      }
    }

    setIsFinishing(false);
    showToast("Welcome to your dashboard! 50 Credits have been deposited.");
    setActiveTab("dashboard");
    setActiveScreen("dashboard");
    router.push("/dashboard");
  };

  // Filter skills from dynamic catalog
  const filteredTeachSkills = catalogSkills.filter((s) => {
    const matchesCat = teachCategory === "All" || s.category === teachCategory;
    const matchesQuery = s.name.toLowerCase().includes(teachSearch.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const filteredLearnSkills = catalogSkills.filter((s) => {
    const matchesCat = learnCategory === "All" || s.category === learnCategory;
    const matchesQuery = s.name.toLowerCase().includes(learnSearch.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const stepLabels = [
    "Skills to Teach",
    "Skills to Learn",
    "Create Profile",
    "Set Availability",
    "All Set!",
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Onboarding Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div
            onClick={() => {
              setActiveScreen("landing");
              router.push("/");
            }}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-black text-slate-900 tracking-tight">
              Skill<span className="text-indigo-600">Swap</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
            <span>Step {onboardingStep} of 5</span>
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setActiveScreen("dashboard");
                router.push("/dashboard");
              }}
              className="text-slate-400 hover:text-slate-600 transition-colors hidden sm:inline-block cursor-pointer"
            >
              Skip to Dashboard →
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Progress Bar Component */}
        <div className="mb-8">
          <ProgressIndicator currentStep={onboardingStep} totalSteps={5} stepLabels={stepLabels} />
        </div>

        {/* ================= STEP 1: CHOOSE SKILLS TO TEACH ================= */}
        {onboardingStep === 1 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-2">
                <span>1/5 • Teach</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                What can you <span className="text-indigo-600">teach?</span>
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Select skills you are confident mentoring peers in. You earn 1 credit for every 30 minutes taught.
              </p>
            </div>

            {/* Selected Skills Chips */}
            <div className="mb-6 p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100/80">
              <div className="text-xs font-bold text-indigo-900 mb-2 uppercase tracking-wider flex items-center justify-between">
                <span>Selected Teaching Skills ({onboardingData.teachingSkills.length})</span>
                {onboardingData.teachingSkills.length === 0 && (
                  <span className="text-rose-600 normal-case font-medium">Select at least 1 to continue</span>
                )}
              </div>
              {onboardingData.teachingSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {onboardingData.teachingSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="indigo"
                      size="md"
                      onRemove={() => toggleTeachingSkill(skill)}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No skills selected yet. Choose from below or add custom.</p>
              )}
            </div>

            {/* Search & Custom Skill Input */}
            <div className="space-y-3 mb-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Search or type a skill (e.g. Python, Blender, Golang)..."
                  value={teachSearch}
                  onChange={(e) => setTeachSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomTeachSkill();
                    }
                  }}
                  leftIcon={<Search className="h-4 w-4" />}
                />
                {teachSearch.trim() && (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={addCustomTeachSkill}
                    className="flex-shrink-0 font-bold"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SKILL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setTeachCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                      teachCategory === cat
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Selectable Skill Cards Grid */}
            {filteredTeachSkills.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 max-h-[360px] overflow-y-auto pr-1">
                {filteredTeachSkills.map((skill) => {
                  const isSelected = onboardingData.teachingSkills.includes(skill.name);
                  return (
                    <SkillCard
                      key={skill.id}
                      name={skill.name}
                      category={skill.category}
                      iconName={skill.icon}
                      learners={skill.learners}
                      isSelected={isSelected}
                      onToggle={() => toggleTeachingSkill(skill.name)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-slate-200 mb-8 bg-slate-50/50">
                <p className="text-sm font-semibold text-slate-700">No matching preset skills found for &quot;{teachSearch}&quot;</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">You can add it as a custom teaching skill!</p>
                <Button variant="primary" size="sm" onClick={addCustomTeachSkill}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add &quot;{teachSearch.trim()}&quot; as my skill
                </Button>
              </div>
            )}

            {/* Step 1 Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <Button variant="ghost" onClick={handleBack} className="text-slate-500">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleNext}
                disabled={onboardingData.teachingSkills.length === 0}
                className="font-bold group"
              >
                <span>Continue ({onboardingData.teachingSkills.length} selected)</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: CHOOSE SKILLS TO LEARN ================= */}
        {onboardingStep === 2 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
                <span>2/5 • Learn</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                What do you want to <span className="text-indigo-600">learn?</span>
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Choose the skills or topics you wish to explore. We’ll match you with vetted mentors.
              </p>
            </div>

            {/* Selected Learning Skills Chips */}
            <div className="mb-6 p-4 rounded-2xl bg-blue-50/40 border border-blue-100/80">
              <div className="text-xs font-bold text-blue-900 mb-2 uppercase tracking-wider flex items-center justify-between">
                <span>Target Learning Goals ({onboardingData.learningSkills.length})</span>
                {onboardingData.learningSkills.length === 0 && (
                  <span className="text-rose-600 normal-case font-medium">Select at least 1 to continue</span>
                )}
              </div>
              {onboardingData.learningSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {onboardingData.learningSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="indigo"
                      size="md"
                      onRemove={() => toggleLearningSkill(skill)}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No skills selected yet. Choose from below or add custom.</p>
              )}
            </div>

            {/* Search & Custom Input */}
            <div className="space-y-3 mb-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Search or type learning goals (e.g. Figma, Guitar, Rust)..."
                  value={learnSearch}
                  onChange={(e) => setLearnSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomLearnSkill();
                    }
                  }}
                  leftIcon={<Search className="h-4 w-4" />}
                />
                {learnSearch.trim() && (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={addCustomLearnSkill}
                    className="flex-shrink-0 font-bold"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SKILL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setLearnCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                      learnCategory === cat
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Selectable Skill Cards Grid */}
            {filteredLearnSkills.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 max-h-[360px] overflow-y-auto pr-1">
                {filteredLearnSkills.map((skill) => {
                  const isSelected = onboardingData.learningSkills.includes(skill.name);
                  return (
                    <SkillCard
                      key={skill.id}
                      name={skill.name}
                      category={skill.category}
                      iconName={skill.icon}
                      learners={skill.learners}
                      isSelected={isSelected}
                      onToggle={() => toggleLearningSkill(skill.name)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-slate-200 mb-8 bg-slate-50/50">
                <p className="text-sm font-semibold text-slate-700">No matching preset skills found for &quot;{learnSearch}&quot;</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">You can add it as a custom learning goal!</p>
                <Button variant="primary" size="sm" onClick={addCustomLearnSkill}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add &quot;{learnSearch.trim()}&quot; as my goal
                </Button>
              </div>
            )}

            {/* Step 2 Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <Button variant="ghost" onClick={handleBack} className="text-slate-500">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleNext}
                disabled={onboardingData.learningSkills.length === 0}
                className="font-bold group"
              >
                <span>Continue ({onboardingData.learningSkills.length} selected)</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: CREATE PROFILE ================= */}
        {onboardingStep === 3 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-bold mb-2">
                <span>3/5 • Profile</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Create your <span className="text-indigo-600">peer profile</span>
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Let fellow learners know who you are and what drives your passion for learning.
              </p>
            </div>

            {/* Avatar Selector UI */}
            <div className="mb-8 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Choose or Upload Profile Photo
                </label>
                <span className="text-[11px] font-medium text-slate-500">
                  Select an avatar or upload your own
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Avatar src={onboardingData.avatarUrl} size="xl" className="ring-4 ring-indigo-500/20 shadow-md" />

                <div className="flex flex-wrap items-center gap-2.5">
                  {AVATAR_OPTIONS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => updateOnboardingData({ avatarUrl: url })}
                      className={`h-12 w-12 rounded-full overflow-hidden border-2 transition-all cursor-pointer relative bg-slate-100 ${
                        onboardingData.avatarUrl === url
                          ? "border-indigo-600 ring-2 ring-indigo-500/30 scale-105 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100"
                      }`}
                      title={`Select Avatar ${idx + 1}`}
                    >
                      <img
                        src={url}
                        alt={`Avatar ${idx + 1}`}
                        className="h-full w-full object-cover"
                        loading="eager"
                      />
                    </button>
                  ))}

                  <label
                    className={`h-12 px-4 rounded-full border border-dashed border-indigo-300 hover:border-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-700 cursor-pointer transition-colors shadow-xs ${
                      isUploadingAvatar ? "opacity-60 pointer-events-none" : ""
                    }`}
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    <span>{isUploadingAvatar ? "Uploading..." : "Upload Photo"}</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      disabled={isUploadingAvatar}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Name & Headline with Suggestions */}
            <div className="space-y-4 mb-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name *"
                  value={onboardingData.fullName}
                  onChange={(e) => {
                    updateOnboardingData({ fullName: e.target.value });
                    if (profileErrors.fullName) setProfileErrors({ ...profileErrors, fullName: undefined });
                  }}
                  placeholder="e.g. Alex Chen"
                  error={profileErrors.fullName}
                  leftIcon={<User className="h-4 w-4" />}
                  required
                />
                <Input
                  label="Professional Headline *"
                  value={onboardingData.headline}
                  onChange={(e) => {
                    updateOnboardingData({ headline: e.target.value });
                    if (profileErrors.headline) setProfileErrors({ ...profileErrors, headline: undefined });
                  }}
                  placeholder="e.g. Full Stack Developer & UI Designer"
                  error={profileErrors.headline}
                  leftIcon={<Briefcase className="h-4 w-4" />}
                  required
                />
              </div>

              {/* Headline Suggestions Chips */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Suggested Headlines (click to apply):</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {HEADLINE_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        updateOnboardingData({ headline: suggestion });
                        if (profileErrors.headline) setProfileErrors({ ...profileErrors, headline: undefined });
                      }}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        onboardingData.headline === suggestion
                          ? "bg-indigo-600 text-white border-indigo-600 font-semibold shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-700"
                      }`}
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="mb-6 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Short Bio (Min 10 characters) *
                </label>
                <span
                  className={`text-[11px] font-semibold ${
                    onboardingData.bio.trim().length >= 10 ? "text-emerald-600 font-bold" : "text-slate-400"
                  }`}
                >
                  {onboardingData.bio.trim().length}/10 min characters
                </span>
              </div>
              <textarea
                value={onboardingData.bio}
                onChange={(e) => {
                  updateOnboardingData({ bio: e.target.value });
                  if (profileErrors.bio) setProfileErrors({ ...profileErrors, bio: undefined });
                }}
                rows={3}
                className={`w-full p-3.5 text-sm text-slate-900 bg-white border rounded-xl focus:ring-2 outline-none transition-all resize-none placeholder:text-slate-400 ${
                  profileErrors.bio
                    ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20"
                    : "border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20 shadow-xs"
                }`}
                placeholder="Write your bio here: tell others about your background, what skills you love sharing, what you want to learn, and the kinds of peer exchanges you're looking for..."
              />
              {profileErrors.bio ? (
                <p className="text-xs font-medium text-rose-600">{profileErrors.bio}</p>
              ) : (
                <p className="text-[11px] text-slate-400">
                  💡 Tip: Share what you&apos;re currently working on or your learning goals to connect with the best peer matches.
                </p>

              )}
            </div>

            {/* Location and Timezone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <Select
                label="Location"
                leftIcon={<MapPin className="h-4 w-4" />}
                value={onboardingData.location}
                onChange={(e) => updateOnboardingData({ location: e.target.value })}
                options={LOCATIONS}
              />
              <Select
                label="Timezone"
                leftIcon={<Globe className="h-4 w-4" />}
                value={onboardingData.timezone}
                onChange={(e) => updateOnboardingData({ timezone: e.target.value })}
                options={TIMEZONES}
              />
            </div>

            {/* Step 3 Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <Button variant="ghost" onClick={handleBack} className="text-slate-500">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleNext}
                className="font-bold group"
              >
                <span>Save & Continue</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: SET AVAILABILITY & DURATION ================= */}
        {onboardingStep === 4 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2">
                <span>4/5 • Availability</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                When are you <span className="text-indigo-600">available</span> to swap?
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Set your recurring availability window so peers can schedule sessions easily.
              </p>
            </div>

            {availabilityError && (
              <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-semibold">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{availabilityError}</span>
              </div>
            )}

            {/* Days of the Week Pills */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Available Days of the Week *
                </label>
                <span className="text-xs font-semibold text-indigo-600">
                  {onboardingData.availableDays.length} days selected
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = onboardingData.availableDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`p-3 rounded-2xl text-xs font-bold border transition-all text-center cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20 scale-102"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      <div className="text-[10px] uppercase opacity-70 mb-0.5">{day.slice(0, 3)}</div>
                      <div className="truncate">{day.slice(0, 3)}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time of Day Slots */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Preferred Time Slots *
                </label>
                <span className="text-xs font-semibold text-indigo-600">
                  {onboardingData.preferredSlots.length} slots selected
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TIME_SLOTS.map((slot) => {
                  const isSelected = onboardingData.preferredSlots.includes(slot);
                  return (
                    <div
                      key={slot}
                      onClick={() => toggleTimeSlot(slot)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Clock className={`h-4 w-4 ${isSelected ? "text-indigo-600" : "text-slate-400"}`} />
                        <span className={`text-xs font-bold ${isSelected ? "text-indigo-950" : "text-slate-800"}`}>
                          {slot}
                        </span>
                      </div>
                      <div
                        className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                          isSelected ? "bg-indigo-600 border-indigo-600" : "border-slate-300"
                        }`}
                      >
                        {isSelected && <div className="h-1.5 w-1.5 bg-white rounded-full" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Session Duration Selector */}
            <div className="mb-8">
              <Select
                label="Preferred Session Duration"
                leftIcon={<Clock className="h-4 w-4" />}
                value={onboardingData.sessionDuration}
                onChange={(e) => updateOnboardingData({ sessionDuration: e.target.value })}
                options={SESSION_DURATIONS}
              />
            </div>

            {/* Step 4 Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <Button variant="ghost" onClick={handleBack} className="text-slate-500">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleNext}
                disabled={onboardingData.availableDays.length === 0 || onboardingData.preferredSlots.length === 0}
                className="font-bold group"
              >
                <span>Review & Complete</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>
          </div>
        )}

        {/* ================= STEP 5: ONBOARDING COMPLETED ================= */}
        {onboardingStep === 5 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Celebration Icon Badge */}
            <div className="inline-flex h-20 w-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white items-center justify-center shadow-lg shadow-emerald-500/25 mb-6 animate-bounce">
              <PartyPopper className="h-10 w-10" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-3">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Step 5/5 • Onboarding Completed!</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
              You’re all set, {onboardingData.fullName.split(" ")[0] || "Learner"}! 🎉
            </h2>
            <p className="text-slate-600 max-w-md mx-auto text-sm mb-8">
              Your SkillSwap profile is ready to discover mutual peer learning opportunities.
            </p>

            {/* Welcome Bonus Credits Banner */}
            <div className="max-w-md mx-auto p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-orange-500/15 border border-amber-300 text-amber-950 flex items-center justify-between mb-8 shadow-xs">
              <div className="flex items-center gap-3.5 text-left">
                <div className="h-11 w-11 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-sm flex-shrink-0">
                  <Coins className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">Welcome Reward</div>
                  <div className="text-base font-black text-slate-900">+50 Free Skill Credits Added!</div>
                </div>
              </div>
              <span className="text-xs font-bold bg-amber-500 text-white px-2.5 py-1 rounded-full shadow-xs">CLAIMED</span>
            </div>

            {/* Summary Recap Card */}
            <div className="max-w-lg mx-auto bg-slate-50 rounded-2xl border border-slate-200/80 p-6 text-left space-y-4 mb-8">
              {/* Profile info preview */}
              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-200/80">
                <Avatar src={onboardingData.avatarUrl} size="lg" isOnline={true} />
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{onboardingData.fullName}</h4>
                  <p className="text-xs text-indigo-600 font-semibold truncate">{onboardingData.headline}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{onboardingData.location}</p>
                </div>
              </div>

              {/* Teaching skills recap */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                  <span>You Can Teach ({onboardingData.teachingSkills.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {onboardingData.teachingSkills.map((s) => (
                    <Badge key={s} variant="indigo" size="sm">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Learning skills recap */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  <span>You Want to Learn ({onboardingData.learningSkills.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {onboardingData.learningSkills.map((s) => (
                    <Badge key={s} variant="secondary" size="sm">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Availability recap */}
              <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-bold text-slate-900">Days:</span>{" "}
                  {onboardingData.availableDays.map((d) => d.slice(0, 3)).join(", ")}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-bold text-slate-900">Duration:</span> {onboardingData.sessionDuration}
                </div>
              </div>
            </div>

            {/* Final CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={handleFinishOnboarding}
                disabled={isFinishing}
                className="w-full sm:w-auto px-8 font-extrabold shadow-lg shadow-indigo-500/25 group"
              >
                {isFinishing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span>Launching Dashboard...</span>
                  </>
                ) : (
                  <>
                    <span>Launch My Dashboard</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
