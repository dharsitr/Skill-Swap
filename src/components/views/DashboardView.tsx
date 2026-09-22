"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Sidebar } from "@/components/shared/Sidebar";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import {
  POPULAR_SKILLS,
  SKILL_CATEGORIES,
  MOCK_MENTORS,
  MentorProfile,
  LOCATIONS,
  TIMEZONES,
} from "@/data/mockData";
import {
  Bell,
  ChevronDown,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  Search,
  Video,
  CheckCircle2,
  Menu,
  Plus,
  Send,
  Star,
  MapPin,
  Globe,
  Trash2,
  User,
  Briefcase,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

export function DashboardView() {
  const {
    onboardingData,
    updateOnboardingData,
    userCredits,
    sessions,
    cancelSession,
    conversations,
    sendMessage,
    transactions,
    showToast,
    setActiveScreen,
    activeTab,
    setActiveTab,
  } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modals
  const [activeModal, setActiveModal] = useState<"wallet" | "session" | "notifications" | "requestSwap" | "addSkill" | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");

  // Discover state
  const [discoverSearch, setDiscoverSearch] = useState("");
  const [discoverCategory, setDiscoverCategory] = useState("All");

  // My Skills state
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillType, setNewSkillType] = useState<"teach" | "learn">("teach");

  // Messaging state
  const [selectedConvId, setSelectedConvId] = useState<string>(conversations[0]?.id || "conv-alex");
  const [messageInput, setMessageInput] = useState<string>("");

  // Settings form state
  const [settingsName, setSettingsName] = useState(onboardingData.fullName);
  const [settingsHeadline, setSettingsHeadline] = useState(onboardingData.headline);
  const [settingsBio, setSettingsBio] = useState(onboardingData.bio);
  const [settingsLocation, setSettingsLocation] = useState(onboardingData.location);
  const [settingsTimezone, setSettingsTimezone] = useState(onboardingData.timezone);

  const activeConversation = conversations.find((c) => c.id === selectedConvId) || conversations[0];

  // Request swap modal trigger
  const handleOpenSwapModal = (mentor: MentorProfile) => {
    setSelectedPartner(mentor.name);
    setSelectedTopic(mentor.teaches[0] || "General Mentorship");
    setActiveModal("requestSwap");
  };

  const handleConfirmSwap = () => {
    setActiveModal(null);
    showToast(`Swap request sent to ${selectedPartner} for ${selectedTopic}!`);
  };

  // Add Skill handler
  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    if (newSkillType === "teach") {
      updateOnboardingData({ teachingSkills: [...onboardingData.teachingSkills, newSkillName.trim()] });
      showToast(`Added "${newSkillName.trim()}" to teaching skills!`);
    } else {
      updateOnboardingData({ learningSkills: [...onboardingData.learningSkills, newSkillName.trim()] });
      showToast(`Added "${newSkillName.trim()}" to learning goals!`);
    }
    setNewSkillName("");
    setActiveModal(null);
  };

  // Save Settings handler
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateOnboardingData({
      fullName: settingsName,
      headline: settingsHeadline,
      bio: settingsBio,
      location: settingsLocation,
      timezone: settingsTimezone,
    });
    showToast("Profile settings saved successfully!");
  };

  // Filter mentors
  const filteredMentors = MOCK_MENTORS.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(discoverSearch.toLowerCase()) ||
      m.teaches.some((t) => t.toLowerCase().includes(discoverSearch.toLowerCase())) ||
      m.wantsToLearn.some((l) => l.toLowerCase().includes(discoverSearch.toLowerCase()));
    const matchesCategory =
      discoverCategory === "All" ||
      m.teaches.some((t) => {
        const skill = POPULAR_SKILLS.find((ps) => ps.name === t);
        return skill?.category === discoverCategory;
      });
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        className="hidden md:flex"
      />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-64 bg-white h-full shadow-2xl z-10">
            <Sidebar
              activeTab={activeTab}
              onSelectTab={(tab) => {
                setActiveTab(tab);
                setSidebarOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-600 hover:text-slate-900 md:hidden rounded-lg hover:bg-slate-100 cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span className="text-slate-600">SkillSwap</span>
              <span>/</span>
              <span className="text-indigo-600 font-bold capitalize">
                {activeTab.replace("-", " ")}
              </span>
            </div>
          </div>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button
              onClick={() => setActiveModal("notifications")}
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white" />
            </button>

            {/* User Profile Chip */}
            <div
              onClick={() => setActiveTab("settings")}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer select-none"
            >
              <Avatar
                src={onboardingData.avatarUrl}
                alt={onboardingData.fullName}
                size="sm"
                isOnline={true}
              />
              <span className="text-xs font-bold text-slate-900 hidden sm:inline-block">
                {onboardingData.fullName || "Dharsit"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </header>

        {/* ================= SUB-PAGES BODY ================= */}
        <div className="p-4 sm:p-8 max-w-6xl w-full mx-auto space-y-8 flex-1">

          {/* TAB 1: MAIN DASHBOARD OVERVIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Greeting */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Good morning, {onboardingData.fullName.split(" ")[0] || "Dharsit"} 👋
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Keep learning, keep growing. You have {sessions.filter((s) => s.status === "upcoming").length} upcoming sessions.
                </p>
              </div>

              {/* Your Credits Banner */}
              <Card className="rounded-3xl border-slate-200/90 shadow-sm p-6 sm:p-8 bg-gradient-to-br from-white via-indigo-50/25 to-violet-50/20 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                      Your Available Credits
                    </span>
                    <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <span>{userCredits}</span>
                      <span className="text-lg font-bold text-indigo-600">Credits</span>
                    </div>
                    <button
                      onClick={() => setActiveTab("wallet")}
                      className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 cursor-pointer group"
                    >
                      <span>View Transaction History</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-300 flex items-center justify-center text-white shadow-lg shadow-amber-500/25 flex-shrink-0 text-3xl sm:text-4xl">
                    🪙
                  </div>
                </div>
              </Card>

              {/* Upcoming Sessions Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Upcoming Sessions</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab("sessions")}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                  >
                    View all ({sessions.length}) →
                  </button>
                </div>

                <div className="space-y-3">
                  {sessions.slice(0, 2).map((sess) => (
                    <Card
                      key={sess.id}
                      className="rounded-2xl border-slate-200/90 hover:border-indigo-300 hover:shadow-md hover:shadow-slate-100 transition-all p-4 sm:p-5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar src={sess.partnerAvatar} alt={sess.partnerName} size="md" isOnline={true} />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-bold text-slate-900">{sess.topic}</h4>
                              <Badge
                                variant={sess.role === "teaching" ? "indigo" : "secondary"}
                                size="sm"
                              >
                                {sess.role === "teaching" ? "Teaching" : "Learning"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span>with <strong className="text-slate-700">{sess.partnerName}</strong></span>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-medium text-indigo-600">
                                <Clock className="h-3 w-3" />
                                {sess.time}
                              </span>
                              <span>•</span>
                              <span>{sess.duration}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setSelectedPartner(sess.partnerName);
                              setActiveModal("session");
                            }}
                            className="font-bold shadow-xs"
                          >
                            <Video className="h-3.5 w-3.5 mr-1.5" />
                            Join Call
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>

              {/* Recommended For You Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recommended for you</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab("discover")}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                  >
                    Explore all skills →
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {POPULAR_SKILLS.slice(0, 4).map((skill) => (
                    <Card
                      key={skill.id}
                      className="rounded-2xl border-slate-200/90 hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-500/5 transition-all p-5 flex flex-col justify-between group cursor-pointer"
                      onClick={() => {
                        setSelectedPartner("Community Mentor");
                        setSelectedTopic(skill.name);
                        setActiveModal("requestSwap");
                      }}
                    >
                      <div>
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm mb-3 group-hover:scale-105 transition-transform">
                          {skill.name.slice(0, 2).toUpperCase()}
                        </div>
                        <h5 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {skill.name}
                        </h5>
                        <p className="text-xs text-slate-400 mt-1">{skill.learners}</p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-500">{skill.category}</span>
                        <span className="font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                          Swap →
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: DISCOVER MENTORS & SKILLS */}
          {activeTab === "discover" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Discover Mentors & Skills
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Connect with peer experts ready to swap their skills 1-on-1.
                </p>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Search by mentor name, skill (e.g. React, UI/UX, Python)..."
                    value={discoverSearch}
                    onChange={(e) => setDiscoverSearch(e.target.value)}
                    leftIcon={<Search className="h-4 w-4" />}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {SKILL_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setDiscoverCategory(cat)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        discoverCategory === cat
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mentors Grid */}
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

                    {/* Teaches */}
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

                    {/* Action */}
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
            </div>
          )}

          {/* TAB 3: MY SKILLS */}
          {activeTab === "my-skills" && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    My Skills Portfolio
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Manage the skills you share and the disciplines you are currently mastering.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setActiveModal("addSkill")}
                  className="font-bold shadow-xs"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add New Skill
                </Button>
              </div>

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
                          onClick={() => {
                            const updated = onboardingData.teachingSkills.filter((s) => s !== skill);
                            updateOnboardingData({ teachingSkills: updated });
                            showToast(`Removed "${skill}" from teaching skills.`);
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer"
                          title="Remove skill"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Skills You Want To Learn */}
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
                          onClick={() => {
                            const updated = onboardingData.learningSkills.filter((s) => s !== skill);
                            updateOnboardingData({ learningSkills: updated });
                            showToast(`Removed "${skill}" from learning targets.`);
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer"
                          title="Remove skill"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 4: SESSIONS */}
          {activeTab === "sessions" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Sessions Schedule
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Manage your upcoming 1-on-1 knowledge swaps and view past session history.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setActiveTab("discover")}
                  className="font-bold"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Book New Session
                </Button>
              </div>

              {/* Sessions List */}
              <div className="space-y-3">
                {sessions.map((sess) => (
                  <Card key={sess.id} className="p-5 rounded-2xl border-slate-200 hover:shadow-sm transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Avatar src={sess.partnerAvatar} size="md" isOnline={sess.status === "upcoming"} />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-bold text-slate-900">{sess.topic}</h4>
                            <Badge
                              variant={sess.role === "teaching" ? "indigo" : "secondary"}
                              size="sm"
                            >
                              {sess.role === "teaching" ? "Teaching" : "Learning"}
                            </Badge>
                            <Badge
                              variant={sess.status === "upcoming" ? "success" : "default"}
                              size="sm"
                            >
                              {sess.status === "upcoming" ? "Upcoming" : "Completed"}
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-3">
                            <span>with <strong className="text-slate-700">{sess.partnerName}</strong></span>
                            <span>•</span>
                            <span className="font-semibold text-indigo-600 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {sess.time}
                            </span>
                            <span>•</span>
                            <span>{sess.duration}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {sess.status === "upcoming" ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cancelSession(sess.id)}
                              className="text-rose-600 hover:bg-rose-50"
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setSelectedPartner(sess.partnerName);
                                setActiveModal("session");
                              }}
                              className="font-bold shadow-xs"
                            >
                              <Video className="h-3.5 w-3.5 mr-1.5" />
                              Join Room
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">Completed</span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: MESSAGES (INTERACTIVE CHAT) */}
          {activeTab === "messages" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Messages & Swap Chat
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Coordinate session agendas and exchange preparation material with your peers.
                </p>
              </div>

              {/* Chat Container */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 h-[520px] overflow-hidden">
                {/* Conversation List */}
                <div className="border-r border-slate-200 flex flex-col h-full bg-slate-50/50">
                  <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-900 flex items-center justify-between">
                    <span>Conversations</span>
                    <Badge variant="indigo" size="sm">{conversations.length}</Badge>
                  </div>
                  <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                    {conversations.map((conv) => {
                      const isSelected = conv.id === selectedConvId;
                      return (
                        <div
                          key={conv.id}
                          onClick={() => setSelectedConvId(conv.id)}
                          className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                            isSelected ? "bg-white border-l-4 border-indigo-600 shadow-xs" : "hover:bg-slate-100/70"
                          }`}
                        >
                          <Avatar src={conv.peerAvatar} size="md" isOnline={true} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 truncate">{conv.peerName}</span>
                              <span className="text-[10px] text-slate-400">{conv.lastMessageTime}</span>
                            </div>
                            <p className="text-xs text-slate-500 truncate mt-0.5">{conv.lastMessage}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Active Chat Thread */}
                <div className="md:col-span-2 flex flex-col h-full bg-white">
                  {/* Thread Header */}
                  <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                      <Avatar src={activeConversation.peerAvatar} size="sm" isOnline={true} />
                      <div>
                        <div className="text-xs font-bold text-slate-900">{activeConversation.peerName}</div>
                        <div className="text-[10px] text-slate-400">{activeConversation.peerRole}</div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPartner(activeConversation.peerName);
                        setActiveModal("session");
                      }}
                    >
                      <Video className="h-3.5 w-3.5 mr-1" />
                      Start Video
                    </Button>
                  </div>

                  {/* Messages Scroll Area */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {activeConversation.messages.map((m) => {
                      const isUser = m.sender === "user";
                      return (
                        <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-xs sm:max-w-sm rounded-2xl px-4 py-2.5 text-xs ${
                              isUser
                                ? "bg-indigo-600 text-white rounded-br-xs"
                                : "bg-slate-100 text-slate-800 rounded-bl-xs"
                            }`}
                          >
                            <p>{m.text}</p>
                            <span
                              className={`text-[9px] block mt-1 ${
                                isUser ? "text-indigo-200 text-right" : "text-slate-400"
                              }`}
                            >
                              {m.timestamp}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Message Input Footer */}
                  <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (messageInput.trim()) {
                            sendMessage(activeConversation.id, messageInput);
                            setMessageInput("");
                          }
                        }
                      }}
                      placeholder={`Message ${activeConversation.peerName}...`}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        if (messageInput.trim()) {
                          sendMessage(activeConversation.id, messageInput);
                          setMessageInput("");
                        }
                      }}
                      className="font-bold"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: WALLET & TRANSACTIONS */}
          {activeTab === "wallet" && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Skill Credits Wallet
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  1 Credit = 30 minutes of 1-on-1 knowledge exchange with any verified peer.
                </p>
              </div>

              {/* Balance Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-6 rounded-3xl border-indigo-200 bg-gradient-to-br from-indigo-50/70 to-violet-50/50">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Total Balance</span>
                  <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-1">{userCredits} Credits</div>
                  <span className="text-[11px] text-slate-500 mt-1 block">≈ {userCredits * 30} minutes of learning time</span>
                </Card>

                <Card className="p-6 rounded-3xl border-slate-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Credits Earned</span>
                  <div className="text-3xl font-black text-emerald-600 mt-1">+54 Credits</div>
                  <span className="text-[11px] text-slate-400 mt-1 block">From teaching sessions</span>
                </Card>

                <Card className="p-6 rounded-3xl border-slate-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Credits Spent</span>
                  <div className="text-3xl font-black text-slate-800 mt-1">12 Credits</div>
                  <span className="text-[11px] text-slate-400 mt-1 block">From attended sessions</span>
                </Card>
              </div>

              {/* Transaction History */}
              <Card className="p-6 rounded-3xl border-slate-200">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-lg font-bold">Transaction History</CardTitle>
                </CardHeader>
                <div className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="py-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${
                            tx.amount > 0 ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {tx.amount > 0 ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{tx.title}</div>
                          <div className="text-slate-400">{tx.date}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-black ${tx.amount > 0 ? "text-emerald-600" : "text-slate-700"}`}>
                          {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Credits
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400">{tx.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* TAB 7: SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-6 max-w-2xl animate-in fade-in duration-200">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Profile & Account Settings
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Update your public SkillSwap profile information and exchange preferences.
                </p>
              </div>

              <Card className="p-6 sm:p-8 rounded-3xl border-slate-200">
                <form onSubmit={handleSaveSettings} className="space-y-5">
                  <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                    <Avatar src={onboardingData.avatarUrl} size="lg" isOnline={true} />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{onboardingData.fullName}</h4>
                      <p className="text-xs text-indigo-600 font-semibold">{onboardingData.headline}</p>
                      <button
                        type="button"
                        onClick={() => setActiveScreen("onboarding")}
                        className="text-xs text-slate-500 hover:text-indigo-600 font-semibold mt-1 inline-block cursor-pointer"
                      >
                        Change photo in Onboarding →
                      </button>
                    </div>
                  </div>

                  <Input
                    label="Full Name"
                    value={settingsName}
                    onChange={(e) => setSettingsName(e.target.value)}
                    leftIcon={<User className="h-4 w-4" />}
                    required
                  />

                  <Input
                    label="Professional Headline"
                    value={settingsHeadline}
                    onChange={(e) => setSettingsHeadline(e.target.value)}
                    leftIcon={<Briefcase className="h-4 w-4" />}
                    required
                  />

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Short Bio
                    </label>
                    <textarea
                      value={settingsBio}
                      onChange={(e) => setSettingsBio(e.target.value)}
                      rows={3}
                      className="w-full p-3.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Location"
                      leftIcon={<MapPin className="h-4 w-4" />}
                      value={settingsLocation}
                      onChange={(e) => setSettingsLocation(e.target.value)}
                      options={LOCATIONS}
                    />
                    <Select
                      label="Timezone"
                      leftIcon={<Globe className="h-4 w-4" />}
                      value={settingsTimezone}
                      onChange={(e) => setSettingsTimezone(e.target.value)}
                      options={TIMEZONES}
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setSettingsName(onboardingData.fullName);
                        setSettingsHeadline(onboardingData.headline);
                        setSettingsBio(onboardingData.bio);
                        showToast("Settings reset to last saved.");
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Discard changes
                    </button>
                    <Button type="submit" variant="primary" size="md" className="font-bold">
                      Save Profile Changes
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}

        </div>
      </main>

      {/* ================= MODALS ================= */}

      {/* 1. Request Swap Modal */}
      <Modal
        isOpen={activeModal === "requestSwap"}
        onClose={() => setActiveModal(null)}
        title="Request 1-on-1 Skill Swap"
        description={`Send a session exchange request to ${selectedPartner}.`}
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
            <Button variant="ghost" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmSwap} className="font-bold">
              Send Request
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2. Add New Skill Modal */}
      <Modal
        isOpen={activeModal === "addSkill"}
        onClose={() => setActiveModal(null)}
        title="Add Skill to Portfolio"
        description="Add a skill you can teach to earn credits, or a topic you want to learn."
      >
        <form onSubmit={handleAddCustomSkill} className="space-y-4 pt-2">
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
            <Button type="button" variant="ghost" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="font-bold">
              Add to Portfolio
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Join Video Room Modal */}
      <Modal
        isOpen={activeModal === "session"}
        onClose={() => setActiveModal(null)}
        title="Interactive 1-on-1 Video Room"
        description={`Connecting with ${selectedPartner}...`}
      >
        <div className="space-y-4 text-center py-4">
          <div className="h-20 w-20 rounded-3xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25">
            <Video className="h-10 w-10 animate-pulse" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-900">Session Room Ready</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              Your camera and microphone permissions will be requested upon entry.
            </p>
          </div>
          <div className="flex gap-2 justify-center pt-2">
            <Button variant="outline" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setActiveModal(null);
                showToast("Entering video call room... (Backend simulated)");
              }}
            >
              Enter Call
            </Button>
          </div>
        </div>
      </Modal>

      {/* 4. Notifications Modal */}
      <Modal
        isOpen={activeModal === "notifications"}
        onClose={() => setActiveModal(null)}
        title="Notifications"
        description="Stay updated with incoming swap requests and reminders."
      >
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3 text-xs">
            <Sparkles className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-900">Priya Sharma accepted your UI/UX swap request</div>
              <div className="text-slate-500 mt-0.5">Session scheduled for tomorrow at 4:00 PM.</div>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3 text-xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-900">Welcome bonus credited</div>
              <div className="text-slate-500 mt-0.5">50 credits deposited to your account.</div>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => setActiveModal(null)}>
            Mark all as read
          </Button>
        </div>
      </Modal>
    </div>
  );
}
