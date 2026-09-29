"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWebRTC } from "@/hooks/useWebRTC";
import {
  SessionWithRelations,
  chatService,
  ChatMessage,
} from "@/lib/supabase/services";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  Maximize2,
  Minimize2,
  PhoneOff,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  User,
  Activity,
  Send,
  Loader2,
  X,
} from "lucide-react";

interface VideoRoomProps {
  session: SessionWithRelations;
  currentUserId: string;
  currentUserName: string;
}

export const VideoRoom: React.FC<VideoRoomProps> = ({
  session,
  currentUserId,
  currentUserName,
}) => {
  const router = useRouter();

  const isTeacher = session.teacher_id === currentUserId;
  const partner = isTeacher ? session.learner : session.teacher;
  const partnerName = partner?.display_name || partner?.username || "Session Partner";
  const partnerRole = isTeacher ? "Learner" : "Teacher";

  // WebRTC Hook
  const {
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    connectionState,
    stats,
    error,
    isPeerPresent,
    remoteMediaState,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    endCall,
    retryConnection,
  } = useWebRTC({
    sessionId: session.id,
    currentUserId,
    currentUserName,
    isInitiator: isTeacher,
    expectedPeerId: isTeacher ? session.learner_id : session.teacher_id,
  });

  // Video element refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // UI state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  // Compact Session Chat State
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Call duration timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (connectionState === "connected") {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [connectionState]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Initialize Session Chat between Teacher and Learner
  useEffect(() => {
    if (!session.teacher_id || !session.learner_id) return;

    chatService
      .getOrCreateConversation(session.teacher_id, session.learner_id)
      .then((res) => {
        if (res.data) {
          setConversationId(res.data);
          chatService.getConversationMessages(res.data).then((msgRes) => {
            if (msgRes.data) {
              setChatMessages(msgRes.data);
              chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
            }
          });
        }
      });
  }, [session.teacher_id, session.learner_id]);

  // Subscribe to real-time chat messages
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = chatService.subscribeToConversation(conversationId, {
      onNewMessage: (newMsg) => {
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      },
    });

    return () => unsubscribe();
  }, [conversationId]);

  // Send message from video chat drawer
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !conversationId || isSendingMessage) return;

    const text = chatInput.trim();
    setChatInput("");
    setIsSendingMessage(true);

    try {
      await chatService.sendMessage(conversationId, currentUserId, text);
    } catch {
      // Handled
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Handle End Call
  const handleEndCall = () => {
    endCall();
    router.push("/dashboard/sessions");
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[calc(100vh-5rem)] bg-zinc-950 text-white rounded-3xl overflow-hidden flex flex-col border border-zinc-800 shadow-2xl select-none"
    >
      {/* Top Bar: Session Info, Network Stats & Timer */}
      <div className="absolute top-0 inset-x-0 z-20 px-6 py-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>{session.skill?.name || "Skill Swap Session"}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                1-on-1 Swap
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              with {partnerName} ({partnerRole})
            </p>
          </div>
        </div>

        {/* Center: Live Timer & Connection Status */}
        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 backdrop-blur-md text-xs font-mono font-semibold flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                connectionState === "connected"
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-amber-400"
              }`}
            />
            <span>{formatTimer(callDuration)}</span>
          </div>

          {/* Network Quality Indicator */}
          {stats && (
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border backdrop-blur-md ${
                stats.quality === "excellent" || stats.quality === "good"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : stats.quality === "fair"
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              }`}
              title={`WebRTC Stats: RTT ${stats.rttMs ?? "--"}ms, Packet Loss ${stats.fractionLost}%`}
            >
              <Activity className="w-3 h-3" />
              <span>{stats.rttMs !== null ? `${stats.rttMs}ms` : stats.connectionState}</span>
            </div>
          )}
        </div>

        {/* Right: Chat Drawer Toggle & Fullscreen */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              chatOpen
                ? "bg-indigo-600 text-white"
                : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Session Chat</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main View Area: Video Grid & Side Chat */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* ================= Video Canvas ================= */}
        <div className="relative flex-1 bg-zinc-950 flex items-center justify-center p-4">
          {/* Remote Video (Main) */}
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-zinc-900 flex items-center justify-center border border-zinc-800/80">
            {remoteStream && !remoteMediaState?.isVideoOff ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                {partner?.avatar_url ? (
                  <img
                    src={partner.avatar_url}
                    alt={partnerName}
                    className="w-24 h-24 rounded-full object-cover border-2 border-zinc-700 shadow-xl"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-zinc-400">
                    <User className="w-10 h-10" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-white">{partnerName}</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    {!isPeerPresent
                      ? "Waiting for peer to join the video room..."
                      : remoteMediaState?.isVideoOff
                      ? "Peer turned their camera off"
                      : "Connecting audio and video stream..."}
                  </p>
                </div>
              </div>
            )}

            {/* Remote Peer Name & Status Overlay */}
            <div className="absolute bottom-4 left-4 z-10 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-xs font-medium text-white flex items-center gap-2 border border-white/10">
              <span>{partnerName}</span>
              {remoteMediaState?.isAudioMuted && (
                <span className="p-0.5 rounded bg-rose-500/20 text-rose-400" title="Peer muted">
                  <MicOff className="w-3 h-3" />
                </span>
              )}
              {remoteMediaState?.isScreenSharing && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 font-semibold">
                  Sharing Screen
                </span>
              )}
            </div>

            {/* Error / Reconnect Alert Banner */}
            {error && (
              <div className="absolute top-20 inset-x-6 z-30 max-w-md mx-auto p-3.5 rounded-2xl bg-rose-500/90 backdrop-blur-md text-white text-xs flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={retryConnection}
                  className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Local Video Picture-in-Picture (PiP) */}
          <div className="absolute bottom-6 right-6 z-20 w-44 sm:w-56 aspect-video rounded-2xl overflow-hidden bg-zinc-900 border-2 border-zinc-700 shadow-2xl">
            {localStream && !isVideoOff ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!isScreenSharing ? "-scale-x-100" : ""}`}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-400">
                <VideoOff className="w-6 h-6 mb-1" />
                <span className="text-[10px]">Camera off</span>
              </div>
            )}

            {/* Local User Tag */}
            <div className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-semibold text-white flex items-center gap-1.5">
              <span>You</span>
              {isAudioMuted && <MicOff className="w-2.5 h-2.5 text-rose-400" />}
              {isScreenSharing && <span className="text-[9px] text-indigo-400">Screen</span>}
            </div>
          </div>
        </div>

        {/* ================= Compact Session Chat Drawer ================= */}
        {chatOpen && (
          <div className="w-80 border-l border-zinc-800 bg-zinc-900/95 flex flex-col h-full z-20 animate-in slide-in-from-right duration-200">
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                Session Notes & Chat
              </span>
              <button
                onClick={() => setChatOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
              {chatMessages.length > 0 ? (
                chatMessages.map((m) => {
                  const isMe = m.sender_id === currentUserId;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2 leading-relaxed ${
                          isMe
                            ? "bg-indigo-600 text-white rounded-br-xs"
                            : "bg-zinc-800 text-zinc-200 rounded-bl-xs border border-zinc-700/60"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      </div>
                      <span className="text-[9px] text-zinc-500 mt-0.5 px-1">
                        {new Date(m.created_at).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-500 space-y-1">
                  <MessageSquare className="w-6 h-6 text-zinc-600" />
                  <p className="text-xs">No chat messages yet</p>
                  <p className="text-[10px]">Share code links, notes, or tips during the swap!</p>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input */}
            <form
              onSubmit={handleSendChatMessage}
              className="p-2.5 border-t border-zinc-800 bg-zinc-900 flex items-center gap-1.5"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Send a note in call..."
                className="flex-1 px-3 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-xl outline-none focus:border-indigo-500 text-white placeholder-zinc-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isSendingMessage}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold transition-all cursor-pointer"
              >
                {isSendingMessage ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ================= Bottom Controls Bar ================= */}
      <div className="z-20 px-6 py-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center justify-center gap-3">
        {/* Mic Toggle */}
        <button
          onClick={toggleAudio}
          className={`p-3.5 rounded-2xl font-bold transition-all cursor-pointer flex items-center justify-center shadow-lg ${
            isAudioMuted
              ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30"
              : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
          }`}
          title={isAudioMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={toggleVideo}
          className={`p-3.5 rounded-2xl font-bold transition-all cursor-pointer flex items-center justify-center shadow-lg ${
            isVideoOff
              ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30"
              : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
          }`}
          title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        {/* Screen Share Toggle */}
        <button
          onClick={toggleScreenShare}
          className={`p-3.5 rounded-2xl font-bold transition-all cursor-pointer flex items-center justify-center shadow-lg ${
            isScreenSharing
              ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30"
              : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
          }`}
          title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
        >
          <ScreenShare className="w-5 h-5" />
        </button>

        {/* End Call Button */}
        <button
          onClick={handleEndCall}
          className="px-5 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-900/40 ml-2"
          title="End Call and Leave Room"
        >
          <PhoneOff className="w-5 h-5" />
          <span>Leave Call</span>
        </button>
      </div>
    </div>
  );
};
