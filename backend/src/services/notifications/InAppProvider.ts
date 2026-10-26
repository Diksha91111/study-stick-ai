import { INotificationChannelProvider, NotificationPayload, ProviderDeliveryResult } from './types.js';

export class InAppProvider implements INotificationChannelProvider {
  channelName = 'in_app';

  async send(
    recipient: { userId: string; email?: string; phone?: string; name?: string },
    payload: NotificationPayload
  ): Promise<ProviderDeliveryResult> {
    // In-app notifications are persisted in MongoDB and immediately available to the client.
    // They are considered DELIVERED to the user's inbox upon save.
    return {
      success: true,
      status: 'DELIVERED',
      messageId: `inapp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    };
  }
}
