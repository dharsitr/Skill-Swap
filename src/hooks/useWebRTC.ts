"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  getRTCConfiguration,
  parseWebRTCStats,
  SignalingMessage,
  NetworkQualityStats,
} from "@/lib/webrtc/webrtcConfig";
import { RealtimeChannel } from "@supabase/supabase-js";

interface UseWebRTCOptions {
  sessionId: string;
  currentUserId: string;
  currentUserName: string;
  isInitiator?: boolean;
  expectedPeerId?: string;
}

export function useWebRTC({
  sessionId,
  currentUserId,
  currentUserName,
  isInitiator = false,
  expectedPeerId,
}: UseWebRTCOptions) {
  // Streams state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Controls state
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Connection & Remote State
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>("new");
  const [iceConnectionState, setIceConnectionState] = useState<RTCIceConnectionState>("new");
  const [stats, setStats] = useState<NetworkQualityStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPeerPresent, setIsPeerPresent] = useState(false);
  const [remoteMediaState, setRemoteMediaState] = useState<{
    isAudioMuted: boolean;
    isVideoOff: boolean;
    isScreenSharing: boolean;
  } | null>(null);

  // Internal refs
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const isCreatingOfferRef = useRef(false);

  // Send signaling broadcast message
  const sendSignal = useCallback(
    async (message: Omit<SignalingMessage, "senderId">) => {
      if (!channelRef.current) return;
      try {
        await channelRef.current.send({
          type: "broadcast",
          event: "signal",
          payload: {
            ...message,
            senderId: currentUserId,
            senderName: currentUserName,
          } as SignalingMessage,
        });
      } catch (err: unknown) {
        console.warn("[WebRTC Signaling] Failed to send broadcast message:", err);
      }
    },
    [currentUserId, currentUserName]
  );

  // Broadcast current local media state
  const broadcastMediaState = useCallback(
    (audioMuted: boolean, videoOff: boolean, screenSharing: boolean) => {
      sendSignal({
        type: "media-state",
        mediaState: {
          isAudioMuted: audioMuted,
          isVideoOff: videoOff,
          isScreenSharing: screenSharing,
        },
      });
    },
    [sendSignal]
  );

  // Flush any queued ICE candidates once remote description is set
  const processQueuedCandidates = useCallback(async (pc: RTCPeerConnection) => {
    while (iceCandidateQueueRef.current.length > 0) {
      const candidate = iceCandidateQueueRef.current.shift();
      if (candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("[WebRTC] Error adding queued ICE candidate:", err);
        }
      }
    }
  }, []);

  // Initialize or recreate RTCPeerConnection
  const createPeerConnection = useCallback(() => {
    if (typeof window === "undefined") return null;

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    const config = getRTCConfiguration();
    const pc = new RTCPeerConnection(config);
    pcRef.current = pc;

    // Track remote stream
    const rStream = new MediaStream();
    setRemoteStream(rStream);

    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        if (!rStream.getTracks().some((t) => t.id === track.id)) {
          rStream.addTrack(track);
        }
      });
      setRemoteStream(new MediaStream(rStream.getTracks()));
    };

    // Forward ICE candidates to peer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          type: "ice-candidate",
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // State changes
    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      if (pc.connectionState === "failed") {
        setError("Connection failed. Attempting to recover...");
      } else if (pc.connectionState === "connected") {
        setError(null);
      }
    };

    pc.oniceconnectionstatechange = () => {
      setIceConnectionState(pc.iceConnectionState);
    };

    // Add local tracks if stream already acquired
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    return pc;
  }, [sendSignal]);

  // Initiate SDP Offer (Caller)
  const makeOffer = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || isCreatingOfferRef.current) return;

    try {
      isCreatingOfferRef.current = true;
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      await sendSignal({
        type: "offer",
        sdp: offer,
      });
    } catch (err: unknown) {
      console.error("[WebRTC] Failed to create offer:", err);
      setError("Failed to initiate call session.");
    } finally {
      isCreatingOfferRef.current = false;
    }
  }, [sendSignal]);

  // Handle incoming signaling messages
  const handleSignalMessage = useCallback(
    async (payload: SignalingMessage) => {
      if (!payload || typeof payload !== "object") return;
      if (payload.senderId === currentUserId) return; // Ignore own messages

      // Security Check: Only accept signaling packets from the authorized peer in this session
      if (expectedPeerId && payload.senderId !== expectedPeerId) {
        console.warn("[WebRTC Security] Blocked signaling packet from unauthorized peer:", payload.senderId);
        return;
      }

      // Allowlist signal types
      const allowedTypes = ["peer-joined", "offer", "answer", "ice-candidate", "media-state", "user-left"];
      if (!allowedTypes.includes(payload.type)) {
        console.warn("[WebRTC Security] Ignored unverified signal type:", payload.type);
        return;
      }

      const pc = pcRef.current;
      if (!pc) return;

      try {
        switch (payload.type) {
          case "peer-joined":
            setIsPeerPresent(true);
            // If I am initiator or peer just joined, initiate offer
            if (isInitiator || pc.signalingState === "stable") {
              await makeOffer();
            }
            // Announce current media state back
            broadcastMediaState(isAudioMuted, isVideoOff, isScreenSharing);
            break;

          case "offer":
            if (payload.sdp && payload.sdp.type === "offer" && typeof payload.sdp.sdp === "string") {
              setIsPeerPresent(true);
              // Handle offer collision with polite rollback if needed
              if (pc.signalingState !== "stable") {
                await Promise.all([
                  pc.setLocalDescription({ type: "rollback" }),
                  pc.setRemoteDescription(new RTCSessionDescription(payload.sdp)),
                ]);
              } else {
                await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
              }

              await processQueuedCandidates(pc);

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              await sendSignal({
                type: "answer",
                sdp: answer,
              });
            }
            break;

          case "answer":
            if (payload.sdp && payload.sdp.type === "answer" && typeof payload.sdp.sdp === "string") {
              setIsPeerPresent(true);
              if (pc.signalingState === "have-local-offer") {
                await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                await processQueuedCandidates(pc);
              }
            }
            break;

          case "ice-candidate":
            if (payload.candidate && (typeof payload.candidate.candidate === "string" || payload.candidate.candidate === "")) {
              if (pc.remoteDescription && pc.remoteDescription.type) {
                await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
              } else {
                iceCandidateQueueRef.current.push(payload.candidate);
              }
            }
            break;

          case "media-state":
            if (payload.mediaState && typeof payload.mediaState === "object") {
              setRemoteMediaState(payload.mediaState);
            }
            break;

          case "user-left":
            setIsPeerPresent(false);
            setRemoteStream(null);
            setRemoteMediaState(null);
            setError("Peer disconnected from the session.");
            break;
        }
      } catch (err: unknown) {
        console.error("[WebRTC] Error handling signal message:", err);
      }
    },
    [
      currentUserId,
      isInitiator,
      isAudioMuted,
      isVideoOff,
      isScreenSharing,
      makeOffer,
      sendSignal,
      broadcastMediaState,
      processQueuedCandidates,
    ]
  );

  // Initialize Local Media Stream
  useEffect(() => {
    let isCancelled = false;

    async function initLocalMedia() {
      if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setError("Your browser does not support WebRTC media capture.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        // Store primary camera track for restoring after screen sharing
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          cameraTrackRef.current = videoTrack;
        }

        // Initialize PeerConnection and add tracks
        const pc = createPeerConnection();
        if (pc) {
          stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        }
      } catch (err: unknown) {
        console.warn("[WebRTC] Local media capture error:", err);
        const errMsg = err instanceof Error ? err.name : "";
        if (errMsg === "NotAllowedError" || errMsg === "PermissionDeniedError") {
          setError("Camera and microphone permissions were denied. Please enable them in browser settings.");
        } else if (errMsg === "NotFoundError" || errMsg === "DevicesNotFoundError") {
          setError("No camera or microphone found on your device.");
        } else {
          setError("Could not access camera or microphone. Please check permissions.");
        }
      }
    }

    initLocalMedia();

    return () => {
      isCancelled = true;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [createPeerConnection]);

  // Set up Supabase Realtime Signaling Channel
  useEffect(() => {
    if (!sessionId || !currentUserId) return;

    const channelName = `session-call:${sessionId}`;
    const channel: RealtimeChannel = supabase.client.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: currentUserId },
      },
    });

    channelRef.current = channel;

    // Listen to broadcast signals
    channel.on("broadcast", { event: "signal" }, (payload) => {
      handleSignalMessage(payload.payload as SignalingMessage);
    });

    // Listen to presence events
    channel
      .on("presence", { event: "join" }, ({ newPresences }) => {
        const otherPeer = (newPresences as Array<{ userId?: string }>).find(
          (p) => p.userId !== currentUserId
        );
        if (otherPeer) {
          setIsPeerPresent(true);
        }
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        const otherPeer = (leftPresences as Array<{ userId?: string }>).find(
          (p) => p.userId !== currentUserId
        );
        if (otherPeer) {
          setIsPeerPresent(false);
          setRemoteStream(null);
        }
      });

    // Subscribe and announce presence
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          userId: currentUserId,
          name: currentUserName,
          joinedAt: new Date().toISOString(),
        });

        // Announce join to peer
        sendSignal({ type: "peer-joined" });
      }
    });

    return () => {
      sendSignal({ type: "user-left" });
      supabase.client.removeChannel(channel);
      channelRef.current = null;
    };
  }, [sessionId, currentUserId, currentUserName, handleSignalMessage, sendSignal]);

  // Network Statistics Polling Interval (Every 2s)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (pcRef.current && pcRef.current.connectionState === "connected") {
        const currentStats = await parseWebRTCStats(pcRef.current);
        setStats(currentStats);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Controls: Audio Mute / Unmute
  const toggleAudio = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      const nextMuted = !audioTrack.enabled;
      setIsAudioMuted(nextMuted);
      broadcastMediaState(nextMuted, isVideoOff, isScreenSharing);
    }
  }, [isVideoOff, isScreenSharing, broadcastMediaState]);

  // Controls: Video On / Off
  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      const nextVideoOff = !videoTrack.enabled;
      setIsVideoOff(nextVideoOff);
      broadcastMediaState(isAudioMuted, nextVideoOff, isScreenSharing);
    }
  }, [isAudioMuted, isScreenSharing, broadcastMediaState]);

  // Controls: Screen Sharing (Start / Stop) with replaceTrack
  const toggleScreenShare = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;

    if (isScreenSharing) {
      // Stop screen sharing and restore camera
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }

      if (cameraTrackRef.current) {
        const videoSender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (videoSender) {
          await videoSender.replaceTrack(cameraTrackRef.current);
        }
      }

      setIsScreenSharing(false);
      broadcastMediaState(isAudioMuted, isVideoOff, false);
    } else {
      // Start screen sharing using Screen Capture API
      try {
        if (!navigator.mediaDevices?.getDisplayMedia) {
          setError("Screen sharing is not supported by your browser.");
          return;
        }

        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

        const screenTrack = displayStream.getVideoTracks()[0];
        if (!screenTrack) return;

        screenTrackRef.current = screenTrack;

        // Replace outgoing video track on peer connection
        const videoSender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
        }

        setIsScreenSharing(true);
        broadcastMediaState(isAudioMuted, isVideoOff, true);

        // When user stops sharing using browser native UI
        screenTrack.onended = async () => {
          if (cameraTrackRef.current && pcRef.current) {
            const currentVideoSender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
            if (currentVideoSender) {
              await currentVideoSender.replaceTrack(cameraTrackRef.current);
            }
          }
          screenTrackRef.current = null;
          setIsScreenSharing(false);
          broadcastMediaState(isAudioMuted, isVideoOff, false);
        };
      } catch (err: unknown) {
        // User cancelled picker or permission denied
        console.warn("[WebRTC] Screen sharing cancelled or denied:", err);
      }
    }
  }, [isScreenSharing, isAudioMuted, isVideoOff, broadcastMediaState]);

  // End Call & Cleanup
  const endCall = useCallback(() => {
    sendSignal({ type: "user-left" });

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setConnectionState("closed");
  }, [sendSignal]);

  // Retry Connection
  const retryConnection = useCallback(() => {
    setError(null);
    const pc = createPeerConnection();
    if (pc && localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current!));
    }
    makeOffer();
  }, [createPeerConnection, makeOffer]);

  return {
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    connectionState,
    iceConnectionState,
    stats,
    error,
    isPeerPresent,
    remoteMediaState,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    endCall,
    retryConnection,
  };
}
