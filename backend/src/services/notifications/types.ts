import { NotificationCategory, NotificationType } from '../../models/Notification.js';

export interface NotificationPayload {
  title: string;
  message: string;
  category: NotificationCategory;
  type: NotificationType;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

export interface ProviderDeliveryResult {
  success: boolean;
  messageId?: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED';
  isSimulated?: boolean;
  error?: string;
}

export interface INotificationChannelProvider {
  channelName: string;
  send(
    recipient: { userId: string; email?: string; phone?: string; name?: string },
    payload: NotificationPayload
  ): Promise<ProviderDeliveryResult>;
}
