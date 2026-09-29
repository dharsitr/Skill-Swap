"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { LoadingState } from "@/components/ui/states/LoadingState";
import { LOCATIONS, TIMEZONES } from "@/constants/config";
import { createClient } from "@/lib/supabase/client";
import {
  profileService,
  storageService,
  availabilityService,
  skillService,
  settingsService,
  UserSkillWithDetails,
  DAY_NAME_MAP,
  DAY_INDEX_MAP,
  DEFAULT_NOTIFICATION_PREFERENCES,
  DEFAULT_PRIVACY_PREFERENCES,
  DEFAULT_USER_PREFERENCES,
} from "@/lib/supabase/services";
import {
  AvailabilityRow,
  SkillDbRow,
  NotificationPreferencesRow,
  PrivacyPreferencesRow,
  UserPreferencesRow,
} from "@/types/database.types";
import {
  User,
  Briefcase,
  MapPin,
  Globe,
  Upload,
  Trash2,
  Clock,
  Plus,
  AlertCircle,
  Loader2,
  Calendar,
  Bell,
  Shield,
  Eye,
  Video,
  Mic,
  Volume2,
  MessageSquare,
  Palette,
  Lock,
  Key,
  Database,
  Download,
  HelpCircle,
  Info,
  AlertTriangle,
  CheckCircle2,
  Monitor,
  Sun,
  Moon,
  Smartphone,
  Check,
  Sparkles,
  RefreshCw,
  LogOut,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

type SettingsCategory =
  | "account"
  | "profile"
  | "notifications"
  | "privacy"
  | "sessions"
  | "video_audio"
  | "chat"
  | "appearance"
  | "language"
  | "security"
  | "data_privacy"
  | "help"
  | "about";

interface CategoryTab {
  id: SettingsCategory;
  label: string;
  icon: React.ElementType;
  description: string;
}

const CATEGORIES: CategoryTab[] = [
  { id: "account", label: "Account", icon: User, description: "Email, password, and core account credentials" },
  { id: "profile", label: "Profile", icon: Briefcase, description: "Public bio, skills catalog, and calendar availability" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Manage communication and alert preferences" },
  { id: "privacy", label: "Privacy", icon: Shield, description: "Control visibility and peer interaction rules" },
  { id: "sessions", label: "Sessions", icon: Calendar, description: "Durations, scheduling buffers, and booking rules" },
  { id: "video_audio", label: "Video & Audio", icon: Video, description: "Camera, microphone, and call quality settings" },
  { id: "chat", label: "Chat", icon: MessageSquare, description: "Read receipts, typing indicators, and message sounds" },
  { id: "appearance", label: "Appearance", icon: Palette, description: "Theme color mode and layout density" },
  { id: "language", label: "Language & Region", icon: Globe, description: "Timezone, date formatting, and language localization" },
  { id: "security", label: "Security", icon: Lock, description: "Password, active devices, and session protection" },
  { id: "data_privacy", label: "Data & Privacy", icon: Database, description: "Export personal data, deactivation, and account removal" },
  { id: "help", label: "Help & Support", icon: HelpCircle, description: "FAQ guides, contact channels, and system diagnostics" },
  { id: "about", label: "About", icon: Info, description: "Platform version, legal notices, and architecture details" },
];

const DAYS_LIST = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading, refreshProfile, signOut } = useAuth();
  const { showToast, updateOnboardingData } = useApp();


  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("account");

  // 1. Account Settings States
  const [accountEmail, setAccountEmail] = useState("");
  const [accountCreatedAt, setAccountCreatedAt] = useState("");
  const [accountDisplayName, setAccountDisplayName] = useState("");
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);

  // 2. Profile Form States
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState<string>(LOCATIONS[0]);
  const [timezone, setTimezone] = useState<string>(TIMEZONES[0]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Skills States
  const [teachSkills, setTeachSkills] = useState<UserSkillWithDetails[]>([]);
  const [learnSkills, setLearnSkills] = useState<UserSkillWithDetails[]>([]);
  const [catalogSkills, setCatalogSkills] = useState<SkillDbRow[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [customSkillName, setCustomSkillName] = useState("");
  const [skillCategory, setSkillCategory] = useState("Code");
  const [skillProficiency, setSkillProficiency] = useState<"beginner" | "intermediate" | "advanced" | "expert">("intermediate");
  const [skillYears, setSkillYears] = useState(2);
  const [skillTypeToAdd, setSkillTypeToAdd] = useState<"teach" | "learn">("teach");
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);

  // Availability States
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [isLoadingAvail, setIsLoadingAvail] = useState(false);
  const [availError, setAvailError] = useState<string | null>(null);
  const [newDay, setNewDay] = useState("Monday");
  const [newStartTime, setNewStartTime] = useState("09:00");
  const [newEndTime, setNewEndTime] = useState("12:00");
  const [isAddingAvail, setIsAddingAvail] = useState(false);

  // 3. Notification Preferences State
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferencesRow | null>(null);
  const [isSavingNotif, setIsSavingNotif] = useState(false);

  // 4. Privacy Preferences State
  const [privacyPrefs, setPrivacyPrefs] = useState<PrivacyPreferencesRow | null>(null);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);

  // 5. User General Preferences State (Sessions, Audio/Video, Chat, Appearance, Language)
  const [userPrefs, setUserPrefs] = useState<UserPreferencesRow | null>(null);
  const [isSavingGeneralPrefs, setIsSavingGeneralPrefs] = useState(false);

  // 6. Audio/Video Devices State
  const [cameras, setCameras] = useState<{ deviceId: string; label: string }[]>([]);
  const [microphones, setMicrophones] = useState<{ deviceId: string; label: string }[]>([]);
  const [speakers, setSpeakers] = useState<{ deviceId: string; label: string }[]>([]);

  // 7. Security States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSigningOutOthers, setIsSigningOutOthers] = useState(false);

  // 8. Data & Privacy / Danger Zone States
  const [isExportingData, setIsExportingData] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationPhrase, setDeleteConfirmationPhrase] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate auth/profile values
  useEffect(() => {
    if (user) {
      setAccountEmail(user.email || "");
      setAccountCreatedAt(user.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { dateStyle: "long" }) : "Recent");
    }
    if (profile) {
      setDisplayName(profile.display_name || "");
      setAccountDisplayName(profile.display_name || "");
      setHeadline(profile.headline || "");
      setBio(profile.bio || "");
      if (profile.location) setLocation(profile.location);
      if (profile.timezone) setTimezone(profile.timezone);
      setAvatarUrl(profile.avatar_url);
    } else if (user?.user_metadata?.full_name) {
      setDisplayName(user.user_metadata.full_name);
      setAccountDisplayName(user.user_metadata.full_name);
    }
  }, [profile, user]);

  // Load Preferences & Data
  const loadPreferences = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [notifRes, privacyRes, userPrefRes] = await Promise.all([
        settingsService.getNotificationPreferences(user.id),
        settingsService.getPrivacyPreferences(user.id),
        settingsService.getUserPreferences(user.id),
      ]);

      if (notifRes.data) setNotifPrefs(notifRes.data);
      if (privacyRes.data) setPrivacyPrefs(privacyRes.data);
      if (userPrefRes.data) setUserPrefs(userPrefRes.data);
    } catch {
      // Graceful fallback to default values
    }
  }, [user?.id]);

  // Load Skills
  const loadSkills = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingSkills(true);
    try {
      const [userSkillsRes, allSkillsRes] = await Promise.all([
        skillService.getUserSkills(user.id),
        skillService.getAllSkills(),
      ]);

      if (userSkillsRes.data) {
        setTeachSkills(userSkillsRes.data.filter((s) => s.type === "teach"));
        setLearnSkills(userSkillsRes.data.filter((s) => s.type === "learn"));
      }
      if (allSkillsRes.data) {
        setCatalogSkills(allSkillsRes.data);
        if (allSkillsRes.data.length > 0 && !selectedSkillId) {
          setSelectedSkillId(allSkillsRes.data[0].id);
        }
      }
    } catch {
      // Handled silently
    } finally {
      setIsLoadingSkills(false);
    }
  }, [user?.id, selectedSkillId]);

  // Load Availability
  const loadAvailability = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingAvail(true);
    setAvailError(null);
    try {
      const res = await availabilityService.getUserAvailability(user.id);
      if (res.error) throw new Error(res.error);
      setAvailability(res.data || []);
    } catch (err) {
      setAvailError(err instanceof Error ? err.message : "Failed to load availability.");
    } finally {
      setIsLoadingAvail(false);
    }
  }, [user?.id]);

  // Enumerate Media Devices for Video/Audio
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const videoDevs = devices
            .filter((d) => d.kind === "videoinput")
            .map((d, i) => ({ deviceId: d.deviceId || `cam-${i}`, label: d.label || `Camera ${i + 1}` }));
          const audioInDevs = devices
            .filter((d) => d.kind === "audioinput")
            .map((d, i) => ({ deviceId: d.deviceId || `mic-${i}`, label: d.label || `Microphone ${i + 1}` }));
          const audioOutDevs = devices
            .filter((d) => d.kind === "audiooutput")
            .map((d, i) => ({ deviceId: d.deviceId || `speaker-${i}`, label: d.label || `Speaker ${i + 1}` }));

          setCameras(videoDevs.length > 0 ? videoDevs : [{ deviceId: "default", label: "Default HD Camera" }]);
          setMicrophones(audioInDevs.length > 0 ? audioInDevs : [{ deviceId: "default", label: "Default Built-in Microphone" }]);
          setSpeakers(audioOutDevs.length > 0 ? audioOutDevs : [{ deviceId: "default", label: "Default Output Speakers" }]);
        })
        .catch(() => {
          setCameras([{ deviceId: "default", label: "Default HD Camera" }]);
          setMicrophones([{ deviceId: "default", label: "Default Microphone" }]);
          setSpeakers([{ deviceId: "default", label: "Default Speakers" }]);
        });
    } else {
      setCameras([{ deviceId: "default", label: "Default HD Camera" }]);
      setMicrophones([{ deviceId: "default", label: "Default Microphone" }]);
      setSpeakers([{ deviceId: "default", label: "Default Speakers" }]);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user?.id) {
      loadPreferences();
      loadSkills();
      loadAvailability();
    }
  }, [authLoading, user?.id, loadPreferences, loadSkills, loadAvailability]);

  // 1. Account Operations
  const handleUpdateAccountDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !accountDisplayName.trim()) return;
    setIsUpdatingAccount(true);
    const res = await profileService.updateProfile(user.id, {
      display_name: accountDisplayName.trim(),
    });
    setIsUpdatingAccount(false);
    if (res.error) {
      showToast(res.error, "error");
      return;
    }
    setDisplayName(accountDisplayName.trim());
    await refreshProfile();
    showToast("Account display name updated!");
  };

  // 2. Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsSavingProfile(true);
    setProfileError(null);

    const res = await profileService.updateProfile(user.id, {
      display_name: displayName.trim(),
      headline: headline.trim(),
      bio: bio.trim(),
      location,
      timezone,
    });
    setIsSavingProfile(false);

    if (res.error) {
      setProfileError(res.error);
      showToast("Failed to save changes. Please try again.", "error");
      return;
    }

    updateOnboardingData({
      fullName: displayName.trim(),
      headline: headline.trim(),
      bio: bio.trim(),
      location,
      timezone,
    });
    setAccountDisplayName(displayName.trim());
    await refreshProfile();
    showToast("Profile updated successfully!");
  };

  // Avatar Upload / Remove
  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setIsUploadingAvatar(true);
    const res = await storageService.uploadAvatar(user.id, file);
    setIsUploadingAvatar(false);

    if (res.error) {
      showToast(res.error, "error");
      return;
    }

    if (res.data?.publicUrl) {
      setAvatarUrl(res.data.publicUrl);
      updateOnboardingData({ avatarUrl: res.data.publicUrl });
      await refreshProfile();
      showToast("Avatar updated successfully!");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveAvatar = async () => {
    if (!user?.id) return;
    setIsUploadingAvatar(true);
    const res = await storageService.removeAvatar(user.id);
    setIsUploadingAvatar(false);

    if (res.error) {
      showToast(res.error, "error");
      return;
    }
    if (res.data) {
      setAvatarUrl(res.data);
      updateOnboardingData({ avatarUrl: res.data });
      await refreshProfile();
      showToast("Avatar reset to default.");
    }
  };

  // Skill Add / Delete
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    let skillIdToLink = selectedSkillId;
    setIsAddingSkill(true);

    if (customSkillName.trim()) {
      const createdRes = await skillService.findOrCreateSkill(customSkillName.trim(), skillCategory);
      if (createdRes.error || !createdRes.data) {
        setIsAddingSkill(false);
        showToast(createdRes.error || "Failed to register new skill.", "error");
        return;
      }
      skillIdToLink = createdRes.data.id;
    }

    if (!skillIdToLink) {
      setIsAddingSkill(false);
      showToast("Please select or enter a skill name.", "error");
      return;
    }

    const addRes = await skillService.addUserSkill({
      user_id: user.id,
      skill_id: skillIdToLink,
      type: skillTypeToAdd,
    });
    setIsAddingSkill(false);

    if (addRes.error) {
      showToast(addRes.error, "error");
      return;
    }

    setCustomSkillName("");
    showToast(`Added ${skillTypeToAdd === "teach" ? "teaching" : "learning"} skill!`);
    loadSkills();
  };

  const handleDeleteSkill = async (userSkillId: string) => {
    const res = await skillService.removeUserSkill(userSkillId);
    if (res.error) {
      showToast(res.error, "error");
      return;
    }
    setTeachSkills((prev) => prev.filter((s) => s.id !== userSkillId));
    setLearnSkills((prev) => prev.filter((s) => s.id !== userSkillId));
    showToast("Skill removed from profile.");
  };


  // Availability Add / Delete
  const handleAddAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    const validation = availabilityService.validateTimeRange(newStartTime, newEndTime);
    if (!validation.valid) {
      showToast(validation.error || "End time must be after start time.", "error");
      return;
    }
    const dayNumber = DAY_INDEX_MAP[newDay] ?? 1;
    setIsAddingAvail(true);
    const res = await availabilityService.addAvailability({
      user_id: user.id,
      day_of_week: dayNumber,
      start_time: newStartTime + ":00",
      end_time: newEndTime + ":00",
    });
    setIsAddingAvail(false);

    if (res.error) {
      showToast(res.error, "error");
      return;
    }
    showToast(`Added schedule for ${newDay}!`);
    loadAvailability();
  };

  const handleDeleteAvailability = async (id: string) => {
    const res = await availabilityService.deleteAvailability(id);
    if (res.error) {
      showToast(res.error, "error");
      return;
    }
    setAvailability((prev) => prev.filter((slot) => slot.id !== id));
    showToast("Availability window removed.");
  };

  // 3. Notification Preferences Save
  const handleToggleNotifPref = async (key: keyof typeof DEFAULT_NOTIFICATION_PREFERENCES) => {
    if (!user?.id || !notifPrefs) return;
    const currentVal = notifPrefs[key];
    const updated = { ...notifPrefs, [key]: !currentVal };
    setNotifPrefs(updated);

    setIsSavingNotif(true);
    const res = await settingsService.updateNotificationPreferences(user.id, {
      [key]: !currentVal,
    });
    setIsSavingNotif(false);

    if (res.error) {
      setNotifPrefs(notifPrefs); // revert
      showToast("Failed to update notification setting.", "error");
    } else {
      showToast("Notification preference saved.");
    }
  };

  // 4. Privacy Preferences Save
  const handleUpdatePrivacyPref = async (updates: Partial<PrivacyPreferencesRow>) => {
    if (!user?.id || !privacyPrefs) return;
    const updated = { ...privacyPrefs, ...updates };
    setPrivacyPrefs(updated);

    setIsSavingPrivacy(true);
    const res = await settingsService.updatePrivacyPreferences(user.id, updates);
    setIsSavingPrivacy(false);

    if (res.error) {
      setPrivacyPrefs(privacyPrefs);
      showToast("Failed to update privacy setting.", "error");
    } else {
      showToast("Privacy settings updated.");
    }
  };

  // 5. User Preferences Save (Sessions, AV, Chat, Appearance, Language)
  const handleUpdateUserPref = async (updates: Partial<UserPreferencesRow>) => {
    if (!user?.id || !userPrefs) return;
    const updated = { ...userPrefs, ...updates };
    setUserPrefs(updated);

    // Apply immediate local effects
    if (updates.theme) {
      applyTheme(updates.theme as "light" | "dark" | "system");
    }
    if (updates.layout_density) {
      applyDensity(updates.layout_density as "comfortable" | "compact");
    }

    setIsSavingGeneralPrefs(true);
    const res = await settingsService.updateUserPreferences(user.id, updates);
    setIsSavingGeneralPrefs(false);

    if (res.error) {
      setUserPrefs(userPrefs);
      showToast("Failed to update preference.", "error");
    } else {
      showToast("Preference saved.");
    }
  };

  const applyTheme = (theme: "light" | "dark" | "system") => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
    localStorage.setItem("skillswap_theme", theme);
  };

  const applyDensity = (density: "comfortable" | "compact") => {
    if (typeof window === "undefined") return;
    document.documentElement.setAttribute("data-density", density);
    localStorage.setItem("skillswap_density", density);
  };

  // 6. Security: Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsChangingPassword(true);
    const sb = createClient();
    const { error } = await sb.auth.updateUser({ password: newPassword });
    setIsChangingPassword(false);

    if (error) {
      setPasswordError(error.message);
      showToast(error.message, "error");
    } else {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password updated successfully!");
    }
  };

  const handleSignOutOtherDevices = async () => {
    setIsSigningOutOthers(true);
    const sb = createClient();
    const { error } = await sb.auth.signOut({ scope: "others" });
    setIsSigningOutOthers(false);

    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("All other active device sessions signed out.");
    }
  };

  // 7. Data Export
  const handleExportData = async () => {
    if (!user?.id) return;
    setIsExportingData(true);
    const res = await settingsService.exportUserData(user.id);
    setIsExportingData(false);

    if (res.error || !res.data) {
      showToast(res.error || "Failed to generate data export.", "error");
      return;
    }

    // Trigger JSON file download
    const blob = new Blob([JSON.stringify(res.data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `skillswap-user-data-${user.id.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("Personal data exported successfully!");
  };

  // 8. Account Deactivation
  const handleDeactivateAccount = async () => {
    if (!user?.id) return;
    setIsDeactivating(true);
    const res = await settingsService.deactivateAccount(user.id);
    setIsDeactivating(false);
    setShowDeactivateModal(false);

    if (res.error) {
      showToast(res.error, "error");
      return;
    }

    showToast("Account deactivated. Your profile is now hidden from discovery.");
    loadPreferences();
  };

  // 9. Permanent Account Deletion
  const handleDeleteAccount = async () => {
    if (!user?.id) return;
    setDeleteError(null);

    if (deleteConfirmationPhrase.trim().toUpperCase() !== "DELETE MY ACCOUNT") {
      setDeleteError("Please type 'DELETE MY ACCOUNT' exactly as shown.");
      return;
    }

    setIsDeletingAccount(true);
    const res = await settingsService.deleteAccount(user.id, deleteConfirmationPhrase);
    setIsDeletingAccount(false);

    if (res.error) {
      setDeleteError(res.error);
      showToast(res.error, "error");
      return;
    }

    setShowDeleteModal(false);
    showToast("Account permanently deleted. Goodbye!");
    await signOut();
    router.push("/");
  };


  if (authLoading) {
    return (
      <div className="py-12">
        <LoadingState message="Loading your settings & account preferences..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200 pb-16">
      <PageHeader
        title="Settings & Account"
        description="Manage your credentials, privacy boundaries, notification preferences, and platform experience."
      />

      {/* Main Settings Grid: Responsive Sidebar + Content Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar (Desktop) / Horizontal Navigation (Mobile) */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-2">
          {/* Mobile Category Dropdown / Horizontal Tabs */}
          <div className="lg:hidden p-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs mb-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Settings Category
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop Categories Sidebar Menu */}
          <Card className="hidden lg:block p-3 rounded-3xl border-slate-200/80 bg-white shadow-xs sticky top-24">
            <div className="px-3 py-2 border-b border-slate-100 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Preferences
              </span>
            </div>
            <nav className="space-y-1" aria-label="Settings Categories">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer group ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-100"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-1.5 rounded-xl transition-colors ${
                          isActive
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span>{cat.label}</span>
                    </div>
                    {isActive && <ChevronRight className="h-3.5 w-3.5 text-indigo-600" />}
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Right Content Panel */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* =========================================================================
              1. ACCOUNT CATEGORY
          ========================================================================= */}
          {activeCategory === "account" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <Card className="p-6 sm:p-8 rounded-3xl border-slate-200/80 bg-white shadow-xs">
                <CardHeader className="p-0 mb-6 border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900">Account Credentials</CardTitle>
                      <p className="text-xs text-slate-500 mt-1">
                        View authentication details and manage your account identity.
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                </CardHeader>

                <div className="space-y-6">
                  {/* Account Email (Read-only Supabase Auth) */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Account Email Address
                    </label>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900">{accountEmail || "No email linked"}</span>
                      <span className="text-xs text-slate-400 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                        Primary Supabase Auth
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Sign-in credentials are authenticated securely via Supabase Auth services.
                    </p>
                  </div>

                  {/* Creation Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Member Since
                      </span>
                      <span className="text-sm font-semibold text-slate-900">{accountCreatedAt}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Account ID
                      </span>
                      <span className="text-xs font-mono text-slate-700 truncate block">
                        {user?.id || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Display Name Edit */}
                  <form onSubmit={handleUpdateAccountDisplayName} className="space-y-4 pt-2">
                    <Input
                      label="Account Display Name"
                      value={accountDisplayName}
                      onChange={(e) => setAccountDisplayName(e.target.value)}
                      leftIcon={<User className="h-4 w-4" />}
                      placeholder="e.g. Alex Chen"
                      required
                      disabled={isUpdatingAccount}
                    />

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={isUpdatingAccount || accountDisplayName.trim() === profile?.display_name}
                        className="font-bold"
                      >
                        {isUpdatingAccount ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                            Updating...
                          </>
                        ) : (
                          "Update Display Name"
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </Card>
            </div>
          )}

          {/* =========================================================================
              2. PROFILE CATEGORY
          ========================================================================= */}
          {activeCategory === "profile" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Profile Details Card */}
              <Card className="p-6 sm:p-8 rounded-3xl border-slate-200/80 bg-white shadow-xs">
                <CardHeader className="p-0 mb-6 border-b border-slate-100 pb-4">
                  <CardTitle className="text-lg font-bold text-slate-900">Personal Information</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    Control how other community members view your background and skills.
                  </p>
                </CardHeader>

                {profileError && (
                  <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <span className="font-medium">{profileError}</span>
                  </div>
                )}

                {/* Avatar Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 mb-6 border-b border-slate-100">
                  <div className="relative group">
                    <Avatar
                      src={avatarUrl || undefined}
                      alt={displayName}
                      size="xl"
                      isOnline={true}
                      className="ring-4 ring-indigo-50 shadow-md"
                    />
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-900">Profile Photo</h4>
                    <p className="text-xs text-slate-500">
                      Upload a JPEG, PNG, or WebP photo up to 5MB. Stored securely on Supabase Storage.
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarFile}
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="font-bold cursor-pointer"
                      >
                        <Upload className="h-3.5 w-3.5 mr-1.5" />
                        {isUploadingAvatar ? "Uploading..." : "Upload New Photo"}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveAvatar}
                        disabled={isUploadingAvatar}
                        className="text-slate-500 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Reset Default
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Profile Edit Form */}
                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Display Name *"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      leftIcon={<User className="h-4 w-4" />}
                      placeholder="e.g. Alex Chen"
                      required
                      disabled={isSavingProfile}
                    />
                    <Input
                      label="Professional Headline *"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      leftIcon={<Briefcase className="h-4 w-4" />}
                      placeholder="e.g. Senior Frontend Engineer"
                      required
                      disabled={isSavingProfile}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Short Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      className="w-full p-3.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
                      placeholder="Tell fellow peers what you love teaching, learning, and collaborating on..."
                      disabled={isSavingProfile}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Location"
                      leftIcon={<MapPin className="h-4 w-4" />}
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      options={LOCATIONS}
                      disabled={isSavingProfile}
                    />
                    <Select
                      label="Timezone"
                      leftIcon={<Globe className="h-4 w-4" />}
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      options={TIMEZONES}
                      disabled={isSavingProfile}
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={isSavingProfile}
                      className="font-bold min-w-[160px]"
                    >
                      {isSavingProfile ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Saving Changes...
                        </>
                      ) : (
                        "Save Profile Changes"
                      )}
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Skills Management Card */}
              <Card className="p-6 sm:p-8 rounded-3xl border-slate-200/80 bg-white shadow-xs">
                <CardHeader className="p-0 mb-6 border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900">Skills Portfolio</CardTitle>
                      <p className="text-xs text-slate-500 mt-1">
                        Manage your teaching and learning skills catalog directly linked to your profile.
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                      {teachSkills.length + learnSkills.length} Total Skills
                    </Badge>
                  </div>
                </CardHeader>

                {/* Teach Skills */}
                <div className="mb-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-3 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Skills You Can Teach ({teachSkills.length})
                  </h4>
                  {teachSkills.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {teachSkills.map((ts) => (
                        <div
                          key={ts.id}
                          className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between"
                        >
                          <div>
                            <span className="text-sm font-bold text-slate-900">
                              {ts.skill?.name || "Skill"}
                            </span>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                              <span className="capitalize">{ts.skill?.category || "General"}</span>
                              <span>•</span>
                              <span>Teaching</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteSkill(ts.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors cursor-pointer"
                            title="Remove skill"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic py-2">
                      No teaching skills registered yet. Add one below.
                    </p>
                  )}
                </div>

                {/* Learn Skills */}
                <div className="mb-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-3 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Skills You Want to Learn ({learnSkills.length})
                  </h4>
                  {learnSkills.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {learnSkills.map((ls) => (
                        <div
                          key={ls.id}
                          className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between"
                        >
                          <div>
                            <span className="text-sm font-bold text-slate-900">
                              {ls.skill?.name || "Skill"}
                            </span>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                              <span className="capitalize">{ls.skill?.category || "General"}</span>
                              <span>•</span>
                              <span>Learning</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteSkill(ls.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors cursor-pointer"
                            title="Remove skill"
                          >

                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic py-2">
                      No learning skills registered yet. Add one below.
                    </p>
                  )}
                </div>

                {/* Add Skill Form */}
                <form
                  onSubmit={handleAddSkill}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4"
                >
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Add Skill to Profile</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Skill Role
                      </label>
                      <select
                        value={skillTypeToAdd}
                        onChange={(e) => setSkillTypeToAdd(e.target.value as "teach" | "learn")}
                        className="w-full h-11 px-3.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      >
                        <option value="teach">Teach (I offer this skill)</option>
                        <option value="learn">Learn (I want to learn this skill)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Select from Catalog
                      </label>
                      <select
                        value={selectedSkillId}
                        onChange={(e) => setSelectedSkillId(e.target.value)}
                        className="w-full h-11 px-3.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      >
                        {catalogSkills.map((cs) => (
                          <option key={cs.id} value={cs.id}>
                            {cs.name} ({cs.category})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Or Custom Skill Name
                      </label>
                      <input
                        type="text"
                        value={customSkillName}
                        onChange={(e) => setCustomSkillName(e.target.value)}
                        placeholder="e.g. Next.js App Router"
                        className="w-full h-11 px-3.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Proficiency
                      </label>
                      <select
                        value={skillProficiency}
                        onChange={(e) =>
                          setSkillProficiency(e.target.value as "beginner" | "intermediate" | "advanced" | "expert")
                        }
                        className="w-full h-11 px-3.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Years Experience
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={skillYears}
                        onChange={(e) => setSkillYears(parseInt(e.target.value) || 0)}
                        className="w-full h-11 px-3.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      disabled={isAddingSkill}
                      className="font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    >
                      {isAddingSkill ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                          Adding Skill...
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5 mr-1.5" />
                          Add Skill
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Availability Card */}
              <Card className="p-6 sm:p-8 rounded-3xl border-slate-200/80 bg-white shadow-xs">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    <span>Availability Schedule</span>
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Define the days and time windows when you are open for 1-on-1 skill exchange sessions.
                  </p>
                </CardHeader>

                {availError && (
                  <div className="mb-4 p-3 rounded-2xl bg-rose-50 text-rose-700 text-xs font-medium">
                    {availError}
                  </div>
                )}

                {/* Existing Slots */}
                <div className="space-y-2 mb-6">
                  {isLoadingAvail ? (
                    <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                      <span>Loading schedule...</span>
                    </div>
                  ) : availability.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {availability.map((slot) => {
                        const dayName = DAY_NAME_MAP[slot.day_of_week] || `Day ${slot.day_of_week}`;
                        return (
                          <div
                            key={slot.id}
                            className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold text-xs">
                                {dayName}
                              </span>
                              <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                <span>
                                  {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteAvailability(slot.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors cursor-pointer"
                              title="Delete slot"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-3 italic">
                      No availability windows registered yet. Add your first time slot below.
                    </p>
                  )}
                </div>

                {/* Add Slot Form */}
                <form
                  onSubmit={handleAddAvailability}
                  className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-4"
                >
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Add Available Time Window</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Select
                      label="Day of Week"
                      value={newDay}
                      onChange={(e) => setNewDay(e.target.value)}
                      options={DAYS_LIST}
                      disabled={isAddingAvail}
                    />

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={newStartTime}
                        onChange={(e) => setNewStartTime(e.target.value)}
                        required
                        className="w-full h-11 px-3.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        disabled={isAddingAvail}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={newEndTime}
                        onChange={(e) => setNewEndTime(e.target.value)}
                        required
                        className="w-full h-11 px-3.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        disabled={isAddingAvail}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      disabled={isAddingAvail}
                      className="font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    >
                      {isAddingAvail ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5 mr-1.5" />
                          Add Availability Window
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}

          {/* =========================================================================
              3. NOTIFICATIONS CATEGORY
          ========================================================================= */}
          {activeCategory === "notifications" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <Card className="p-6 sm:p-8 rounded-3xl border-slate-200/80 bg-white shadow-xs">
                <CardHeader className="p-0 mb-6 border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900">Notification Preferences</CardTitle>
                      <p className="text-xs text-slate-500 mt-1">
                        Select which platform events generate in-app alerts and notifications.
                      </p>
                    </div>
                    {isSavingNotif && (
                      <span className="text-xs text-indigo-600 flex items-center gap-1 font-semibold">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </span>
                    )}
                  </div>
                </CardHeader>

                <div className="divide-y divide-slate-100 space-y-4">
                  {[
                    {
                      key: "messages_enabled" as const,
                      label: "Direct Messages",
                      desc: "Instant notifications when peers send messages in active conversations.",
                    },
                    {
                      key: "connection_requests_enabled" as const,
                      label: "Connection Requests",
                      desc: "Alerts when other members send you peer connection invitations.",
                    },
                    {
                      key: "session_reminders_enabled" as const,
                      label: "Session Reminders",
                      desc: "Upcoming 15-minute and 1-hour session calendar reminders.",
                    },
                    {
                      key: "session_updates_enabled" as const,
                      label: "Session Updates & Changes",
                      desc: "Alerts when a session is confirmed, rescheduled, completed, or cancelled.",
                    },
                    {
                      key: "reviews_enabled" as const,
                      label: "Ratings & Reviews",
                      desc: "Notifications when learners or mentors publish feedback on your completed sessions.",
                    },
                    {
                      key: "credit_activity_enabled" as const,
                      label: "Credit Activity",
                      desc: "Notifications for teaching rewards, spend debits, and balance updates.",
                    },
                    {
                      key: "email_enabled" as const,
                      label: "Email Notifications",
                      desc: "Receive digest summaries and critical session alerts via your verified email.",
                    },
                  ].map((item) => {
                    const enabled = notifPrefs ? notifPrefs[item.key] : true;
                    return (
                      <div key={item.key} className="pt-4 flex items-center justify-between">
                        <div className="pr-4">
                          <h4 className="text-sm font-bold text-slate-900">{item.label}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={enabled}
                          onClick={() => handleToggleNotifPref(item.key)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                            enabled ? "bg-indigo-600" : "bg-slate-200"
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              enabled ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* =========================================================================
              4. PRIVACY CATEGORY
          ========================================================================= */}
          {activeCategory === "privacy" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <Card className="p-6 sm:p-8 rounded-3xl border-slate-200/80 bg-white shadow-xs">
                <CardHeader className="p-0 mb-6 border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900">Privacy & Boundaries</CardTitle>
                      <p className="text-xs text-slate-500 mt-1">
                        Control how visible your profile is in discover queries and who can connect with you.
                      </p>
                    </div>
                    {isSavingPrivacy && (
                      <span className="text-xs text-indigo-600 flex items-center gap-1 font-semibold">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Updating...
                      </span>
                    )}
                  </div>
                </CardHeader>

                <div className="space-y-6">
                  {/* Profile Visibility */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Profile Visibility
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: "public", title: "Everyone", desc: "Visible to all SkillSwap community members" },
                        { id: "connections", title: "Connected Users", desc: "Only accepted peer connections can view" },
                        { id: "hidden", title: "Hidden", desc: "Completely excluded from discovery queries" },
                      ].map((opt) => {
                        const isSelected = (privacyPrefs?.profile_visibility || "public") === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleUpdatePrivacyPref({ profile_visibility: opt.id as "public" | "connections" | "hidden" })}
                            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-bold text-slate-900">{opt.title}</span>
                              {isSelected && <Check className="h-4 w-4 text-indigo-600" />}
                            </div>
                            <p className="text-xs text-slate-500">{opt.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Who can send connection requests */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Who Can Send You Connection Requests
                    </label>
                    <select
                      value={privacyPrefs?.allow_connection_requests || "everyone"}
                      onChange={(e) => handleUpdatePrivacyPref({ allow_connection_requests: e.target.value as "everyone" | "none" })}
                      className="w-full h-11 px-3.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    >

                      <option value="everyone">Everyone (All authenticated members)</option>
                      <option value="none">Nobody (Temporarily pause incoming connection requests)</option>
                    </select>
                  </div>

                  {/* Visibility Toggles */}
                  <div className="divide-y divide-slate-100 pt-2 space-y-4">
                    {[
                      {
                        key: "show_online_status" as const,
                        label: "Show Online Status",
                        desc: "Display active online indicator to peers in chat and discovery.",
                      },
                      {
                        key: "show_availability" as const,
                        label: "Show Availability Schedule",
                        desc: "Allow peers to see your schedule timeslots when browsing mentors.",
                      },
                      {
                        key: "show_completed_sessions" as const,
                        label: "Show Completed Sessions Count",
                        desc: "Display total sessions completed on your public profile card.",
                      },
                      {
                        key: "show_rating_summary" as const,
                        label: "Show Rating & Review Summary",
                        desc: "Display star ratings and peer reviews on your public profile.",
                      },
                    ].map((item) => {
                      const enabled = privacyPrefs ? privacyPrefs[item.key] : true;
                      return (
                        <div key={item.key} className="pt-4 flex items-center justify-between">
                          <div className="pr-4">
                            <h4 className="text-sm font-bold text-slate-900">{item.label}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={enabled}
                            onClick={() => handleUpdatePrivacyPref({ [item.key]: !enabled })}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                              enabled ? "bg-indigo-600" : "bg-slate-200"
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                enabled ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* =========================================================================
              5. SESSIONS CATEGORY
          ========================================================================= */}
          {activeCategory === "sessions" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <Card className="p-6 sm:p-8 rounded-3xl border-slate-200/80 bg-white shadow-xs">
                <CardHeader className="p-0 mb-6 border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900">Session & Booking Rules</CardTitle>
                      <p className="text-xs text-slate-500 mt-1">
                        Configure default call durations, scheduling notices, and booking workflows.
                      </p>
                    </div>
                    {isSavingGeneralPrefs && (
                      <span className="text-xs text-indigo-600 flex items-center gap-1 font-semibold">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </span>
                    )}
                  </div>
                </CardHeader>

                <div className="space-y-6">
                  {/* Default Session Duration */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Default Session Duration
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[30, 45, 60].map((mins) => {
                        const isSelected = (userPrefs?.default_session_duration || 45) === mins;
                        return (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => handleUpdateUserPref({ default_session_duration: mins })}
                            className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                              isSelected
                                ? "border-indigo-600 bg-indigo-50/60 font-bold text-indigo-700 ring-2 ring-indigo-500/20"
                                : "border-slate-200 bg-white hover:border-slate-300 font-semibold text-slate-700"
                            }`}
                          >
                            <span className="text-lg font-extrabold">{mins}</span>
                            <span className="text-xs block text-slate-500 mt-0.5">Minutes</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cancellation Notice Period */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Cancellation Notice Requirement
                    </label>
                    <select
                      value={userPrefs?.cancellation_notice_hours || 2}
                      onChange={(e) => handleUpdateUserPref({ cancellation_notice_hours: parseInt(e.target.value) })}
                      className="w-full h-11 px-3.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    >
                      <option value={1}>1 hour prior to session</option>
                      <option value={2}>2 hours prior to session (Recommended)</option>
                      <option value={6}>6 hours prior to session</option>
                      <option value={12}>12 hours prior to session</option>
                      <option value={24}>24 hours prior to session</option>
                    </select>
                    <p className="text-xs text-slate-400 mt-1.5">
                      Sessions cancelled with sufficient notice automatically refund learner credits without penalty.
                    </p>
                  </div>

                  {/* Auto-accept connections toggle */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Auto-Confirm Connection Requests</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Automatically accept incoming connection requests without manual approval.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={userPrefs?.auto_accept_connections || false}
                      onClick={() =>
                        handleUpdateUserPref({
                          auto_accept_connections: !(userPrefs?.auto_accept_connections || false),
                        })
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                        userPrefs?.auto_accept_connections ? "bg-indigo-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          userPrefs?.auto_accept_connections ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* =========================================================================
              6. VIDEO & AUDIO CATEGORY
          ========================================================================= */}
          {activeCategory === "video_audio" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <Card className="p-6 sm:p-8 rounded-3xl border-slate-200/80 bg-white shadow-xs">
                <CardHeader className="p-0 mb-6 border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900">Video & Audio Devices</CardTitle>
                      <p className="text-xs text-slate-500 mt-1">
                        Select default hardware peripherals and WebRTC video quality options.
                      </p>
                    </div>
                    {isSavingGeneralPrefs && (
                      <span className="text-xs text-indigo-600 flex items-center gap-1 font-semibold">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </span>
                    )}
                  </div>
                </CardHeader>

                <div className="space-y-5">
                  {/* Camera Select */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Video className="h-3.5 w-3.5 text-indigo-600" />
                      Default Camera
                    </label>
                    <select
                      value={userPrefs?.preferred_camera_id || "default"}
                      onChange={(e) => handleUpdateUserPref({ preferred_camera_id: e.target.value })}
                      className="w-full h-11 px-3.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    >
                      {cameras.map((c) => (
                        <option key={c.deviceId} value={c.deviceId}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Microphone Select */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Mic className="h-3.5 w-3.5 text-indigo-600" />
                      Default Microphone
                    </label>
                    <select
                      value={userPrefs?.preferred_mic_id || "default"}
                      onChange={(e) => handleUpdateUserPref({ preferred_mic_id: e.target.value })}
                      className="w-full h-11 px-3.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    >
                      {microphones.map((m) => (
                        <option key={m.deviceId} value={m.deviceId}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Speaker Select */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Volume2 className="h-3.5 w-3.5 text-indigo-600" />
                      Audio Output (Speakers / Headphones)
                    </label>
                    <select
                      value={userPrefs?.preferred_speaker_id || "default"}
                      onChange={(e) => handleUpdateUserPref({ preferred_speaker_id: e.target.value })}
                      className="w-full h-11 px-3.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    >
                      {speakers.map((s) => (
                        <option key={s.deviceId} value={s.deviceId}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Video Quality Preference */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Video Stream Resolution
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "480p", label: "480p SD", desc: "Low bandwidth" },
                        { id: "720p", label: "720p HD", desc: "Balanced (Recommended)" },
                        { id: "1080p", label: "1080p Full HD", desc: "High bandwidth" },
                      ].map((vq) => {
                        const isSelected = (userPrefs?.video_quality || "720p") === vq.id;
                        return (
                          <button
                            key={vq.id}
                            type="button"
                            onClick={() => handleUpdateUserPref({ video_quality: vq.id as "480p" | "720p" | "1080p" })}
                            className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${

                              isSelected
                                ? "border-indigo-600 bg-indigo-50/60 font-bold text-indigo-700 ring-2 ring-indigo-500/20"
                                : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                            }`}
                          >
                            <span className="text-sm font-bold block">{vq.label}</span>
                            <span className="text-xs text-slate-400 block mt-0.5">{vq.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mirror Video Toggle */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Mirror My Video</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Flip your local video preview horizontally (mirrored natural reflection).
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={userPrefs?.mirror_video ?? true}
                      onClick={() =>
                        handleUpdateUserPref({
                          mirror_video: !(userPrefs?.mirror_video ?? true),
                        })
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                        (userPrefs?.mirror_video ?? true) ? "bg-indigo-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          (userPrefs?.mirror_video ?? true) ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* =========================================================================
              7. CHAT CATEGORY
          ========================================================================= */}
          {activeCategory === "chat" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <Card className="p-6 sm:p-8 rounded-3xl border-slate-200/80 bg-white shadow-xs">
                <CardHeader className="p-0 mb-6 border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900">Chat Preferences</CardTitle>
                      <p className="text-xs text-slate-500 mt-1">
                        Control message indicators, read receipt disclosures, and sound effects.
                      </p>
                    </div>
                    {isSavingGeneralPrefs && (
                      <span className="text-xs text-indigo-600 flex items-center gap-1 font-semibold">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </span>
                    )}
                  </div>
                </CardHeader>

                <div className="divide-y divide-slate-100 space-y-4">
                  {[
                    {
                      key: "read_receipts_enabled" as const,
                      label: "Read Receipts",
                      desc: "Let other participants know when you have viewed their chat messages.",
                    },
                    {
                      key: "typing_indicators_enabled" as const,
                      label: "Typing Indicators",
                      desc: "Broadcast when you are actively drafting a message in conversations.",
                    },
                    {
                      key: "message_sounds_enabled" as const,
                      label: "Message Chime & Audio Alert",
                      desc: "Play an audible sound when receiving a message in an open conversation.",
                    },
                  ].map((item) => {
                    const enabled = userPrefs ? userPrefs[item.key] : true;
                    return (
                      <div key={item.key} className="pt-4 flex items-center justify-between">
                        <div className="pr-4">
                          <h4 className="text-sm font-bold text-slate-900">{item.label}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={enabled}
                          onClick={() => handleUpdateUserPref({ [item.key]: !enabled })}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                            enabled ? "bg-indigo-600" : "bg-slate-200"
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              enabled ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* =========================================================================
              8. APPEARANCE CATEGORY
          ========================================================================= */}
          {activeCategory === "appearance" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <Card className="p-6 sm:p-8 rounded-3xl border-slate-200/80 bg-white shadow-xs">
                <CardHeader className="p-0 mb-6 border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900">Theme & Display</CardTitle>
                      <p className="text-xs text-slate-500 mt-1">
                        Personalize color styling mode and information spacing across SkillSwap.
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <div className="space-y-6">
                  {/* Theme Mode */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Color Mode
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: "light", label: "Light", icon: Sun, desc: "Crisp bright palette" },
                        { id: "dark", label: "Dark", icon: Moon, desc: "Sleek low-glare mode" },
                        { id: "system", label: "System Sync", icon: Monitor, desc: "Matches OS settings" },
                      ].map((t) => {
                        const Icon = t.icon;
                        const isSelected = (userPrefs?.theme || "system") === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleUpdateUserPref({ theme: t.id as "light" | "dark" | "system" })}
                            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Icon className="h-5 w-5 text-indigo-600" />
                              {isSelected && <Check className="h-4 w-4 text-indigo-600" />}
                            </div>
                            <span className="text-sm font-bold text-slate-900 block">{t.label}</span>
                            <span className="text-xs text-slate-500 block mt-0.5">{t.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Layout Density */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Layout Density
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { id: "comfortable", label: "Comfortable", desc: "Spacious padding and relaxed spacing" },
                        { id: "compact", label: "Compact", desc: "Higher data density with trimmed margins" },
                      ].map((d) => {
                        const isSelected = (userPrefs?.layout_density || "comfortable") === d.id;
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => handleUpdateUserPref({ layout_density: d.id as "comfortable" | "compact" })}
                            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${

                              isSelected
                                ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-bold text-slate-900">{d.label}</span>
                              {isSelected && <Check className="h-4 w-4 text-indigo-600" />}
                            </div>
                            <p className="text-xs text-slate-500">{d.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* =========================================================================
              9. LANGUAGE & REGION CATEGORY
          ========================================================================= */}
          {activeCategory === "language" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <Card className="p-6 sm:p-8 rounded-3xl border-slate-200/80 bg-white shadow-xs">
                <CardHeader className="p-0 mb-6 border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900">Language & Regional Standards</CardTitle>
                      <p className="text-xs text-slate-500 mt-1">
                        Format timestamps, dates, and select localized language preferences.
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <div className="space-y-5">
                  {/* Language Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-indigo-600" />
                      Interface Language
                    </label>
                    <select
                      value={userPrefs?.language || "en"}
                      onChange={(e) => handleUpdateUserPref({ language: e.target.value })}
                      className="w-full h-11 px-3.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    >
                      <option value="en">English (United States)</option>
                      <option value="es">Español (Spanish)</option>
                      <option value="fr">Français (French)</option>
                      <option value="de">Deutsch (German)</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                      <option value="ja">日本語 (Japanese)</option>
                    </select>
                  </div>

                  {/* Timezone */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Primary Timezone
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => {
                        setTimezone(e.target.value);
                        if (user?.id) {
                          profileService.updateProfile(user.id, { timezone: e.target.value });
                        }
                      }}
                      className="w-full h-11 px-3.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Format & Time Format */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Date Format
                      </label>
                      <select
                        value={userPrefs?.date_format || "MM/DD/YYYY"}
                        onChange={(e) => handleUpdateUserPref({ date_format: e.target.value })}
                        className="w-full h-11 px-3.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/25/2026)</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 25/09/2026)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (ISO standard)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Time Format
                      </label>
                      <select
                        value={userPrefs?.time_format || "12h"}
                        onChange={(e) => handleUpdateUserPref({ time_format: e.target.value as "12h" | "24h" })}
                        className="w-full h-11 px-3.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      >

                        <option value="12h">12-hour clock (AM/PM)</option>
                        <option value="24h">24-hour military clock</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* =========================================================================
              10. SECURITY CATEGORY
          ========================================================================= */}
          {activeCategory === "security" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Change Password Card */}
              <Card className="p-6 sm:p-8 rounded-3xl border-slate-200/80 bg-white shadow-xs">
                <CardHeader className="p-0 mb-6 border-b border-slate-100 pb-4">
                  <CardTitle className="text-lg font-bold text-slate-900">Change Password</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    Update your account password securely using Supabase Auth.
                  </p>
                </CardHeader>

                {passwordError && (
                  <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="New Password *"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      leftIcon={<Lock className="h-4 w-4" />}
                      required
                    />
                    <Input
                      label="Confirm New Password *"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      leftIcon={<Lock className="h-4 w-4" />}
                      required
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={isChangingPassword || !newPassword}
                      className="font-bold"
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                          Updating Password...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Active Sessions & Devices */}
              <Card className="p-6 sm:p-8 rounded-3xl border-slate-200/80 bg-white shadow-xs">
                <CardHeader className="p-0 mb-6 border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900">Active Devices & Sessions</CardTitle>
                      <p className="text-xs text-slate-500 mt-1">
                        Monitor where your SkillSwap account is currently authenticated.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSignOutOtherDevices}
                      disabled={isSigningOutOthers}
                      className="text-xs font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                    >
                      {isSigningOutOthers ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      ) : (
                        <LogOut className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Sign Out Other Devices
                    </Button>
                  </div>
                </CardHeader>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-xl bg-white text-indigo-600 border border-slate-200 shadow-2xs">
                      <Monitor className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">Current Session</span>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                          This Device
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Active now • Secure JWT authenticated session
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
              </Card>

              {/* Two-Factor Authentication (2FA) UI Preparation */}
              <Card className="p-6 sm:p-8 rounded-3xl border-slate-200/80 bg-white shadow-xs">
                <CardHeader className="p-0 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Key className="h-5 w-5 text-indigo-600" />
                        Two-Factor Authentication (2FA)
                      </CardTitle>
                      <p className="text-xs text-slate-500 mt-1">
                        Add an extra layer of defense with a time-based one-time password (TOTP).
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      Coming Soon
                    </Badge>
                  </div>
                </CardHeader>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Two-Factor Authentication requires an authenticator application (Google Authenticator, Authy, or 1Password) upon login. Supabase MFA enrollment will be activated in upcoming security updates.
                  </p>
                </div>
              </Card>
            </div>
          )}

          {/* =========================================================================
              11. DATA & PRIVACY CATEGORY (Includes Danger Zone)
          ========================================================================= */}
          {activeCategory === "data_privacy" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Data Export & Summary */}
              <Card className="p-6 sm:p-8 rounded-3xl border-slate-200/80 bg-white shadow-xs">
                <CardHeader className="p-0 mb-6 border-b border-slate-100 pb-4">
                  <CardTitle className="text-lg font-bold text-slate-900">Personal Data Export</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    Download an offline JSON archive of all your profile, session history, reviews, and credits.
                  </p>
                </CardHeader>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">GDPR & CCPA Data Compliance</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-lg">
                      Your export contains only personal records belonging to your account UUID, including skills, transactions, messages history, and preferences.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleExportData}
                    disabled={isExportingData}
                    className="font-bold shrink-0"
                  >
                    {isExportingData ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        Generating Archive...
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Export Personal Data (JSON)
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              {/* DANGER ZONE */}
              <Card className="p-6 sm:p-8 rounded-3xl border-rose-200 bg-rose-50/30 shadow-xs">
                <CardHeader className="p-0 mb-6 border-b border-rose-100 pb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-rose-600" />
                    <CardTitle className="text-lg font-bold text-rose-900">Danger Zone</CardTitle>
                  </div>
                  <p className="text-xs text-rose-700/80 mt-1">
                    Irreversible actions regarding account deactivation and permanent data erasure.
                  </p>
                </CardHeader>

                <div className="space-y-4">
                  {/* Account Deactivation */}
                  <div className="p-4 rounded-2xl bg-white border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Deactivate Account</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Hide your profile from mentor discovery and reject incoming requests without erasing history.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeactivateModal(true)}
                      className="font-bold text-amber-700 border-amber-300 hover:bg-amber-50 shrink-0"
                    >
                      Deactivate Account
                    </Button>
                  </div>

                  {/* Permanent Account Deletion */}
                  <div className="p-4 rounded-2xl bg-white border border-rose-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-rose-950">Delete Account Permanently</h4>
                      <p className="text-xs text-rose-700/80 mt-0.5">
                        Permanently purge your profile, skills, credits, reviews, and session data. This cannot be undone.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setDeleteConfirmationPhrase("");
                        setDeleteError(null);
                        setShowDeleteModal(true);
                      }}
                      className="font-bold bg-rose-600 hover:bg-rose-700 text-white shrink-0"
                    >
                      Delete Account
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* =========================================================================
              12. HELP & SUPPORT CATEGORY
          ========================================================================= */}
          {activeCategory === "help" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <Card className="p-6 sm:p-8 rounded-3xl border-slate-200/80 bg-white shadow-xs">
                <CardHeader className="p-0 mb-6 border-b border-slate-100 pb-4">
                  <CardTitle className="text-lg font-bold text-slate-900">Frequently Asked Questions</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    Quick answers to common questions about SkillSwap credits, sessions, and calls.
                  </p>
                </CardHeader>

                <div className="space-y-3">
                  {[
                    {
                      q: "How do time credits work?",
                      a: "Every new member receives 50 welcome credits upon onboarding. Teaching a 30-minute session earns you 10 credits, while learning a skill spends 10 credits.",
                    },
                    {
                      q: "What happens if a peer misses a scheduled session?",
                      a: "If a peer does not attend or cancels past the notice window, the session can be resolved or cancelled with automatic credit refund protection.",
                    },
                    {
                      q: "Are video calls peer-to-peer?",
                      a: "Yes! Video and audio sessions run using WebRTC peer-to-peer technology with encrypted data channels and STUN/TURN signaling.",
                    },
                    {
                      q: "Can I teach and learn multiple skills simultaneously?",
                      a: "Absolutely! You can register unlimited teaching and learning skills in your portfolio from the Profile Settings tab.",
                    },
                  ].map((faq, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <h4 className="text-sm font-bold text-slate-900 mb-1">{faq.q}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">Need personalized assistance?</h5>
                    <p className="text-xs text-slate-500">
                      Our support team responds within 24 hours to peer inquiries.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => showToast("Support ticket draft opened. Email us at support@skillswap.local")}
                    className="font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    Contact Support
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* =========================================================================
              13. ABOUT CATEGORY
          ========================================================================= */}
          {activeCategory === "about" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <Card className="p-6 sm:p-8 rounded-3xl border-slate-200/80 bg-white shadow-xs">
                <CardHeader className="p-0 mb-6 border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900">About SkillSwap</CardTitle>
                      <p className="text-xs text-slate-500 mt-1">
                        Peer skill exchange network built on mutual reciprocity and time equity.
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono">
                      v1.0.0
                    </Badge>
                  </div>

                </CardHeader>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Architecture & Stack
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Next.js 15 App Router, TypeScript, Tailwind CSS, Supabase (Postgres, Row Level Security, Storage, Realtime), WebRTC Signaling, and Lucide Icons.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Terms of Service
                      </span>
                      <p className="text-xs text-slate-600">
                        Mutual respect, ethical skill sharing, non-commercial peer time currency, and transparent ratings.
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Privacy Policy
                      </span>
                      <p className="text-xs text-slate-600">
                        Data minimization, client-side encryption options, no third-party data tracking or selling.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          MODALS: DEACTIVATE & DELETE ACCOUNT
      ========================================================================= */}

      {/* Deactivate Confirmation Modal */}
      <Modal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        title="Deactivate Account?"
        description="Your profile will be hidden from public discovery and connection requests will be suspended."
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-600 leading-relaxed">
            You can re-activate your profile at any time by updating your privacy visibility settings back to &quot;Everyone&quot;. Your credits and completed history will remain safe.
          </p>


          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDeactivateModal(false)}
              disabled={isDeactivating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleDeactivateAccount}
              disabled={isDeactivating}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              {isDeactivating ? "Deactivating..." : "Confirm Deactivation"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal with Typed Verification Phrase */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Permanently Delete Account"
        description="This action is irreversible. All your data, profile, skills, credits, and sessions will be destroyed."
      >
        <div className="space-y-4 pt-2">
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Warning: Permanent Data Erasure</span>
              <p className="text-[11px] text-rose-700">
                Cascading deletion will immediately wipe your skills portfolio, schedule availability, credit transactions, reviews, and private preferences.
              </p>
            </div>
          </div>

          {deleteError && (
            <div className="p-3 rounded-xl bg-rose-100 text-rose-800 text-xs font-semibold">
              {deleteError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Type <span className="text-rose-600 font-mono">DELETE MY ACCOUNT</span> to confirm:
            </label>
            <input
              type="text"
              value={deleteConfirmationPhrase}
              onChange={(e) => setDeleteConfirmationPhrase(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
              className="w-full h-11 px-3.5 text-sm bg-white border border-rose-200 rounded-xl focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none"
              disabled={isDeletingAccount}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeletingAccount}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleDeleteAccount}
              disabled={
                isDeletingAccount ||
                deleteConfirmationPhrase.trim().toUpperCase() !== "DELETE MY ACCOUNT"
              }
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {isDeletingAccount ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Deleting Account...
                </>
              ) : (
                "Permanently Delete"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
