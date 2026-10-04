import { Notification } from "@/types";

const INITIAL_NOTIFICATIONS: Notification[] = [];

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
