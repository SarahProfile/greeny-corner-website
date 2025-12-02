export class NotificationService {
  private static instance: NotificationService;
  private hasPermission: boolean = false;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.ready;
        console.log('Service Worker registered for notifications');
      } catch (error) {
        console.warn('Service Worker registration failed:', error);
      }
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.hasPermission = true;
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    this.hasPermission = permission === 'granted';
    return this.hasPermission;
  }

  canSendNotifications(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  sendWateringReminder(plantName: string, plantId: number): void {
    this.sendCareReminder('watering', plantName, plantId, {
      emoji: '💧',
      titleKey: 'plants.wateringTitle',
      bodyKey: 'plants.wateringMessage'
    }).catch(console.error);
  }

  sendFertilizingReminder(plantName: string, plantId: number): void {
    this.sendCareReminder('fertilizing', plantName, plantId, {
      emoji: '🌱',
      titleKey: 'plants.fertilizingTitle',
      bodyKey: 'plants.fertilizingMessage'
    }).catch(console.error);
  }

  sendTillingReminder(plantName: string, plantId: number): void {
    this.sendCareReminder('tilling', plantName, plantId, {
      emoji: '🪴',
      titleKey: 'plants.tillingTitle',
      bodyKey: 'plants.tillingMessage'
    }).catch(console.error);
  }

  private async sendCareReminder(careType: string, plantName: string, plantId: number, config: {
    emoji: string;
    titleKey: string;
    bodyKey: string;
  }): Promise<void> {
    // Save to notification history in localStorage with translation keys
    this.saveNotificationToHistory(config.emoji, config.titleKey, config.bodyKey, { plantName });

    if (!this.canSendNotifications()) {
      console.warn('Cannot send notification - permission not granted, but saved to history');
      return;
    }

    // For browser notifications, use English as fallback (browser notifications don't support i18n)
    const englishTitles: Record<string, string> = {
      'plants.wateringTitle': `Time to water ${plantName}!`,
      'plants.fertilizingTitle': `Time to fertilize ${plantName}!`,
      'plants.tillingTitle': `Time to till ${plantName}!`
    };
    const englishBodies: Record<string, string> = {
      'plants.wateringMessage': `Your ${plantName} is ready for watering. Tap to view plant details.`,
      'plants.fertilizingMessage': `Your ${plantName} is ready for fertilizing. Give it some nutrients!`,
      'plants.tillingMessage': `Your ${plantName} needs soil tilling. Time to loosen the soil!`
    };

    const notificationTitle = `${config.emoji} ${englishTitles[config.titleKey] || plantName}`;
    const notificationBody = englishBodies[config.bodyKey] || `Your ${plantName} needs attention.`;

    const notificationOptions = {
      body: notificationBody,
      icon: '/favicon-greeny.svg',
      badge: '/favicon-greeny.svg',
      tag: `${careType}-${plantId}`, // Prevents duplicate notifications
      requireInteraction: true,
      data: {
        url: `/my-plants/${plantId}`,
        plantId,
        careType
      }
    };

    // Try to use Service Worker notification if available (supports actions)
    if (this.serviceWorkerRegistration) {
      try {
        await this.serviceWorkerRegistration.showNotification(notificationTitle, {
          ...notificationOptions,
          actions: [
            {
              action: 'view',
              title: 'View Plant',
              icon: '/favicon-greeny.svg'
            },
            {
              action: 'snooze',
              title: 'Remind Later'
            }
          ]
        } as any);
        return;
      } catch (error) {
        console.warn('Service Worker notification failed, falling back to regular notification:', error);
      }
    }

    // Fallback to regular browser notification
    const notification = new Notification(notificationTitle, notificationOptions);

    notification.onclick = () => {
      window.focus();
      window.location.href = `/my-plants/${plantId}`;
      notification.close();
    };

    // Auto-close after 15 seconds if user doesn't interact
    setTimeout(() => {
      notification.close();
    }, 15000);
  }

  scheduleWateringNotification(plantName: string, plantId: number, nextWateringDate: Date): void {
    this.scheduleCareNotification('watering', plantName, plantId, nextWateringDate, () => {
      this.sendWateringReminder(plantName, plantId);
    });
  }

  scheduleFertilizingNotification(plantName: string, plantId: number, nextFertilizingDate: Date): void {
    this.scheduleCareNotification('fertilizing', plantName, plantId, nextFertilizingDate, () => {
      this.sendFertilizingReminder(plantName, plantId);
    });
  }

  scheduleTillingNotification(plantName: string, plantId: number, nextTillingDate: Date): void {
    this.scheduleCareNotification('tilling', plantName, plantId, nextTillingDate, () => {
      this.sendTillingReminder(plantName, plantId);
    });
  }

  private scheduleCareNotification(
    careType: string,
    plantName: string, 
    plantId: number, 
    nextCareDate: Date, 
    sendReminderCallback: () => void
  ): void {
    const now = new Date();
    const timeUntilCare = nextCareDate.getTime() - now.getTime();

    if (timeUntilCare <= 0) {
      // If care is due now or overdue, send immediately
      sendReminderCallback();
      return;
    }

    // Schedule notification for the care time
    setTimeout(() => {
      sendReminderCallback();
    }, timeUntilCare);

    // Also schedule a notification 1 hour before if more than 1 hour away
    const oneHour = 60 * 60 * 1000;
    if (timeUntilCare > oneHour) {
      const emojiMap = {
        watering: '💧',
        fertilizing: '🌱',
        tilling: '🪴'
      };

      setTimeout(() => {
        const emoji = emojiMap[careType as keyof typeof emojiMap];
        const title = `${emoji} ${plantName} ${careType} reminder`;
        const body = `Your ${plantName} will need ${careType} in 1 hour.`;

        // Save to notification history with translation keys
        this.saveNotificationToHistory(emoji, 'plants.preReminderTitle', 'plants.preReminderMessage', { plantName, careType });

        if (this.canSendNotifications()) {
          new Notification(title, {
            body,
            icon: '/favicon-greeny.svg',
            tag: `pre-${careType}-${plantId}`
          });
        }
      }, timeUntilCare - oneHour);
    }
  }

  checkOverduePlants(plants: any[]): void {
    const now = new Date();
    
    plants.forEach(plant => {
      if (plant.care_schedule) {
        // Check overdue watering
        if (plant.care_schedule.next_watering_date && plant.care_schedule.watering_notifications_enabled) {
          this.checkOverdueCare(plant, 'watering', new Date(plant.care_schedule.next_watering_date), now, '💧', 'water');
        }
        
        // Check overdue fertilizing
        if (plant.care_schedule.next_fertilizing_date && plant.care_schedule.fertilizing_notifications_enabled) {
          this.checkOverdueCare(plant, 'fertilizing', new Date(plant.care_schedule.next_fertilizing_date), now, '🌱', 'fertilize');
        }
        
        // Check overdue tilling
        if (plant.care_schedule.next_tilling_date && plant.care_schedule.tilling_notifications_enabled) {
          this.checkOverdueCare(plant, 'tilling', new Date(plant.care_schedule.next_tilling_date), now, '🪴', 'till');
        }
      }
    });
  }

  private checkOverdueCare(plant: any, careType: string, careDate: Date, now: Date, emoji: string, action: string): void {
    if (careDate < now) {
      const daysPast = Math.floor((now.getTime() - careDate.getTime()) / (24 * 60 * 60 * 1000));
      const title = `🚨 ${plant.name} needs ${action}!`;
      const body = `Your ${plant.name} is ${daysPast} day(s) overdue for ${careType}.`;

      // Save to notification history with translation keys
      this.saveNotificationToHistory('🚨', 'plants.overdueTitle', 'plants.overdueMessage', {
        plantName: plant.name,
        action,
        days: daysPast,
        careType
      });

      if (this.canSendNotifications()) {
        new Notification(title, {
          body,
          icon: '/favicon-greeny.svg',
          tag: `overdue-${careType}-${plant.id}`,
          requireInteraction: true
        });
      }
    }
  }

  scheduleAllPlantNotifications(plants: any[]): void {
    plants.forEach(plant => {
      if (plant.care_schedule) {
        // Schedule watering notifications
        if (plant.care_schedule.next_watering_date && plant.care_schedule.watering_notifications_enabled) {
          const wateringDate = new Date(plant.care_schedule.next_watering_date);
          this.scheduleWateringNotification(plant.name, plant.id, wateringDate);
        }
        
        // Schedule fertilizing notifications
        if (plant.care_schedule.next_fertilizing_date && plant.care_schedule.fertilizing_notifications_enabled) {
          const fertilizingDate = new Date(plant.care_schedule.next_fertilizing_date);
          this.scheduleFertilizingNotification(plant.name, plant.id, fertilizingDate);
        }
        
        // Schedule tilling notifications
        if (plant.care_schedule.next_tilling_date && plant.care_schedule.tilling_notifications_enabled) {
          const tillingDate = new Date(plant.care_schedule.next_tilling_date);
          this.scheduleTillingNotification(plant.name, plant.id, tillingDate);
        }
      }
    });
  }

  // Store notification preferences in localStorage
  setNotificationsEnabled(enabled: boolean): void {
    localStorage.setItem('notifications_enabled', enabled.toString());
  }

  getNotificationsEnabled(): boolean {
    const stored = localStorage.getItem('notifications_enabled');
    return stored !== null ? stored === 'true' : true; // Default to enabled
  }

  // Save notification to history in localStorage
  private saveNotificationToHistory(emoji: string, titleKey: string, messageKey: string, data: any): void {
    if (typeof window === 'undefined') return;

    try {
      // Get existing notifications
      const existingNotifications = localStorage.getItem('notification_history');
      const notifications = existingNotifications ? JSON.parse(existingNotifications) : [];

      // Create new notification object with translation keys
      const newNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        emoji,
        titleKey,
        messageKey,
        data, // Contains plantName and other variables for interpolation
        timestamp: new Date().toISOString(),
        read: false
      };

      // Add to beginning of array (newest first)
      notifications.unshift(newNotification);

      // Keep only the last 50 notifications
      const trimmedNotifications = notifications.slice(0, 50);

      // Save back to localStorage
      localStorage.setItem('notification_history', JSON.stringify(trimmedNotifications));
    } catch (error) {
      console.error('Failed to save notification to history:', error);
    }
  }

  // Public method to send a test notification (for testing purposes)
  sendTestNotification(): void {
    this.saveNotificationToHistory(
      '🌿',
      'plants.wateringTitle',
      'plants.wateringMessage',
      { plantName: 'Test Plant' }
    );
  }
}

export const notificationService = NotificationService.getInstance();