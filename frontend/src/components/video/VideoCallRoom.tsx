import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  GraduationCap,
  Sparkles,
  WifiOff,
  Loader2,
  AlertCircle,
  Clock,
  ScreenShare,
  ScreenShareOff,
} from 'lucide-react';
import type { VideoCallState } from '@/types/webrtc';

interface VideoCallRoomProps {
  sessionId: string;
  state: VideoCallState;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onStartScreenShare: () => Promise<void>;
  onStopScreenShare: () => Promise<void>;
  onLeaveCall: () => Promise<void>;
}

export const VideoCallRoom: React.FC<VideoCallRoomProps> = ({
  sessionId,
  state,
  onToggleAudio,
  onToggleVideo,
  onStartScreenShare,
  onStopScreenShare,
  onLeaveCall,
}) => {
  const navigate = useNavigate();
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localScreenRef = useRef<HTMLVideoElement | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  // Attach local media stream
  useEffect(() => {
    if (localVideoRef.current && state.localStream) {
      localVideoRef.current.srcObject = state.localStream;
    }
  }, [state.localStream]);

  // Attach remote media stream (camera or screen share)
  useEffect(() => {
    if (remoteVideoRef.current && state.remoteStream) {
      remoteVideoRef.current.srcObject = state.remoteStream;
    }
  }, [state.remoteStream]);

  // Attach local screen share stream
  useEffect(() => {
    if (localScreenRef.current && state.screenStream) {
      localScreenRef.current.srcObject = state.screenStream;
    }
  }, [state.screenStream]);

  // Call duration timer once connected
  useEffect(() => {
    if (state.status !== 'connected') return;

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [state.status]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLeaveAndExit = async () => {
    await onLeaveCall();
    navigate(`/sessions/${sessionId}`);
  };

  const partnerInitial = state.partnerName ? state.partnerName.charAt(0).toUpperCase() : 'P';
  const isTeacher = state.userRole === 'TEACHER' || state.isInitiator;
  const isTeachingMode = state.isScreenSharing || state.remoteIsScreenSharing;

  return (
    <div className="relative w-full h-[calc(100vh-4.5rem)] bg-[#000000] rounded-2xl overflow-hidden flex flex-col justify-between border border-neutral-900 shadow-2xl">
      {/* Top Header Overlay Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 sm:p-5 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-auto">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-[#111827]/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-neutral-800">
            {state.status === 'connected' ? (
              <span className="flex items-center gap-1.5 text-xs text-[#10B981] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                Live Call
              </span>
            ) : state.status === 'connecting' || state.status === 'authorizing' ? (
              <span className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                <Loader2 className="w-3 h-3 animate-spin" />
                Connecting...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
                <WifiOff className="w-3 h-3" />
                Offline
              </span>
            )}

            {state.status === 'connected' && (
              <div className="flex items-center gap-1 text-xs text-neutral-300 border-l border-neutral-700 pl-2">
                <Clock className="w-3 h-3 text-neutral-400" />
                <span>{formatDuration(callDuration)}</span>
              </div>
            )}
          </div>

          {/* Teaching Mode Indicator Badge */}
          {state.isScreenSharing && (
            <Badge variant="default" className="gap-1.5 bg-[#10B981]/20 text-[#34D399] border-[#10B981]/40 animate-in fade-in">
              <ScreenShare className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Teaching Mode • Sharing Screen</span>
            </Badge>
          )}

          {state.remoteIsScreenSharing && (
            <Badge variant="default" className="gap-1.5 bg-sky-500/20 text-sky-400 border-sky-500/40 animate-in fade-in">
              <ScreenShare className="w-3.5 h-3.5 text-sky-400" />
              <span>Teaching Mode • Teacher's Screen</span>
            </Badge>
          )}

          {state.skillName && !isTeachingMode && (
            <Badge variant="default" className="hidden sm:inline-flex gap-1 bg-[#10B981]/20 text-[#34D399] border-[#10B981]/30">
              <Sparkles className="w-3 h-3 text-[#10B981]" />
              {state.skillName}
            </Badge>
          )}

          {state.userRole && (
            <Badge variant="outline" className="hidden md:inline-flex text-xs border-neutral-700 text-neutral-300">
              <GraduationCap className="w-3 h-3 mr-1 text-[#10B981]" />
              {state.userRole === 'TEACHER' ? 'Instructor (Teacher)' : 'Student (Learner)'}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#111827]/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-neutral-800">
            {state.partnerAvatarUrl ? (
              <img
                src={state.partnerAvatarUrl}
                alt={state.partnerName || 'Partner'}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-[#1E293B] text-[#10B981] font-bold text-[10px] flex items-center justify-center">
                {partnerInitial}
              </div>
            )}
            <span className="text-xs font-semibold text-neutral-200 truncate max-w-[140px]">
              {state.partnerName || 'Peer Student'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Video Viewport Canvas */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center bg-[#050505] overflow-hidden">
        {/* State A: Local Screen Sharing (Teacher view of own shared screen) */}
        {state.isScreenSharing && state.screenStream ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <video
              ref={localScreenRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain bg-black"
            />
            <div className="absolute top-16 left-6 z-10 px-3 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-neutral-800 text-xs font-medium text-neutral-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>Your Shared Screen</span>
            </div>
          </div>
        ) : /* State B: Remote Video or Remote Screen Sharing */
        state.partnerConnected && state.remoteStream && (state.remoteMediaStatus.videoEnabled || state.remoteIsScreenSharing) ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain bg-black"
            />
            {state.remoteIsScreenSharing && (
              <div className="absolute top-16 left-6 z-10 px-3 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-neutral-800 text-xs font-medium text-sky-400 flex items-center gap-2">
                <ScreenShare className="w-3.5 h-3.5" />
                <span>{state.partnerName || 'Teacher'}'s Screen</span>
              </div>
            )}
          </div>
        ) : (
          /* State C: Partner Video Placeholder */
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-sm">
            <div className="relative">
              {state.partnerAvatarUrl ? (
                <img
                  src={state.partnerAvatarUrl}
                  alt={state.partnerName || 'Partner'}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-2 border-neutral-800 shadow-2xl"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#111827] border-2 border-neutral-800 flex items-center justify-center text-[#10B981] font-extrabold text-4xl shadow-2xl">
                  {partnerInitial}
                </div>
              )}
              {!state.remoteMediaStatus.audioEnabled && state.partnerConnected && (
                <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-red-600 border border-neutral-900 shadow">
                  <MicOff className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-neutral-100">
                {state.partnerName || 'Waiting for peer...'}
              </h2>
              <p className="text-xs text-neutral-400">
                {state.status === 'connected'
                  ? state.remoteMediaStatus.videoEnabled
                    ? 'Connected'
                    : 'Camera is turned off'
                  : state.status === 'connecting'
                  ? 'Waiting for peer to join room...'
                  : state.status === 'disconnected'
                  ? 'Peer has left the video call.'
                  : 'Establishing secure peer connection...'}
              </p>
            </div>
          </div>
        )}

        {/* Local PIP Video Preview */}
        <div className="absolute bottom-24 right-4 sm:right-6 w-32 sm:w-48 aspect-video rounded-2xl overflow-hidden border-2 border-neutral-800 bg-[#111827] shadow-2xl z-10">
          {state.localStream && !state.mediaStatus.isVideoOff ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror scale-x-[-1]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-[#0d121f]">
              <div className="w-8 h-8 rounded-full bg-[#1E293B] text-[#10B981] font-bold text-xs flex items-center justify-center">
                You
              </div>
              <span className="text-[10px] text-neutral-400 mt-1">Camera Off</span>
            </div>
          )}

          {/* Local Indicators Badge */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1">
            {state.mediaStatus.isAudioMuted && (
              <div className="p-1 rounded-full bg-red-600/90 text-white shadow">
                <MicOff className="w-2.5 h-2.5" />
              </div>
            )}
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-neutral-300 backdrop-blur-sm">
              You
            </span>
          </div>
        </div>

        {/* Error Notification Alert */}
        {state.errorMessage && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 max-w-md w-[90%] bg-red-950/90 border border-red-800 text-red-200 p-3.5 rounded-2xl flex items-center gap-3 backdrop-blur-md shadow-xl">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-xs">{state.errorMessage}</p>
          </div>
        )}
      </div>

      {/* Floating Bottom Media Controls Toolbar */}
      <div className="p-4 sm:p-6 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-center gap-3 sm:gap-4 z-20 pointer-events-auto flex-wrap">
        {/* Toggle Microphone */}
        <Button
          type="button"
          aria-label={state.mediaStatus.isAudioMuted ? 'Turn microphone on' : 'Turn microphone off'}
          onClick={onToggleAudio}
          variant="secondary"
          className={`w-12 h-12 rounded-2xl transition-all shadow-lg flex items-center justify-center ${
            state.mediaStatus.isAudioMuted
              ? 'bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30'
              : 'bg-[#1E293B] text-neutral-200 border border-neutral-700 hover:bg-[#334155]'
          }`}
        >
          {state.mediaStatus.isAudioMuted ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5 text-[#10B981]" />
          )}
        </Button>

        {/* Toggle Camera */}
        <Button
          type="button"
          aria-label={state.mediaStatus.isVideoOff ? 'Turn camera on' : 'Turn camera off'}
          onClick={onToggleVideo}
          variant="secondary"
          className={`w-12 h-12 rounded-2xl transition-all shadow-lg flex items-center justify-center ${
            state.mediaStatus.isVideoOff
              ? 'bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30'
              : 'bg-[#1E293B] text-neutral-200 border border-neutral-700 hover:bg-[#334155]'
          }`}
        >
          {state.mediaStatus.isVideoOff ? (
            <VideoOff className="w-5 h-5" />
          ) : (
            <Video className="w-5 h-5 text-[#10B981]" />
          )}
        </Button>

        {/* Share Screen / Stop Sharing Button (Instructor / Teacher action) */}
        {isTeacher && (
          <Button
            type="button"
            aria-label={state.isScreenSharing ? 'Stop screen sharing' : 'Start screen sharing'}
            onClick={state.isScreenSharing ? onStopScreenShare : onStartScreenShare}
            disabled={state.screenShareState === 'requesting' || state.screenShareState === 'stopping'}
            variant="secondary"
            className={`h-12 px-4 sm:px-5 rounded-2xl transition-all shadow-lg flex items-center gap-2 font-semibold text-xs sm:text-sm ${
              state.isScreenSharing
                ? 'bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/40 hover:bg-[#10B981]/30'
                : 'bg-[#1E293B] text-neutral-200 border border-neutral-700 hover:bg-[#334155]'
            }`}
          >
            {state.screenShareState === 'requesting' || state.screenShareState === 'stopping' ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#10B981]" />
            ) : state.isScreenSharing ? (
              <ScreenShareOff className="w-5 h-5 text-[#34D399]" />
            ) : (
              <ScreenShare className="w-5 h-5 text-[#10B981]" />
            )}
            <span>{state.isScreenSharing ? 'Stop Sharing' : 'Share Screen'}</span>
          </Button>
        )}

        {/* End / Leave Call */}
        <Button
          type="button"
          aria-label="Leave video call"
          onClick={handleLeaveAndExit}
          className="h-12 px-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold gap-2 shadow-lg transition-all active:scale-95"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="text-xs sm:text-sm">Leave Call</span>
        </Button>
      </div>
    </div>
  );
};
