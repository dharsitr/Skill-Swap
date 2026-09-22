"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { POPULAR_SKILLS } from "@/data/mockData";
import { Calendar, Clock, ArrowRight, Sparkles, Video } from "lucide-react";

export default function DashboardOverviewPage() {
  const { onboardingData, userCredits, sessions, showToast } = useApp();
  const [selectedPartner, setSelectedPartner] = useState<string>("");
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("");

  const upcomingSessions = sessions.filter((s) => s.status === "upcoming");

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Good morning, {onboardingData.fullName.split(" ")[0] || "Dharsit"} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Keep learning, keep growing. You have {upcomingSessions.length} upcoming sessions scheduled.
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
            <Link
              href="/dashboard/profile"
              className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 group"
            >
              <span>View Profile & Wallet History</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
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
          <Link
            href="/dashboard/sessions"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            View all ({sessions.length}) →
          </Link>
        </div>

        <div className="space-y-3">
          {upcomingSessions.slice(0, 2).map((sess) => (
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
                      <Badge variant={sess.role === "teaching" ? "indigo" : "secondary"} size="sm">
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
                      setSessionModalOpen(true);
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
          <Link
            href="/dashboard/discover"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            Explore all mentors →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {POPULAR_SKILLS.slice(0, 4).map((skill) => (
            <Card
              key={skill.id}
              className="rounded-2xl border-slate-200/90 hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-500/5 transition-all p-5 flex flex-col justify-between group cursor-pointer"
              onClick={() => {
                setSelectedPartner("Community Mentor");
                setSelectedTopic(skill.name);
                setSwapModalOpen(true);
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

      {/* Join Call Modal */}
      <Modal
        isOpen={sessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
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
            <Button variant="outline" onClick={() => setSessionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setSessionModalOpen(false);
                showToast("Entering video call room... (Backend simulated)");
              }}
            >
              Enter Call
            </Button>
          </div>
        </div>
      </Modal>

      {/* Swap Request Modal */}
      <Modal
        isOpen={swapModalOpen}
        onClose={() => setSwapModalOpen(false)}
        title="Request 1-on-1 Skill Swap"
        description={`Send a session exchange request to ${selectedPartner}.`}
      >
        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs text-slate-700 space-y-1">
            <div><strong>Topic:</strong> {selectedTopic}</div>
            <div><strong>Cost:</strong> 1 Skill Credit (30 mins)</div>
            <div><strong>Your Balance:</strong> {userCredits} Credits Available</div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setSwapModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setSwapModalOpen(false);
                showToast(`Swap request sent for ${selectedTopic}!`);
              }}
              className="font-bold"
            >
              Send Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
