import { Session, SessionStatus } from "@/types";
import { UPCOMING_SESSIONS } from "@/data/mockData";

let sessionsStore: Session[] = UPCOMING_SESSIONS.map((s) => ({
  id: s.id,
  topic: s.topic,
  partnerId: "partner-" + s.id,
  partnerName: s.partnerName,
  partnerAvatar: s.partnerAvatar,
  partnerRole: s.partnerRole || "Peer Mentor",
  role: s.role,
  scheduledAt: s.time,
  duration: s.duration,
  date: s.date,
  status: s.status as SessionStatus,
  meetingUrl: `https://meet.skillswap.app/room/${s.id}`,
}));

export const sessionService = {
  async getSessions(statusFilter?: SessionStatus): Promise<Session[]> {
    if (!statusFilter) return Promise.resolve([...sessionsStore]);
    return Promise.resolve(sessionsStore.filter((s) => s.status === statusFilter));
  },

  async bookSession(sessionData: Omit<Session, "id">): Promise<Session> {
    const newSession: Session = {
      ...sessionData,
      id: `sess-${Date.now()}`,
    };
    sessionsStore = [newSession, ...sessionsStore];
    return Promise.resolve(newSession);
  },

  async cancelSession(sessionId: string): Promise<boolean> {
    const found = sessionsStore.find((s) => s.id === sessionId);
    if (found) {
      found.status = "cancelled";
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  },
};
