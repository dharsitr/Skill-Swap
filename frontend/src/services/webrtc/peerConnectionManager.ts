import { RTC_CONFIGURATION } from './webrtcConfig';

export interface PeerConnectionCallbacks {
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  onRemoteStream: (stream: MediaStream) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  onIceConnectionStateChange: (state: RTCIceConnectionState) => void;
}

export class PeerConnectionManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private callbacks: PeerConnectionCallbacks;

  constructor(callbacks: PeerConnectionCallbacks) {
    this.callbacks = callbacks;
  }

  public initialize(localStream?: MediaStream | null): RTCPeerConnection {
    if (this.peerConnection) {
      this.cleanup();
    }

    this.peerConnection = new RTCPeerConnection(RTC_CONFIGURATION);
    this.remoteStream = new MediaStream();
    this.pendingCandidates = [];

    if (localStream) {
      this.setLocalStream(localStream);
    }

    this.setupListeners();
    return this.peerConnection;
  }

  public setLocalStream(stream: MediaStream): void {
    this.localStream = stream;
    if (!this.peerConnection) return;

    // Remove existing senders if any
    const senders = this.peerConnection.getSenders();
    senders.forEach((sender) => {
      if (this.peerConnection) {
        try {
          this.peerConnection.removeTrack(sender);
        } catch (e) {
          console.warn('Error removing track from peer connection:', e);
        }
      }
    });

    // Add new tracks
    stream.getTracks().forEach((track) => {
      if (this.peerConnection && this.localStream) {
        this.peerConnection.addTrack(track, this.localStream);
      }
    });
  }

  private setupListeners(): void {
    if (!this.peerConnection) return;

    this.peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        this.callbacks.onIceCandidate(event.candidate);
      }
    };

    this.peerConnection.ontrack = (event: RTCTrackEvent) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
      } else if (this.remoteStream) {
        this.remoteStream.addTrack(event.track);
      }
      if (this.remoteStream) {
        this.callbacks.onRemoteStream(this.remoteStream);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection) {
        this.callbacks.onConnectionStateChange(this.peerConnection.connectionState);
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection) {
        this.callbacks.onIceConnectionStateChange(this.peerConnection.iceConnectionState);
      }
    };
  }

  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection not initialized');
    }

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  public async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection not initialized');
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    await this.drainPendingCandidates();

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  public async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection not initialized');
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    await this.drainPendingCandidates();
  }

  public async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection || !this.peerConnection.remoteDescription || !this.peerConnection.remoteDescription.type) {
      // Queue candidate if remote description is not set yet
      this.pendingCandidates.push(candidate);
      return;
    }

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('Error adding received ICE candidate:', err);
    }
  }

  private async drainPendingCandidates(): Promise<void> {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) return;

    while (this.pendingCandidates.length > 0) {
      const candidate = this.pendingCandidates.shift();
      if (candidate) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error draining queued ICE candidate:', err);
        }
      }
    }
  }

  public cleanup(): void {
    if (this.peerConnection) {
      this.peerConnection.onicecandidate = null;
      this.peerConnection.ontrack = null;
      this.peerConnection.onconnectionstatechange = null;
      this.peerConnection.oniceconnectionstatechange = null;

      try {
        this.peerConnection.close();
      } catch (e) {
        console.warn('Error closing peer connection:', e);
      }
      this.peerConnection = null;
    }

    this.localStream = null;
    this.remoteStream = null;
    this.pendingCandidates = [];
  }

  public async replaceVideoTrack(newTrack: MediaStreamTrack | null): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection not initialized');
    }

    const senders = this.peerConnection.getSenders();
    const videoSender = senders.find(
      (sender) => sender.track?.kind === 'video' || (sender.track === null && !sender.dtmf)
    );

    if (videoSender) {
      await videoSender.replaceTrack(newTrack);
    } else if (newTrack && this.localStream) {
      this.peerConnection.addTrack(newTrack, this.localStream);
    }
  }

  public getVideoSender(): RTCRtpSender | null {
    if (!this.peerConnection) return null;
    return (
      this.peerConnection
        .getSenders()
        .find((sender) => sender.track?.kind === 'video') ?? null
    );
  }

  public getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }

  public getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }
}
