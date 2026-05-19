/**
 * Notifications — backed by {@code /api/notifications} (Spring {@code Notification} entity).
 * Maps legacy {@code targetUserId} payloads to {@code userId}.
 */
import notificationApi from '../api/notificationApi';

function mapCreatePayload(notification) {
  return {
    userId: notification.userId ?? notification.targetUserId ?? null,
    targetRole: notification.targetRole ?? null,
    type: notification.type || 'info',
    title: notification.title,
    message: notification.message,
  };
}

export const notificationService = {
  createNotification: async (notification) => {
    const body = mapCreatePayload(notification);
    const created = await notificationApi.create(body);
    window.dispatchEvent(new Event('notificationsUpdated'));
    return created;
  },

  getNotifications: async (userId, role) => {
    try {
      return await notificationApi.listForUser(userId, role);
    } catch {
      return [];
    }
  },

  markAsRead: async (id) => {
    await notificationApi.markRead(id);
    window.dispatchEvent(new Event('notificationsUpdated'));
  },

  markAsUnread: async (id) => {
    await notificationApi.markUnread(id);
    window.dispatchEvent(new Event('notificationsUpdated'));
  },

  markAllAsRead: async (userId, role) => {
    await notificationApi.markAllRead(userId, role);
    window.dispatchEvent(new Event('notificationsUpdated'));
  },

  deleteNotification: async (id) => {
    await notificationApi.delete(id);
    window.dispatchEvent(new Event('notificationsUpdated'));
  },

  clearNotifications: async (userId, role) => {
    await notificationApi.clearAllForUser(userId, role);
    window.dispatchEvent(new Event('notificationsUpdated'));
  },

  sendBroadcast: async (payload) => {
    const res = await notificationApi.broadcast(payload);
    window.dispatchEvent(new Event('notificationsUpdated'));
    return res;
  },
};

export default notificationService;
