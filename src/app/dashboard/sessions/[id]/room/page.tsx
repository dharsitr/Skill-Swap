"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { SessionWithRelations } from "@/lib/supabase/services";
import { VideoRoom } from "@/components/video/VideoRoom";
import { SessionLobby } from "@/components/video/SessionLobby";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert,
  Calendar,
  ArrowLeft,
  Loader2,
  Video,
} from "lucide-react";

interface RoomPageProps {
  params: Promise<{ id: string }>;
}

export default function SessionVideoRoomPage({ params }: RoomPageProps) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;

  const router = useRouter();
  const { user, profile, isLoading: authLoading } = useAuth();

  const [session, setSession] = useState<SessionWithRelations | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Google Meet Pre-join Lobby State
  const [hasJoined, setHasJoined] = useState(false);
  const [lobbyMedia, setLobbyMedia] = useState<{
    audioEnabled: boolean;
    videoEnabled: boolean;
    stream: MediaStream | null;
  }>({
    audioEnabled: false,
    videoEnabled: false,
    stream: null,
  });

  useEffect(() => {
    if (!sessionId || !user) return;

    async function loadSession() {
      setIsLoadingSession(true);
      setError(null);

      try {
        const { data, error: fetchErr } = await supabase.client
          .from("sessions")
          .select(`
            *,
            teacher:profiles!sessions_teacher_id_fkey(*),
            learner:profiles!sessions_learner_id_fkey(*),
            skill:skills(*)
          `)
          .eq("id", sessionId)
          .single();

        if (fetchErr || !data) {
          setError("Session not found or has been removed.");
          return;
        }

        const sess = data as unknown as SessionWithRelations;

        // Security check: Must be a participant
        if (!user || (sess.teacher_id !== user.id && sess.learner_id !== user.id)) {
          setError("Unauthorized: You are not a participant in this 1-on-1 session.");
          return;
        }

        setSession(sess);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load session room.");
      } finally {
        setIsLoadingSession(false);
      }
    }

    if (!authLoading) {
      loadSession();
    }
  }, [sessionId, user, authLoading]);

  // Loading state
  if (authLoading || isLoadingSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 shadow-lg">
          <Video className="w-8 h-8 animate-pulse" />
        </div>
        <p className="text-sm font-semibold text-slate-600 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Connecting to secure session room...
        </p>
      </div>
    );
  }

  // Error / Unauthorized state
  if (error || !session) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-4 shadow-sm animate-in fade-in duration-200">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
          <p className="text-xs text-slate-500 mt-1">
            {error || "You do not have permission to join this video session."}
          </p>
        </div>
        <Link href="/dashboard/sessions">
          <Button variant="outline" size="sm" className="font-semibold text-xs mt-2">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Sessions
          </Button>
        </Link>
      </div>
    );
  }

  // Session not yet confirmed state
  if (session.status !== "confirmed") {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-4 shadow-sm animate-in fade-in duration-200">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <Calendar className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Session Not Confirmed</h3>
          <p className="text-xs text-slate-500 mt-1">
            This session is currently marked as <strong>{session.status}</strong>. Video calls are only available for confirmed sessions.
          </p>
        </div>
        <Link href="/dashboard/sessions">
          <Button variant="primary" size="sm" className="font-bold text-xs mt-2">
            View Session Details
          </Button>
        </Link>
      </div>
    );
  }

  const currentUserName = profile?.display_name || user?.email?.split("@")[0] || "Participant";
  const currentUserAvatar = profile?.avatar_url;

  // Handle Google Meet "Join Now" Click (Enters fullscreen and connects room)
  const handleJoin = (options: {
    audioEnabled: boolean;
    videoEnabled: boolean;
    stream: MediaStream | null;
  }) => {
    // Request browser full screen directly on user click
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {
      // Ignored if restricted
    }

    setLobbyMedia(options);
    setHasJoined(true);
  };

  // Google Meet Flow:
  // Step 1: Pre-Join Green Room / Lobby (Default camera OFF, prompts for permission on toggle)
  if (!hasJoined) {
    return (
      <SessionLobby
        session={session}
        currentUserId={user!.id}
        currentUserName={currentUserName}
        currentUserAvatar={currentUserAvatar || undefined}
        onJoin={handleJoin}
      />
    );
  }

  // Step 2: Active Call in Full Screen (like Google Meet)
  return (
    <VideoRoom
      session={session}
      currentUserId={user!.id}
      currentUserName={currentUserName}
      initialStream={lobbyMedia.stream}
      initialAudioEnabled={lobbyMedia.audioEnabled}
      initialVideoEnabled={lobbyMedia.videoEnabled}
      onLeave={() => {
        setHasJoined(false);
        router.push("/dashboard/sessions");
      }}
    />
  );
}
