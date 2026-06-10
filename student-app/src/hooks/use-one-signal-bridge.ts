'use client';

import { useEffect, useRef } from 'react';
import { useNotificationStore, useAuthStore, type AppNotification } from '@/lib/store';

/**
 * OneSignal → Zustand Notification Bridge
 *
 * When a OneSignal push notification arrives, this hook intercepts it
 * and adds it to the Zustand notification store so it appears
 * in the notification tray immediately.
 *
 * Also connects the notification-bridge polling to keep
 * the tray in sync with the server.
 */
export function useOneSignalBridge() {
  const addNotification = useNotificationStore((s) => s.addNotification);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const bridgeAttached = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || bridgeAttached.current) return;

    // Wait for OneSignal to be available
    const attachBridge = () => {
      const OneSignal = (window as any).OneSignal;
      if (!OneSignal) {
        // Retry after a delay
        setTimeout(attachBridge, 2000);
        return;
      }

      try {
        // Listen for push notifications displayed
        OneSignal.on('notificationDisplay', (event: any) => {
          const notification: AppNotification = {
            id: event?.notification?.notificationId || `push-${Date.now()}`,
            title: event?.notification?.title || 'New Notification',
            message: event?.notification?.body || event?.notification?.message || '',
            type: 'announcement',
            isRead: false,
            createdAt: new Date().toISOString(),
            actionUrl: event?.notification?.url || undefined,
          };
          addNotification(notification);
        });

        // Also listen for notification click (mark as read)
        OneSignal.on('notificationClick', (event: any) => {
          // Notification was clicked — could navigate to actionUrl
          const url = event?.notification?.url;
          if (url && typeof window !== 'undefined') {
            // Let the app handle navigation
          }
        });

        bridgeAttached.current = true;
      } catch (err) {
        // OneSignal API may not be fully initialized yet
        console.warn('[OneSignalBridge] Failed to attach:', err);
      }
    };

    attachBridge();
  }, [isAuthenticated, addNotification]);
}
