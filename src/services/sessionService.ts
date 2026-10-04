import { Session, SessionStatus } from "@/types";

let sessionsStore: Session[] = [];

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
