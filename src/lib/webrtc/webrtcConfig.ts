/**
 * WebRTC Configuration & Network Statistics Utility
 * Configures ICE servers (STUN/TURN) and parses real RTCPeerConnection statistics.
 */

export interface SignalingMessage {
  type: "peer-joined" | "offer" | "answer" | "ice-candidate" | "user-left" | "media-state";
  senderId: string;
  senderName?: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  mediaState?: {
    isAudioMuted: boolean;
    isVideoOff: boolean;
    isScreenSharing: boolean;
  };
}

export interface NetworkQualityStats {
  rttMs: number | null;
  packetsLost: number;
  fractionLost: number;
  bytesReceived: number;
  bytesSent: number;
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  quality: "excellent" | "good" | "fair" | "poor" | "unknown";
}

/**
 * Generates an RTCConfiguration with default public STUN servers
 * and optional TURN server settings configured through environment variables.
 * Never hardcodes sensitive credentials.
 */
export function getRTCConfiguration(): RTCConfiguration {
  const iceServers: RTCIceServer[] = [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
      ],
    },
  ];

  // Optional TURN configuration via environment variables
  const turnUrl = process.env.NEXT_PUBLIC_TURN_SERVER_URL;
  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

  if (turnUrl) {
    const turnServer: RTCIceServer = { urls: turnUrl };
    if (turnUsername) turnServer.username = turnUsername;
    if (turnCredential) turnServer.credential = turnCredential;
    iceServers.push(turnServer);
  }

  return {
    iceServers,
    iceCandidatePoolSize: 2,
  };
}

/**
 * Extracts real network statistics from RTCPeerConnection.getStats()
 * Uses standard candidate-pair and inbound-rtp metrics without fabrication.
 */
export async function parseWebRTCStats(
  pc: RTCPeerConnection
): Promise<NetworkQualityStats> {
  const defaultStats: NetworkQualityStats = {
    rttMs: null,
    packetsLost: 0,
    fractionLost: 0,
    bytesReceived: 0,
    bytesSent: 0,
    connectionState: pc.connectionState,
    iceConnectionState: pc.iceConnectionState,
    quality: "unknown",
  };

  try {
    const statsReport = await pc.getStats();
    let currentRtt: number | null = null;
    let totalPacketsLost = 0;
    let totalPacketsReceived = 0;
    let totalBytesReceived = 0;
    let totalBytesSent = 0;

    statsReport.forEach((report) => {
      // 1. Latency (Round Trip Time) from candidate-pair stats
      if (
        report.type === "candidate-pair" &&
        report.state === "succeeded" &&
        typeof report.currentRoundTripTime === "number"
      ) {
        currentRtt = Math.round(report.currentRoundTripTime * 1000);
      }

      // 2. Inbound audio/video RTP stats for packet loss
      if (report.type === "inbound-rtp") {
        if (typeof report.packetsLost === "number") {
          totalPacketsLost += report.packetsLost;
        }
        if (typeof report.packetsReceived === "number") {
          totalPacketsReceived += report.packetsReceived;
        }
        if (typeof report.bytesReceived === "number") {
          totalBytesReceived += report.bytesReceived;
        }
      }

      // 3. Outbound RTP stats for bytes sent
      if (report.type === "outbound-rtp" && typeof report.bytesSent === "number") {
        totalBytesSent += report.bytesSent;
      }
    });

    const totalPackets = totalPacketsReceived + totalPacketsLost;
    const fractionLost = totalPackets > 0 ? (totalPacketsLost / totalPackets) * 100 : 0;

    // Quality estimation based on actual RTT and loss
    let quality: NetworkQualityStats["quality"] = "good";
    if (currentRtt === null) {
      quality = pc.connectionState === "connected" ? "good" : "unknown";
    } else if (currentRtt < 100 && fractionLost < 2) {
      quality = "excellent";
    } else if (currentRtt < 250 && fractionLost < 5) {
      quality = "good";
    } else if (currentRtt < 500 || fractionLost < 15) {
      quality = "fair";
    } else {
      quality = "poor";
    }

    return {
      rttMs: currentRtt,
      packetsLost: totalPacketsLost,
      fractionLost: Math.round(fractionLost * 10) / 10,
      bytesReceived: totalBytesReceived,
      bytesSent: totalBytesSent,
      connectionState: pc.connectionState,
      iceConnectionState: pc.iceConnectionState,
      quality,
    };
  } catch {
    return defaultStats;
  }
}
