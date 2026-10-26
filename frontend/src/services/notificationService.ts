import api from './api';
import { AppNotification, NotificationPreferences } from '../types';

export const notificationService = {
  // Get notifications
  getNotifications: async (params?: { limit?: number; skip?: number; unreadOnly?: boolean; channel?: string }) => {
    const response = await api.get('/notifications', { params });
    return response.data.data as {
      notifications: AppNotification[];
      total: number;
      unreadCount: number;
    };
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data.data.count as number;
  },

  // Mark single as read
  markAsRead: async (id: string) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data.data as AppNotification;
  },

  // Mark all as read
  markAllAsRead: async () => {
    const response = await api.patch('/notifications/mark-all-read');
    return response.data.data as { modifiedCount: number };
  },

  // Delete notification
  deleteNotification: async (id: string) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  // Get user notification preferences
  getPreferences: async () => {
    const response = await api.get('/notifications/preferences');
    return response.data.data as NotificationPreferences;
  },

  // Update preferences
  updatePreferences: async (preferences: Partial<NotificationPreferences>) => {
    const response = await api.put('/notifications/preferences', preferences);
    return response.data.data as NotificationPreferences;
  },

  // Send test notification
  sendTestNotification: async (channel: 'email' | 'whatsapp') => {
    const response = await api.post('/notifications/test', { channel });
    return response.data.data as {
      success: boolean;
      status: string;
      isSimulated?: boolean;
      error?: string;
    };
  },
};
