import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/auth/AuthContext';
import { authService } from '@/auth/authService';
import { SignalingService } from '@/services/webrtc/signalingService';
import { PeerConnectionManager } from '@/services/webrtc/peerConnectionManager';
import { VideoCallRoom } from '@/components/video/VideoCallRoom';
import { VideoCallPage } from '@/pages/VideoCallPage';
import { supabase } from '@/lib/supabaseClient';
import type { VideoCallState } from '@/types/webrtc';

vi.mock('@/auth/authService', () => ({
  authService: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('@/services/sessionService', () => ({
  sessionService: {
    getSessions: vi.fn(),
    getSession: vi.fn(),
    startSession: vi.fn(),
    completeSession: vi.fn(),
    cancelSession: vi.fn(),
    getCallAccess: vi.fn(),
  },
}));

// Mock browser MediaDevices
const mockTrack = {
  enabled: true,
  stop: vi.fn(),
  kind: 'video',
  onended: null,
};

const mockStream = {
  getTracks: vi.fn().mockReturnValue([mockTrack]),
  getAudioTracks: vi.fn().mockReturnValue([{ ...mockTrack, kind: 'audio' }]),
  getVideoTracks: vi.fn().mockReturnValue([mockTrack]),
  addTrack: vi.fn(),
  removeTrack: vi.fn(),
};

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn().mockResolvedValue(mockStream),
    getDisplayMedia: vi.fn().mockResolvedValue(mockStream),
  },
  writable: true,
});

// Mock RTCPeerConnection
class MockRTCPeerConnection {
  public localDescription: RTCSessionDescriptionInit | null = null;
  public remoteDescription: RTCSessionDescriptionInit | null = null;
  public connectionState: RTCPeerConnectionState = 'new';
  public iceConnectionState: RTCIceConnectionState = 'new';
  public onicecandidate: ((e: any) => void) | null = null;
  public ontrack: ((e: any) => void) | null = null;
  public onconnectionstatechange: (() => void) | null = null;
  public oniceconnectionstatechange: (() => void) | null = null;

  public mockVideoSender = {
    track: { kind: 'video', id: 'vid-1' },
    replaceTrack: vi.fn().mockResolvedValue(undefined),
  };

  public createOffer = vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-offer-sdp' });
  public createAnswer = vi.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-answer-sdp' });
  public setLocalDescription = vi.fn().mockImplementation((desc) => {
    this.localDescription = desc;
    return Promise.resolve();
  });
  public setRemoteDescription = vi.fn().mockImplementation((desc) => {
    this.remoteDescription = desc;
    return Promise.resolve();
  });
  public addIceCandidate = vi.fn().mockResolvedValue(undefined);
  public addTrack = vi.fn();
  public removeTrack = vi.fn();
  public getSenders = vi.fn().mockImplementation(() => [this.mockVideoSender]);
  public close = vi.fn();
}

(global as any).RTCPeerConnection = MockRTCPeerConnection;
(global as any).RTCSessionDescription = vi.fn().mockImplementation((init) => init);
(global as any).RTCIceCandidate = vi.fn().mockImplementation((init) => init);
(global as any).MediaStream = vi.fn().mockImplementation(() => ({
  addTrack: vi.fn(),
  getTracks: vi.fn().mockReturnValue([]),
  getAudioTracks: vi.fn().mockReturnValue([]),
  getVideoTracks: vi.fn().mockReturnValue([]),
}));

