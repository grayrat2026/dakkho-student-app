'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigationStore, useNotificationStore, type Page } from '@/lib/store';
import { pushApi } from '@/lib/api-client';
import { parseDeepLink, extractNotificationUrl } from '@/lib/deep-link';
import { useNotificationSound } from '@/hooks/use-notification-sound';
import { toast } from 'sonner';

// ============ OneSignal Types ============

interface OneSignalEventNotification {
  notificationId: string;
  heading?: string;
  body?: string;
  data?: Record<string, unknown>;
  url?: string;
}

interface OneSignalNS {
  User: {
    PushSubscription: {
      id: string | null;
      optedIn: boolean;
    };
  };
  Notifications: {
    permission: boolean;
    permissionNative: NotificationPermission;
    requestPermission: () => Promise<boolean>;
    addEventListener: (event: string, callback: (...args: unknown[]) => void) => void;
    removeEventListener: (event: string, callback: (...args: unknown[]) => void) => void;
  };
  addListenerForNotificationOpened?: (callback: (notification: OneSignalEventNotification) => void) => void;
}

declare global {
  interface Window {
    OneSignal?: OneSignalNS;
    OneSignalDeferred?: Array<(os: OneSignalNS) => void>;
  }
}

export type PushPermissionStatus = 'checking' | 'granted' | 'denied' | 'default' | 'unsupported';

interface UseOneSignalOptions {
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean;
  /** Whether to auto-request permission on login (default: false — user must opt in) */
  autoRequestPermission?: boolean;
  /** Whether sound is enabled for notifications (default: true) */
  soundEnabled?: boolean;
}

/**
 * Centralized OneSignal integration hook.
 *
 * Handles:
 * - OneSignal SDK initialization (idempotent)
 * - Permission request (triggered by user action)
 * - Push token registration/unregistration with backend
 * - Foreground notification handler (in-app toast + sound)
 * - Notification click handler (deep link navigation)
 * - Permission status tracking
 */
