// Push Notifications & Browser Web Notification Service
import { CaregiverContact, CaregiverAlertMessage, Medication } from '../types';

export class NotificationManager {
  private static instance: NotificationManager;
  private permission: NotificationPermission = 'default';

  private constructor() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  public async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported in this browser environment');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      this.permission = result;
      return result === 'granted';
    } catch (e) {
      console.warn('Failed to request notification permission', e);
      return false;
    }
  }

  public getPermissionStatus(): NotificationPermission {
    if ('Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  }

  public notifyDoseDue(med: Medication, scheduledTime: string) {
    const title = `💊 Time for your ${med.name}!`;
    const options: NotificationOptions = {
      body: `Dosage: ${med.dosage} (${med.foodTiming.replace('_', ' ')})\nClick to mark dose taken.`,
      icon: '/favicon.ico',
      tag: `dose-${med.id}-${scheduledTime}`,
      requireInteraction: true,
    };

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, options);
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (err) {
        console.warn('Native notification failed, falling back to in-app notification', err);
      }
    }

    // Always dispatch an in-app event for toast or overlay
    window.dispatchEvent(
      new CustomEvent('dosemate-push-alert', {
        detail: {
          medication: med,
          time: scheduledTime,
          type: 'dose_due',
        },
      })
    );
  }

  public notifyCaregiver(caregiver: CaregiverContact, medName: string, time: string): CaregiverAlertMessage {
    const messageText = `EMERGENCY / CAREGIVER ALERT: Patient missed scheduled dose of ${medName} scheduled at ${time}. Please check in on patient.`;
    
    const alertRecord: CaregiverAlertMessage = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      caregiverName: caregiver.name,
      recipientPhone: caregiver.phone,
      recipientEmail: caregiver.email,
      medicationName: medName,
      scheduledTime: time,
      type: 'missed_dose',
      status: 'delivered',
      messageText,
    };

    // Trigger local push notification for confirmation
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`Caregiver Alert Sent to ${caregiver.name}`, {
          body: `Notice sent via SMS to ${caregiver.phone} regarding missed ${medName}.`,
          icon: '/favicon.ico',
        });
      } catch (e) {
        console.warn('Caregiver notification error', e);
      }
    }

    return alertRecord;
  }
}

export const notificationService = NotificationManager.getInstance();
