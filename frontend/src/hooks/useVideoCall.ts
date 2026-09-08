import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/auth/useAuth';
import { sessionService } from '@/services/sessionService';
import { SignalingService } from '@/services/webrtc/signalingService';
import { PeerConnectionManager } from '@/services/webrtc/peerConnectionManager';
import { DEFAULT_MEDIA_CONSTRAINTS } from '@/services/webrtc/webrtcConfig';
import type {
  VideoCallState,
  SignalingMessage,
  SessionCallAccessResponse,
} from '@/types/webrtc';

export function useVideoCall(sessionId: string) {
  const { user } = useAuth();
  const [state, setState] = useState<VideoCallState>({
    status: 'authorizing',
    isInitiator: false,
    userRole: null,
    partnerId: null,
    partnerName: null,
    partnerAvatarUrl: null,
    skillName: null,
    localStream: null,
    remoteStream: null,
    screenStream: null,
    isScreenSharing: false,
    screenShareState: 'idle',
    remoteIsScreenSharing: false,
    mediaStatus: {
      hasAudio: true,
      hasVideo: true,
      isAudioMuted: false,
      isVideoOff: false,
    },
    remoteMediaStatus: {
      audioEnabled: true,
      videoEnabled: true,
      isScreenSharing: false,
    },
    errorMessage: null,
    partnerConnected: false,
  });

  const signalingRef = useRef<SignalingService | null>(null);
  const pcManagerRef = useRef<PeerConnectionManager | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const accessInfoRef = useRef<SessionCallAccessResponse | null>(null);
  const isCleaningUpRef = useRef(false);
  const isTransitioningScreenRef = useRef(false);

  // Stop screen share function
  const stopScreenShare = useCallback(async () => {
    if (isCleaningUpRef.current) return;
    if (isTransitioningScreenRef.current) return;
    isTransitioningScreenRef.current = true;

    setState((prev) => ({ ...prev, screenShareState: 'stopping' }));

    try {
      // 1. Stop all tracks in screen stream
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => {
          track.onended = null;
          track.stop();
        });
        screenStreamRef.current = null;
      }

      // 2. Restore camera track if available and camera was active
      if (pcManagerRef.current) {
        const camTrack = cameraTrackRef.current;
        if (camTrack && camTrack.readyState === 'live') {
          await pcManagerRef.current.replaceVideoTrack(camTrack);
        } else {
          await pcManagerRef.current.replaceVideoTrack(null);
        }
      }

      // 3. Update state
      setState((prev) => ({
        ...prev,
        isScreenSharing: false,
        screenShareState: 'idle',
        screenStream: null,
      }));

      // 4. Notify peer through signaling
      signalingRef.current?.sendSignal('SCREEN_SHARE_STOPPED', {
        isScreenSharing: false,
        senderRole: accessInfoRef.current?.role,
      });
      signalingRef.current?.sendSignal('MEDIA_STATE_CHANGED', {
        audioEnabled: !state.mediaStatus.isAudioMuted,
        videoEnabled: !state.mediaStatus.isVideoOff,
        isScreenSharing: false,
      });
    } catch (err) {
      console.error('Error stopping screen share:', err);
      setState((prev) => ({
        ...prev,
        isScreenSharing: false,
        screenShareState: 'failed',
        screenStream: null,
      }));
    } finally {
      isTransitioningScreenRef.current = false;
    }
  }, [state.mediaStatus.isAudioMuted, state.mediaStatus.isVideoOff]);

  // Start screen share function
  const startScreenShare = useCallback(async () => {
    if (isCleaningUpRef.current || isTransitioningScreenRef.current) return;
    if (state.isScreenSharing || state.screenShareState === 'requesting') return;

    // Role check: Only authorized participants (Teacher) can initiate screen sharing
    if (accessInfoRef.current?.role !== 'TEACHER' && !accessInfoRef.current?.isInitiator) {
      setState((prev) => ({
        ...prev,
        errorMessage: 'Only the session instructor can initiate screen sharing.',
      }));
      return;
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      setState((prev) => ({
        ...prev,
        errorMessage: 'Screen sharing is not supported in this browser.',
      }));
      return;
    }

    isTransitioningScreenRef.current = true;
    setState((prev) => ({ ...prev, screenShareState: 'requesting', errorMessage: null }));

    try {
      // 1. Prompt browser screen picker
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const screenTrack = displayStream.getVideoTracks()[0];
      if (!screenTrack) {
        throw new Error('No video track found in screen capture stream');
      }

      screenStreamRef.current = displayStream;

      // 2. Handle native browser stop action ("Stop sharing" bar)
      screenTrack.onended = () => {
        stopScreenShare();
      };

      // 3. Replace camera video track with screen track on WebRTC connection
      if (pcManagerRef.current) {
        await pcManagerRef.current.replaceVideoTrack(screenTrack);
      }

      // 4. Update UI state
      setState((prev) => ({
        ...prev,
        isScreenSharing: true,
        screenShareState: 'active',
        screenStream: displayStream,
      }));

      // 5. Broadcast signaling to partner
      signalingRef.current?.sendSignal('SCREEN_SHARE_STARTED', {
        isScreenSharing: true,
        senderRole: accessInfoRef.current?.role,
      });
      signalingRef.current?.sendSignal('MEDIA_STATE_CHANGED', {
        audioEnabled: !state.mediaStatus.isAudioMuted,
        videoEnabled: true,
        isScreenSharing: true,
      });
    } catch (err: any) {
      // User cancelled picker (NotAllowedError / AbortError) is a normal user action, not a crash
      if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
        setState((prev) => ({
          ...prev,
          screenShareState: 'idle',
        }));
      } else {
        console.error('Screen capture error:', err);
        setState((prev) => ({
          ...prev,
          screenShareState: 'failed',
          errorMessage: 'Unable to start screen sharing. Please try again.',
        }));
      }
    } finally {
      isTransitioningScreenRef.current = false;
    }
  }, [state.isScreenSharing, state.screenShareState, state.mediaStatus.isAudioMuted, stopScreenShare]);

  // Initialize and authorize session call
  useEffect(() => {
    if (!sessionId || !user?.id) return;
    let isMounted = true;
    isCleaningUpRef.current = false;

    const initializeCall = async () => {
      try {
        setState((prev) => ({ ...prev, status: 'authorizing', errorMessage: null }));

        // 1. Verify call authorization via backend
        const access = await sessionService.getCallAccess(sessionId);
        if (!isMounted) return;
        accessInfoRef.current = access;

        if (!access.allowed) {
          setState((prev) => ({
            ...prev,
            status: 'rejected',
            errorMessage: 'You are not authorized to join this video session.',
          }));
          return;
        }

        setState((prev) => ({
          ...prev,
          isInitiator: access.isInitiator,
          userRole: access.role,
          partnerId: access.partnerId,
          partnerName: access.partnerName,
          partnerAvatarUrl: access.partnerAvatarUrl ?? null,
          skillName: access.skillName,
          status: 'connecting',
        }));

        // 2. Request user media (Microphone & Camera)
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(DEFAULT_MEDIA_CONSTRAINTS);
        } catch (mediaErr: any) {
          console.warn('Failed with default constraints, attempting audio-only fallback...', mediaErr);
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          } catch (audioErr: any) {
            console.error('Failed to obtain user media devices:', audioErr);
            if (!isMounted) return;
            setState((prev) => ({
              ...prev,
              status: 'failed',
              errorMessage:
                'Could not access camera or microphone. Please ensure device permissions are granted.',
            }));
            return;
          }
        }

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = stream;
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length > 0) {
          cameraTrackRef.current = videoTracks[0] ?? null;
        }

        setState((prev) => ({
          ...prev,
          localStream: stream,
          mediaStatus: {
            hasAudio: stream.getAudioTracks().length > 0,
            hasVideo: stream.getVideoTracks().length > 0,
            isAudioMuted: false,
            isVideoOff: stream.getVideoTracks().length === 0,
          },
        }));

        // 3. Initialize PeerConnectionManager
        const pcManager = new PeerConnectionManager({
          onIceCandidate: (candidate) => {
            signalingRef.current?.sendSignal('ICE_CANDIDATE', {
              candidate: candidate.toJSON(),
            });
          },
          onRemoteStream: (remoteStream) => {
            if (!isMounted) return;
            setState((prev) => ({
              ...prev,
              remoteStream,
              status: 'connected',
              partnerConnected: true,
            }));
          },
          onConnectionStateChange: (pcState) => {
            if (!isMounted) return;
            if (pcState === 'connected') {
              setState((prev) => ({ ...prev, status: 'connected', partnerConnected: true }));
            } else if (pcState === 'disconnected' || pcState === 'closed') {
              setState((prev) => ({
                ...prev,
                status: pcState === 'closed' ? 'disconnected' : 'connecting',
                partnerConnected: false,
              }));
            } else if (pcState === 'failed') {
              setState((prev) => ({
                ...prev,
                status: 'failed',
                errorMessage: 'WebRTC peer connection failed.',
              }));
            }
          },
          onIceConnectionStateChange: (iceState) => {
            if (!isMounted) return;
            if (iceState === 'disconnected') {
              setState((prev) => ({ ...prev, partnerConnected: false }));
            }
          },
        });

        pcManager.initialize(stream);
        pcManagerRef.current = pcManager;

        // 4. Initialize Signaling Service
        const signaling = new SignalingService(sessionId, user.id);
        signalingRef.current = signaling;

        signaling.setOnMessageCallback(async (message: SignalingMessage) => {
          if (!isMounted || isCleaningUpRef.current) return;

          switch (message.type) {
            case 'PARTICIPANT_JOINED': {
              if (access.isInitiator && pcManagerRef.current) {
                try {
                  const offer = await pcManagerRef.current.createOffer();
                  await signaling.sendSignal('OFFER', {
                    sdp: offer,
                    senderRole: access.role,
                  });
                } catch (offerErr) {
                  console.error('Error creating WebRTC offer:', offerErr);
                }
              }
              break;
            }

            case 'OFFER': {
              if (!access.isInitiator && message.payload.sdp && pcManagerRef.current) {
                try {
                  const answer = await pcManagerRef.current.handleOffer(message.payload.sdp);
                  await signaling.sendSignal('ANSWER', {
                    sdp: answer,
                    senderRole: access.role,
                  });
                } catch (ansErr) {
                  console.error('Error handling WebRTC offer & creating answer:', ansErr);
                }
              }
              break;
            }

            case 'ANSWER': {
              if (access.isInitiator && message.payload.sdp && pcManagerRef.current) {
                try {
                  await pcManagerRef.current.handleAnswer(message.payload.sdp);
                } catch (ansErr) {
                  console.error('Error handling WebRTC answer:', ansErr);
                }
              }
              break;
            }

            case 'ICE_CANDIDATE': {
              if (message.payload.candidate && pcManagerRef.current) {
                await pcManagerRef.current.addIceCandidate(message.payload.candidate);
              }
              break;
            }

            case 'SCREEN_SHARE_STARTED': {
              setState((prev) => ({
                ...prev,
                remoteIsScreenSharing: true,
                remoteMediaStatus: {
                  ...prev.remoteMediaStatus,
                  isScreenSharing: true,
                  videoEnabled: true,
                },
              }));
              break;
            }

            case 'SCREEN_SHARE_STOPPED': {
              setState((prev) => ({
                ...prev,
                remoteIsScreenSharing: false,
                remoteMediaStatus: {
                  ...prev.remoteMediaStatus,
                  isScreenSharing: false,
                },
              }));
              break;
            }

            case 'MEDIA_STATE_CHANGED': {
              if (
                message.payload.audioEnabled !== undefined ||
                message.payload.videoEnabled !== undefined ||
                message.payload.isScreenSharing !== undefined
              ) {
                setState((prev) => ({
                  ...prev,
                  remoteIsScreenSharing:
                    message.payload.isScreenSharing ?? prev.remoteIsScreenSharing,
                  remoteMediaStatus: {
                    audioEnabled: message.payload.audioEnabled ?? prev.remoteMediaStatus.audioEnabled,
                    videoEnabled: message.payload.videoEnabled ?? prev.remoteMediaStatus.videoEnabled,
                    isScreenSharing:
                      message.payload.isScreenSharing ?? prev.remoteMediaStatus.isScreenSharing,
                  },
                }));
              }
              break;
            }

            case 'PARTICIPANT_LEFT': {
              setState((prev) => ({
                ...prev,
                partnerConnected: false,
                status: 'disconnected',
                remoteIsScreenSharing: false,
              }));
              break;
            }
          }
        });

        // 5. Subscribe to channel and announce presence
        await signaling.subscribe();
        await signaling.sendSignal('PARTICIPANT_JOINED', {
          senderRole: access.role,
        });

      } catch (err: any) {
        console.error('Failed to initialize video call room:', err);
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            status: 'failed',
            errorMessage: err?.response?.data?.message || err?.message || 'Failed to join video room.',
          }));
        }
      }
    };

    initializeCall();

    return () => {
      isMounted = false;
      isCleaningUpRef.current = true;
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => {
          track.onended = null;
          track.stop();
        });
        screenStreamRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      cameraTrackRef.current = null;
      if (pcManagerRef.current) {
        pcManagerRef.current.cleanup();
        pcManagerRef.current = null;
      }
      if (signalingRef.current) {
        signalingRef.current.sendSignal('PARTICIPANT_LEFT', {}).catch(() => {});
        signalingRef.current.unsubscribe();
        signalingRef.current = null;
      }
    };
  }, [sessionId, user?.id]);

  // Toggle local audio track
  const toggleAudio = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTracks = localStreamRef.current.getAudioTracks();
    if (audioTracks.length === 0) return;

    const newMuted = !state.mediaStatus.isAudioMuted;
    audioTracks.forEach((track) => {
      track.enabled = !newMuted;
    });

    setState((prev) => ({
      ...prev,
      mediaStatus: {
        ...prev.mediaStatus,
        isAudioMuted: newMuted,
      },
    }));

    signalingRef.current?.sendSignal('MEDIA_STATE_CHANGED', {
      audioEnabled: !newMuted,
      videoEnabled: !state.mediaStatus.isVideoOff,
      isScreenSharing: state.isScreenSharing,
    });
  }, [state.mediaStatus.isAudioMuted, state.mediaStatus.isVideoOff, state.isScreenSharing]);

  // Toggle local video track
  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTracks = localStreamRef.current.getVideoTracks();
    if (videoTracks.length === 0) return;

    const newVideoOff = !state.mediaStatus.isVideoOff;
    videoTracks.forEach((track) => {
      track.enabled = !newVideoOff;
    });

    // If camera is currently active in WebRTC (not screen sharing)
    if (!state.isScreenSharing && pcManagerRef.current) {
      if (newVideoOff) {
        pcManagerRef.current.replaceVideoTrack(null).catch((e) => console.warn(e));
      } else if (cameraTrackRef.current) {
        pcManagerRef.current.replaceVideoTrack(cameraTrackRef.current).catch((e) => console.warn(e));
      }
    }

    setState((prev) => ({
      ...prev,
      mediaStatus: {
        ...prev.mediaStatus,
        isVideoOff: newVideoOff,
      },
    }));

    signalingRef.current?.sendSignal('MEDIA_STATE_CHANGED', {
      audioEnabled: !state.mediaStatus.isAudioMuted,
      videoEnabled: !newVideoOff,
      isScreenSharing: state.isScreenSharing,
    });
  }, [state.mediaStatus.isAudioMuted, state.mediaStatus.isVideoOff, state.isScreenSharing]);

  // Leave / end call
  const leaveCall = useCallback(async () => {
    isCleaningUpRef.current = true;

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        track.onended = null;
        track.stop();
      });
      screenStreamRef.current = null;
    }

    if (signalingRef.current) {
      try {
        await signalingRef.current.sendSignal('PARTICIPANT_LEFT', {});
        await signalingRef.current.unsubscribe();
      } catch (e) {
        console.warn('Error during signaling disconnect:', e);
      }
      signalingRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    cameraTrackRef.current = null;

    if (pcManagerRef.current) {
      pcManagerRef.current.cleanup();
      pcManagerRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      status: 'disconnected',
      localStream: null,
      remoteStream: null,
      screenStream: null,
      isScreenSharing: false,
      screenShareState: 'idle',
      remoteIsScreenSharing: false,
      partnerConnected: false,
    }));
  }, []);

  return {
    state,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    leaveCall,
  };
}
