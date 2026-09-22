import { Notification } from "@/types";

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    title: "Swap Request Accepted",
    message: "Priya Sharma accepted your UI/UX swap request. Session scheduled for tomorrow at 4:00 PM.",
    type: "swap_request",
    read: false,
    createdAt: "1 hour ago",
  },
  {
    id: "notif-2",
    title: "Welcome Credits Deposited",
    message: "50 welcome credits have been awarded to your SkillSwap wallet.",
    type: "bonus",
    read: false,
    createdAt: "Today",
  },
  {
    id: "notif-3",
    title: "Upcoming Session Reminder",
    message: "Your React session with Alex Johnson starts in 2 hours.",
    type: "session_reminder",
    read: true,
    createdAt: "Yesterday",
  },
];

const notificationsStore: Notification[] = [...INITIAL_NOTIFICATIONS];

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    return Promise.resolve([...notificationsStore]);
  },

  async markAsRead(id: string): Promise<boolean> {
    const found = notificationsStore.find((n) => n.id === id);
    if (found) {
      found.read = true;
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  },

  async markAllAsRead(): Promise<boolean> {
    notificationsStore.forEach((n) => (n.read = true));
    return Promise.resolve(true);
  },
};
