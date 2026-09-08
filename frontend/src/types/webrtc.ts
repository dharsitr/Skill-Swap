export type SignalingMessageType =
  | 'PARTICIPANT_JOINED'
  | 'PARTICIPANT_LEFT'
  | 'OFFER'
  | 'ANSWER'
  | 'ICE_CANDIDATE'
  | 'MEDIA_STATE_CHANGED'
  | 'SCREEN_SHARE_STARTED'
  | 'SCREEN_SHARE_STOPPED';

export type ScreenShareState =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'stopping'
  | 'restoring'
  | 'failed';

export interface SignalingPayload {
  senderId: string;
  senderRole?: 'TEACHER' | 'LEARNER';
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
  isScreenSharing?: boolean;
  timestamp: string;
}

export interface SignalingMessage {
  type: SignalingMessageType;
  sessionId: string;
  payload: SignalingPayload;
}

export type CallConnectionStatus =
  | 'idle'
  | 'authorizing'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'rejected';

export interface MediaDeviceStatus {
  hasAudio: boolean;
  hasVideo: boolean;
  isAudioMuted: boolean;
  isVideoOff: boolean;
}

export interface SessionCallAccessResponse {
  allowed: boolean;
  role: 'TEACHER' | 'LEARNER';
  isInitiator: boolean;
  partnerId: string;
  partnerName: string;
  partnerAvatarUrl?: string | null;
  skillName: string;
  sessionStatus: string;
}

export interface VideoCallState {
  status: CallConnectionStatus;
  isInitiator: boolean;
  userRole: 'TEACHER' | 'LEARNER' | null;
  partnerId: string | null;
  partnerName: string | null;
  partnerAvatarUrl: string | null;
  skillName: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  screenStream: MediaStream | null;
  isScreenSharing: boolean;
  screenShareState: ScreenShareState;
  remoteIsScreenSharing: boolean;
  mediaStatus: MediaDeviceStatus;
  remoteMediaStatus: {
    audioEnabled: boolean;
    videoEnabled: boolean;
    isScreenSharing?: boolean;
  };
  errorMessage: string | null;
  partnerConnected: boolean;
}
