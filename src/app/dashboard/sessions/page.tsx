"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmationDialog } from "@/components/ui/states/ConfirmationDialog";
import { EmptyState } from "@/components/ui/states/EmptyState";
import { Calendar, Clock, Video, Plus } from "lucide-react";

export default function SessionsPage() {
  const router = useRouter();
  const { sessions, cancelSession, showToast } = useApp();
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");

  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState("");

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState<string | null>(null);

  const filteredSessions = sessions.filter((s) => {
    if (filter === "all") return true;
    return s.status === filter;
  });

  const confirmCancel = () => {
    if (sessionToCancel) {
      cancelSession(sessionToCancel);
      setCancelModalOpen(false);
      setSessionToCancel(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Sessions Schedule"
        description="Manage your upcoming 1-on-1 knowledge swaps and view past exchange history."
        action={
          <Link href="/dashboard/discover">
            <Button variant="primary" size="md" className="font-bold shadow-xs">
              <Plus className="h-4 w-4 mr-1.5" />
              Book New Session
            </Button>
          </Link>
        }
      />

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "upcoming", "completed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
              filter === tab
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Sessions List or Empty State */}
      {filteredSessions.length > 0 ? (
        <div className="space-y-3">
          {filteredSessions.map((sess) => (
            <Card key={sess.id} className="p-5 rounded-2xl border-slate-200 hover:shadow-sm transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar src={sess.partnerAvatar} size="md" isOnline={sess.status === "upcoming"} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-slate-900">{sess.topic}</h4>
                      <Badge variant={sess.role === "teaching" ? "indigo" : "secondary"} size="sm">
                        {sess.role === "teaching" ? "Teaching" : "Learning"}
                      </Badge>
                      <Badge variant={sess.status === "upcoming" ? "success" : "default"} size="sm">
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
                        onClick={() => {
                          setSessionToCancel(sess.id);
                          setCancelModalOpen(true);
                        }}
                        className="text-rose-600 hover:bg-rose-50 border-slate-200"
                      >
                        Cancel
                      </Button>
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
      ) : (
        <EmptyState
          icon={<Calendar className="h-6 w-6" />}
          title="No sessions found"
          description={
            filter === "upcoming"
              ? "You have no upcoming sessions scheduled. Discover mentors to book a swap!"
              : "No completed session records match your filter."
          }
          actionLabel="Find Mentors"
          onAction={() => router.push("/dashboard/discover")}
        />
      )}

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

      {/* Cancel Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={confirmCancel}
        title="Cancel Session?"
        description="Are you sure you want to cancel this session? Your locked credit will be immediately refunded."
        confirmLabel="Yes, Cancel Session"
        isDestructive={true}
      />
    </div>
  );
}