export function useOneSignal({
  isAuthenticated,
  autoRequestPermission = false,
  soundEnabled = true,
}: UseOneSignalOptions) {
  const [permissionStatus, setPermissionStatus] = useState<PushPermissionStatus>('checking');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  const navigate = useNavigationStore((s) => s.navigate);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const { playSound } = useNotificationSound({ enabled: soundEnabled });

  const registeredTokenRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  // ---- Request push permission (user-triggered) ----
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsRequestingPermission(true);
    try {
      if (window.OneSignal) {
        const granted = await window.OneSignal.Notifications.requestPermission();
        if (granted) {
          setPermissionStatus('granted');
          // Register the push token with backend
          const token = window.OneSignal.User.PushSubscription.id;
          if (token) {
            await pushApi.register({
              push_token: token,
              device_type: 'web',
              device_info: navigator.userAgent,
            });
            registeredTokenRef.current = token;
          }
          return true;
        } else {
          if (window.OneSignal.Notifications.permissionNative === 'denied') {
            setPermissionStatus('denied');
          } else {
            setPermissionStatus('default');
          }
          return false;
        }
      } else if ('Notification' in window) {
        const result = await Notification.requestPermission();
        if (result === 'granted') {
          setPermissionStatus('granted');
          return true;
        } else if (result === 'denied') {
          setPermissionStatus('denied');
          return false;
        } else {
          setPermissionStatus('default');
          return false;
        }
      }
      return false;
    } catch (err) {
      console.error('[OneSignal] Failed to request permission:', err);
      return false;
    } finally {
      setIsRequestingPermission(false);
    }
  }, []);

  // ---- Update permission status from SDK state ----
  const updatePermissionFromSDK = useCallback((os: OneSignalNS) => {
    try {
      if (os.Notifications.permission) {
        setPermissionStatus('granted');
      } else if (os.Notifications.permissionNative === 'denied') {
        setPermissionStatus('denied');
      } else {
        setPermissionStatus('default');
      }
    } catch {
      setPermissionStatus('default');
    }
  }, []);

  // ---- Register push token with backend ----
  const registerPushToken = useCallback(async (os: OneSignalNS) => {
    try {
      const token = os.User.PushSubscription.id;
      if (token && token !== registeredTokenRef.current) {
        await pushApi.register({
          push_token: token,
          device_type: 'web',
          device_info: navigator.userAgent,
        });
        registeredTokenRef.current = token;
      }
    } catch (err) {
      console.warn('[OneSignal] Push token registration failed:', err);
    }
  }, []);

  // ---- Unregister push token on logout ----
  const unregisterPushToken = useCallback(async () => {
    const token = registeredTokenRef.current;
    if (token) {
      try {
        await pushApi.unregister({ push_token: token });
      } catch (err) {
        console.warn('[OneSignal] Push token unregistration failed:', err);
      }
      registeredTokenRef.current = null;
    }
  }, []);

  // ---- Initialize OneSignal SDK & listeners (once) ----
  useEffect(() => {
    if (initializedRef.current) return;
    if (typeof window === 'undefined') return;

    const initSDK = (OneSignal: OneSignalNS) => {
      if (initializedRef.current) return;
      initializedRef.current = true;

      // Update permission status
      updatePermissionFromSDK(OneSignal);

      // Register push token if already opted in & authenticated
      if (isAuthenticated && OneSignal.User.PushSubscription.optedIn) {
        registerPushToken(OneSignal);
      }

      // ---- Foreground notification handler ----
      const foregroundHandler = (event: unknown) => {
        try {
          const evt = event as { notification?: OneSignalEventNotification };
          const notif = evt.notification;
          if (notif) {
            // Add to notification store
            addNotification({
              id: notif.notificationId || `os-${Date.now()}`,
              title: notif.heading || 'New Notification',
              message: notif.body || '',
              type: 'info',
              isRead: false,
              createdAt: new Date().toISOString(),
              actionUrl: notif.url || undefined,
            });

            // Play notification sound
            playSound();

            // Show in-app toast via sonner
            try {
              toast(notif.heading || 'New Notification', {
                description: notif.body,
                duration: 5000,
              });
            } catch {
              // sonner not available
            }
          }
        } catch (err) {
          console.warn('[OneSignal] Foreground handler error:', err);
        }
      };

      try {
        OneSignal.Notifications.addEventListener('foregroundWillDisplay', foregroundHandler);
      } catch {
        // Older SDK version may not support this event
      }

      // ---- Permission change listener ----
      try {
        const permissionHandler = () => {
          updatePermissionFromSDK(OneSignal);
          // Auto-register token when permission is granted
          if (OneSignal.Notifications.permission && OneSignal.User.PushSubscription.id) {
            registerPushToken(OneSignal);
          }
        };
        OneSignal.Notifications.addEventListener('permissionChange', permissionHandler as (...args: unknown[]) => void);
      } catch {
        // permissionChange may not be available
      }

      // ---- Notification click handler (deep linking) ----
      try {
        if (OneSignal.addListenerForNotificationOpened) {
          OneSignal.addListenerForNotificationOpened((notification: OneSignalEventNotification) => {
            const url = extractNotificationUrl({
              data: notification.data,
              url: notification.url,
            });
            if (url) {
              const { page, params } = parseDeepLink(url);
              navigate(page as Page, params);
            }
          });
        }
      } catch {
        // notification click handler not available
      }
    };

    // Wait for OneSignal SDK to be ready
    if (window.OneSignal) {
      initSDK(window.OneSignal);
    } else if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push((OneSignal) => {
        initSDK(OneSignal);
      });
    } else {
      // OneSignal SDK not available at all — fall back to browser Notification API
      if (!('Notification' in window)) {
        setPermissionStatus('unsupported');
      } else if (Notification.permission === 'granted') {
        setPermissionStatus('granted');
      } else if (Notification.permission === 'denied') {
        setPermissionStatus('denied');
      } else {
        setPermissionStatus('default');
      }
    }
  }, [addNotification, navigate, playSound, registerPushToken, isAuthenticated, updatePermissionFromSDK]);

  // ---- Handle auth state changes ----
  useEffect(() => {
    if (isAuthenticated && window.OneSignal) {
      // Register push token on login
      if (window.OneSignal.User.PushSubscription.optedIn) {
        registerPushToken(window.OneSignal);
      }

      // Auto-request permission if configured
      if (autoRequestPermission && !window.OneSignal.Notifications.permission) {
        requestPermission();
      }
    }
    // Note: unregisterPushToken is exposed for explicit logout handling
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return {
    permissionStatus,
    isRequestingPermission,
    requestPermission,
    unregisterPushToken,
  };
}
