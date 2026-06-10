'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useNotificationStore, useAuthStore, type AppNotification } from '@/lib/store';
import { studentNotificationsApi } from './api-client';

/**
 * Notification Bridge — Polling + Real-time Sync
 *
 * Periodically polls the Worker API for new notifications and syncs them
 * into the Zustand notification store so they appear in the tray.
 *
 * Also hydrates from localStorage on mount for instant display.
 *
 * Works alongside useOneSignalBridge which handles push notification events.
 */
export function useNotificationBridge() {
  const addNotifications = useNotificationStore((s) => s.addNotifications);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFirstFetch = useRef(true);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const result = await studentNotificationsApi.list({ limit: 20, offset: 0 });
      const serverNotifs: AppNotification[] = (result.notifications || []).map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: (n.type as AppNotification['type']) || 'info',
        isRead: n.read,
        createdAt: n.createdAt,
        actionUrl: n.actionUrl || undefined,
      }));

      if (serverNotifs.length > 0) {
        addNotifications(serverNotifs);
      }
    } catch (err) {
      // Silently fail — localStorage cache is the fallback
      console.warn('[NotificationBridge] Fetch failed:', err);
    }
  }, [isAuthenticated, addNotifications]);

  useEffect(() => {
    if (!isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchNotifications();
    isFirstFetch.current = false;

    // Poll every 30 seconds
    intervalRef.current = setInterval(fetchNotifications, 30_000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, fetchNotifications]);
}