describe('Phase 8 & 9: WebRTC Video Calling & Screen Sharing', () => {
  describe('PeerConnectionManager', () => {
    it('initializes RTCPeerConnection and creates WebRTC offer', async () => {
      const callbacks = {
        onIceCandidate: vi.fn(),
        onRemoteStream: vi.fn(),
        onConnectionStateChange: vi.fn(),
        onIceConnectionStateChange: vi.fn(),
      };

      const manager = new PeerConnectionManager(callbacks);
      const pc = manager.initialize(mockStream as any);

      expect(pc).toBeDefined();
      const offer = await manager.createOffer();
      expect(offer.type).toBe('offer');
      expect(offer.sdp).toBe('mock-offer-sdp');
    });

    it('replaces outgoing video track without renegotiation via replaceVideoTrack', async () => {
      const callbacks = {
        onIceCandidate: vi.fn(),
        onRemoteStream: vi.fn(),
        onConnectionStateChange: vi.fn(),
        onIceConnectionStateChange: vi.fn(),
      };

      const manager = new PeerConnectionManager(callbacks);
      const pc = manager.initialize(mockStream as any) as any;

      const screenTrack = { kind: 'video', id: 'screen-track-1' } as any;
      await manager.replaceVideoTrack(screenTrack);

      expect(pc.mockVideoSender.replaceTrack).toHaveBeenCalledWith(screenTrack);
    });

    it('queues ICE candidates until remote description is set and drains them', async () => {
      const callbacks = {
        onIceCandidate: vi.fn(),
        onRemoteStream: vi.fn(),
        onConnectionStateChange: vi.fn(),
        onIceConnectionStateChange: vi.fn(),
      };

      const manager = new PeerConnectionManager(callbacks);
      manager.initialize(mockStream as any);

      const candidate: RTCIceCandidateInit = { candidate: 'candidate:1 1 UDP 1234', sdpMid: '0', sdpMLineIndex: 0 };
      
      await manager.addIceCandidate(candidate);
      const pc = manager.getPeerConnection() as any;
      expect(pc.addIceCandidate).not.toHaveBeenCalled();

      await manager.handleOffer({ type: 'offer', sdp: 'remote-sdp' });
      expect(pc.addIceCandidate).toHaveBeenCalled();
    });

    it('cleans up peer connection gracefully', () => {
      const callbacks = {
        onIceCandidate: vi.fn(),
        onRemoteStream: vi.fn(),
        onConnectionStateChange: vi.fn(),
        onIceConnectionStateChange: vi.fn(),
      };

      const manager = new PeerConnectionManager(callbacks);
      manager.initialize(mockStream as any);
      const pc = manager.getPeerConnection() as any;

      manager.cleanup();
      expect(pc.close).toHaveBeenCalled();
      expect(manager.getPeerConnection()).toBeNull();
    });
  });

  describe('SignalingService', () => {
    let mockChannel: any;

    beforeEach(() => {
      mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn((cb) => {
          cb('SUBSCRIBED');
          return mockChannel;
        }),
        send: vi.fn().mockResolvedValue(undefined),
      };

      (supabase.channel as any) = vi.fn().mockReturnValue(mockChannel);
      (supabase.removeChannel as any) = vi.fn().mockResolvedValue('ok');
    });

    it('subscribes to scoped realtime channel and sends broadcast signal', async () => {
      const signaling = new SignalingService('sess-100', 'usr-teacher');
      await signaling.subscribe();

      expect(supabase.channel).toHaveBeenCalledWith(
        'session:sess-100:webrtc',
        expect.objectContaining({
          config: { broadcast: { self: false, ack: false } },
        })
      );
      expect(signaling.getChannelStatus()).toBe(true);

      await signaling.sendSignal('SCREEN_SHARE_STARTED', {
        isScreenSharing: true,
        senderRole: 'TEACHER',
      });

      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'broadcast',
          event: 'signal',
          payload: expect.objectContaining({
            type: 'SCREEN_SHARE_STARTED',
            sessionId: 'sess-100',
            payload: expect.objectContaining({
              senderId: 'usr-teacher',
              senderRole: 'TEACHER',
              isScreenSharing: true,
            }),
          }),
        })
      );

      await signaling.unsubscribe();
      expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });
  });

  describe('VideoCallRoom & Teaching Mode UI Component', () => {
    const mockTeacherState: VideoCallState = {
      status: 'connected',
      isInitiator: true,
      userRole: 'TEACHER',
      partnerId: 'usr-learner',
      partnerName: 'Alice Student',
      partnerAvatarUrl: null,
      skillName: 'Quantum Computing',
      localStream: mockStream as any,
      remoteStream: mockStream as any,
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
      partnerConnected: true,
    };

    it('renders normal video room with Share Screen button for instructor', () => {
      const onToggleAudio = vi.fn();
      const onToggleVideo = vi.fn();
      const onStartScreenShare = vi.fn().mockResolvedValue(undefined);
      const onStopScreenShare = vi.fn().mockResolvedValue(undefined);
      const onLeaveCall = vi.fn().mockResolvedValue(undefined);

      render(
        <BrowserRouter>
          <VideoCallRoom
            sessionId="sess-100"
            state={mockTeacherState}
            onToggleAudio={onToggleAudio}
            onToggleVideo={onToggleVideo}
            onStartScreenShare={onStartScreenShare}
            onStopScreenShare={onStopScreenShare}
            onLeaveCall={onLeaveCall}
          />
        </BrowserRouter>
      );

      expect(screen.getByText(/Live Call/i)).toBeInTheDocument();
      expect(screen.getByText('Quantum Computing')).toBeInTheDocument();
      expect(screen.getByText('Alice Student')).toBeInTheDocument();

      // Controls
      const micBtn = screen.getByRole('button', { name: /turn microphone off/i });
      const camBtn = screen.getByRole('button', { name: /turn camera off/i });
      const shareBtn = screen.getByRole('button', { name: /start screen sharing/i });
      const leaveBtn = screen.getByRole('button', { name: /leave video call/i });

      expect(micBtn).toBeInTheDocument();
      expect(camBtn).toBeInTheDocument();
      expect(shareBtn).toBeInTheDocument();
      expect(leaveBtn).toBeInTheDocument();

      fireEvent.click(shareBtn);
      expect(onStartScreenShare).toHaveBeenCalled();
    });

    it('renders Teaching Mode layout with Stop Sharing button when screen sharing is active', () => {
      const onToggleAudio = vi.fn();
      const onToggleVideo = vi.fn();
      const onStartScreenShare = vi.fn().mockResolvedValue(undefined);
      const onStopScreenShare = vi.fn().mockResolvedValue(undefined);
      const onLeaveCall = vi.fn().mockResolvedValue(undefined);

      const activeScreenState: VideoCallState = {
        ...mockTeacherState,
        isScreenSharing: true,
        screenShareState: 'active',
        screenStream: mockStream as any,
      };

      render(
        <BrowserRouter>
          <VideoCallRoom
            sessionId="sess-100"
            state={activeScreenState}
            onToggleAudio={onToggleAudio}
            onToggleVideo={onToggleVideo}
            onStartScreenShare={onStartScreenShare}
            onStopScreenShare={onStopScreenShare}
            onLeaveCall={onLeaveCall}
          />
        </BrowserRouter>
      );

      // Verify Teaching mode indicators
      expect(screen.getByText(/Teaching Mode • Sharing Screen/i)).toBeInTheDocument();
      expect(screen.getByText(/Your Shared Screen/i)).toBeInTheDocument();

      const stopBtn = screen.getByRole('button', { name: /stop screen sharing/i });
      expect(stopBtn).toBeInTheDocument();

      fireEvent.click(stopBtn);
      expect(onStopScreenShare).toHaveBeenCalled();
    });

    it('renders Teaching Mode for learner when remote teacher is sharing screen', () => {
      const mockLearnerState: VideoCallState = {
        ...mockTeacherState,
        isInitiator: false,
        userRole: 'LEARNER',
        remoteIsScreenSharing: true,
        remoteMediaStatus: {
          audioEnabled: true,
          videoEnabled: true,
          isScreenSharing: true,
        },
      };

      render(
        <BrowserRouter>
          <VideoCallRoom
            sessionId="sess-100"
            state={mockLearnerState}
            onToggleAudio={vi.fn()}
            onToggleVideo={vi.fn()}
            onStartScreenShare={vi.fn().mockResolvedValue(undefined)}
            onStopScreenShare={vi.fn().mockResolvedValue(undefined)}
            onLeaveCall={vi.fn().mockResolvedValue(undefined)}
          />
        </BrowserRouter>
      );

      expect(screen.getByText(/Teaching Mode • Teacher's Screen/i)).toBeInTheDocument();
      expect(screen.getByText(/Alice Student's Screen/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /start screen sharing/i })).not.toBeInTheDocument();
    });
  });

  describe('VideoCallPage Component', () => {
    let testQueryClient: QueryClient;

    beforeEach(() => {
      testQueryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      vi.clearAllMocks();

      vi.mocked(authService.getSession).mockResolvedValue({
        user: { id: 'usr-teacher', email: 'teacher@campus.edu' } as any,
        access_token: 'valid-token',
      } as any);
    });

    it('renders invalid session view when no session id parameter is provided', () => {
      render(
        <QueryClientProvider client={testQueryClient}>
          <AuthProvider>
            <BrowserRouter>
              <VideoCallPage />
            </BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
      );

      expect(screen.getByText('Invalid Session ID')).toBeInTheDocument();
      expect(screen.getByText('Back to Sessions')).toBeInTheDocument();
    });
  });
});
