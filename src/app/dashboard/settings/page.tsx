"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { LOCATIONS, TIMEZONES } from "@/constants/config";
import { User, Briefcase, MapPin, Globe } from "lucide-react";

export default function SettingsPage() {
  const { onboardingData, updateOnboardingData, showToast } = useApp();

  const [fullName, setFullName] = useState(onboardingData.fullName);
  const [headline, setHeadline] = useState(onboardingData.headline);
  const [bio, setBio] = useState(onboardingData.bio);
  const [location, setLocation] = useState(onboardingData.location);
  const [timezone, setTimezone] = useState(onboardingData.timezone);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateOnboardingData({
      fullName,
      headline,
      bio,
      location,
      timezone,
    });
    showToast("Profile settings saved successfully!");
  };

  const handleDiscard = () => {
    setFullName(onboardingData.fullName);
    setHeadline(onboardingData.headline);
    setBio(onboardingData.bio);
    setLocation(onboardingData.location);
    setTimezone(onboardingData.timezone);
    showToast("Changes discarded.");
  };

  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in duration-200">
      <PageHeader
        title="Account & Profile Settings"
        description="Update your personal details, location preferences, and public bio."
      />

      <Card className="p-6 sm:p-8 rounded-3xl border-slate-200 bg-white">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar Header */}
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <Avatar src={onboardingData.avatarUrl} size="lg" isOnline={true} />
            <div>
              <h4 className="text-sm font-bold text-slate-900">{onboardingData.fullName}</h4>
              <p className="text-xs text-indigo-600 font-semibold">{onboardingData.headline}</p>
              <Link
                href="/onboarding"
                className="text-xs text-slate-500 hover:text-indigo-600 font-semibold mt-1 inline-block"
              >
                Change photo in Onboarding →
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftIcon={<User className="h-4 w-4" />}
              required
            />
            <Input
              label="Professional Headline *"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              leftIcon={<Briefcase className="h-4 w-4" />}
              required
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
              placeholder="Tell other learners about your passions..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Location"
              leftIcon={<MapPin className="h-4 w-4" />}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              options={LOCATIONS}
            />
            <Select
              label="Timezone"
              leftIcon={<Globe className="h-4 w-4" />}
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              options={TIMEZONES}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleDiscard}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
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
  );
}
