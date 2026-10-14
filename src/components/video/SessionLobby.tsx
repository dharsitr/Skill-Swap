"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { SessionWithRelations } from "@/lib/supabase/services";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ArrowLeft,
  Sparkles,
  User,
  ShieldCheck,
  AlertCircle,
  LogIn,
} from "lucide-react";

interface SessionLobbyProps {
  session: SessionWithRelations;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string | null;
  onJoin: (options: {
    audioEnabled: boolean;
    videoEnabled: boolean;
    stream: MediaStream | null;
  }) => void;
}

export const SessionLobby: React.FC<SessionLobbyProps> = ({
  session,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onJoin,
}) => {
  const isTeacher = session.teacher_id === currentUserId;
  const partner = isTeacher ? session.learner : session.teacher;
  const partnerName = partner?.display_name || partner?.username || "Session Partner";
  const partnerRole = isTeacher ? "Learner" : "Teacher";

  // State: Default camera is OFF, default mic is OFF (permission asked on toggle)
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Sync preview video element with previewStream
  useEffect(() => {
    if (videoRef.current) {
      if (previewStream && cameraOn) {
        videoRef.current.srcObject = previewStream;
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [previewStream, cameraOn]);

  // Audio analyzer for live mic meter
  useEffect(() => {
    if (!micOn || !previewStream) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setAudioLevel(0);
      return;
    }

    const audioTrack = previewStream.getAudioTracks()[0];
    if (!audioTrack || !audioTrack.enabled) {
      setAudioLevel(0);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(new MediaStream([audioTrack]));
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch {
      // AudioContext may be restricted before user gesture
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [micOn, previewStream]);

  // Cleanup preview media on unmount if user navigates away without joining
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Toggle Camera: prompts for camera permission when clicked
  const handleToggleCamera = async () => {
    setPermissionError(null);

    if (cameraOn) {
      // Turn Camera OFF
      if (previewStream) {
        const vTrack = previewStream.getVideoTracks()[0];
        if (vTrack) {
          vTrack.enabled = false;
        }
      }
      setCameraOn(false);
    } else {
      // Turn Camera ON -> Ask permission if not yet acquired
      try {
        let stream = previewStream;
        const existingTrack = stream?.getVideoTracks()[0];

        if (existingTrack && existingTrack.readyState === "live") {
          existingTrack.enabled = true;
        } else {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            },
          });
          const newVideoTrack = videoStream.getVideoTracks()[0];

          if (!stream) {
            stream = new MediaStream([newVideoTrack]);
          } else {
            stream.addTrack(newVideoTrack);
          }
        }

        if (stream) {
          setPreviewStream(new MediaStream(stream.getTracks()));
        }
        setCameraOn(true);
      } catch (err: unknown) {
        console.warn("[Lobby] Camera permission denied:", err);
        const errMsg = err instanceof Error ? err.name : "";
        if (errMsg === "NotAllowedError" || errMsg === "PermissionDeniedError") {
          setPermissionError("Camera access was denied. Please allow camera permissions in your browser address bar.");
        } else {
          setPermissionError("Could not access camera device.");
        }
      }
    }
  };

  // Toggle Microphone: prompts for mic permission when clicked
  const handleToggleMic = async () => {
    setPermissionError(null);

    if (micOn) {
      // Turn Mic OFF
      if (previewStream) {
        const aTrack = previewStream.getAudioTracks()[0];
        if (aTrack) {
          aTrack.enabled = false;
        }
      }
      setMicOn(false);
    } else {
      // Turn Mic ON -> Ask permission if not yet acquired
      try {
        let stream = previewStream;
        const existingTrack = stream?.getAudioTracks()[0];

        if (existingTrack && existingTrack.readyState === "live") {
          existingTrack.enabled = true;
        } else {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          const newAudioTrack = audioStream.getAudioTracks()[0];

          if (!stream) {
            stream = new MediaStream([newAudioTrack]);
          } else {
            stream.addTrack(newAudioTrack);
          }
        }

        if (stream) {
          setPreviewStream(new MediaStream(stream.getTracks()));
        }
        setMicOn(true);
      } catch (err: unknown) {
        console.warn("[Lobby] Microphone permission denied:", err);
        const errMsg = err instanceof Error ? err.name : "";
        if (errMsg === "NotAllowedError" || errMsg === "PermissionDeniedError") {
          setPermissionError("Microphone access was denied. Please allow microphone permissions in your browser address bar.");
        } else {
          setPermissionError("Could not access microphone device.");
        }
      }
    }
  };

  // Join Call handler
  const handleJoinClick = () => {
    onJoin({
      audioEnabled: micOn,
      videoEnabled: cameraOn,
      stream: previewStream,
    });
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-6 px-4">
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/sessions"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sessions
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Ready for Call
          </div>
        </div>

        {/* Main Google Meet Style Lobby Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: 16:9 Live Preview Stage */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl flex items-center justify-center group">
              {/* Active Video Stream Mirror */}
              {cameraOn && previewStream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />
              ) : (
                /* Camera is OFF by default view */
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 select-none">
                  <div className="relative">
                    {currentUserAvatar ? (
                      <img
                        src={currentUserAvatar}
                        alt={currentUserName}
                        className="w-24 h-24 rounded-full object-cover border-2 border-zinc-700 shadow-xl"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-zinc-400">
                        <User className="w-10 h-10" />
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 p-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-rose-400 shadow">
                      <VideoOff className="w-4 h-4" />
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-200">Camera is off</h4>
                    <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                      Default camera is turned off for privacy. Click the camera button below to turn it on.
                    </p>
                  </div>
                </div>
              )}

              {/* Top overlay: User info & Mic status indicator */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md text-xs font-medium text-white border border-white/10">
                  {currentUserName} (You)
                </span>
                {micOn ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                    <Mic className="w-3.5 h-3.5" />
                    <div className="flex items-center gap-0.5 h-3">
                      <span
                        className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(4, (audioLevel / 100) * 12)}px` }}
                      />
                      <span
                        className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(4, (audioLevel / 100) * 16)}px` }}
                      />
                      <span
                        className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(4, (audioLevel / 100) * 10)}px` }}
                      />
                    </div>
                  </div>
                ) : (
                  <span className="p-1.5 rounded-xl bg-rose-500/20 backdrop-blur-md text-rose-400 border border-rose-500/30" title="Microphone is off">
                    <MicOff className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              {/* Floating Google Meet Pill Controls on Preview */}
              <div className="absolute bottom-5 inset-x-0 z-10 flex items-center justify-center gap-4">
                {/* Microphone Toggle Button */}
                <button
                  type="button"
                  onClick={handleToggleMic}
                  className={`p-3.5 rounded-full font-bold transition-all transform active:scale-95 shadow-xl cursor-pointer ${
                    micOn
                      ? "bg-zinc-800/90 hover:bg-zinc-700 text-white border border-zinc-600 backdrop-blur-md"
                      : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50"
                  }`}
                  title={micOn ? "Mute microphone" : "Turn microphone on (asks permission)"}
                >
                  {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                {/* Camera Toggle Button */}
                <button
                  type="button"
                  onClick={handleToggleCamera}
                  className={`p-3.5 rounded-full font-bold transition-all transform active:scale-95 shadow-xl cursor-pointer ${
                    cameraOn
                      ? "bg-zinc-800/90 hover:bg-zinc-700 text-white border border-zinc-600 backdrop-blur-md"
                      : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50"
                  }`}
                  title={cameraOn ? "Turn camera off" : "Turn camera on (asks permission)"}
                >
                  {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Inline Permission Notice if Denied */}
            {permissionError && (
              <div className="mt-3 w-full p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="flex-1 font-medium">{permissionError}</p>
              </div>
            )}
          </div>

          {/* Right: Meeting Information & Join Now CTA */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>1-on-1 Swap Meeting</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Ready to join?
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Step into your session with {partnerName}.
              </p>
            </div>

            {/* Session Card */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Session Topic
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {session.skill?.name || "Skill Swap Session"}
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-600/10 text-indigo-700 text-xs font-bold">
                  {session.duration || 60} mins
                </span>
              </div>

              {/* Partner Card */}
              <div className="flex items-center gap-3">
                {partner?.avatar_url ? (
                  <img
                    src={partner.avatar_url}
                    alt={partnerName}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                    <User className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{partnerName}</h4>
                  <p className="text-xs text-slate-500">
                    {partnerRole} in this swap
                  </p>
                </div>
              </div>
            </div>

            {/* Join Button & Fullscreen Prompt */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleJoinClick}
                className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-600/25 transition-all transform active:scale-[0.98] cursor-pointer"
              >
                <LogIn className="w-5 h-5" />
                <span>Join now (Full Screen)</span>
              </button>

              {/* Privacy & Permissions Assurance Badge */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-100/70 text-slate-600 text-xs leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  Default camera is off. Microphone and camera access are requested only when you choose to turn them on. Once joined, your call opens in full screen like Google Meet.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
