import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useVideoCall } from '@/hooks/useVideoCall';
import { VideoCallRoom } from '@/components/video/VideoCallRoom';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, ShieldAlert } from 'lucide-react';

export const VideoCallPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    state,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    leaveCall,
  } = useVideoCall(id || '');

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <h2 className="text-xl font-bold text-[#F8F5ED]">Invalid Session ID</h2>
        <p className="text-xs text-[#94A3B8]">A valid session identifier is required to join a video call.</p>
        <Link to="/sessions">
          <Button variant="secondary" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Sessions
          </Button>
        </Link>
      </div>
    );
  }

  if (state.status === 'rejected') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center p-6 max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-extrabold text-[#F8F5ED] font-display">Call Access Denied</h2>
        <p className="text-xs text-[#94A3B8] leading-relaxed">
          {state.errorMessage ||
            'You are not authorized to join this call. Video calls are restricted to the assigned teacher and learner of active sessions.'}
        </p>
        <Link to="/sessions">
          <Button variant="default" size="sm" className="gap-2 mt-2">
            <ArrowLeft className="w-4 h-4" />
            Return to My Sessions
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full h-full animate-in fade-in duration-300">
      <VideoCallRoom
        sessionId={id}
        state={state}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onStartScreenShare={startScreenShare}
        onStopScreenShare={stopScreenShare}
        onLeaveCall={leaveCall}
      />
    </div>
  );
};
