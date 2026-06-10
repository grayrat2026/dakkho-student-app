/**
 * DAKKHO Student App — Web Push Notification Helper
 * Handles service worker registration and push subscription
 */

import { webPushApi } from './api-client';

const SW_PATH = '/sw.js';

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register the service worker and return the registration
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, {
      scope: '/',
    });
    swRegistration = registration;
    return registration;
  } catch (error) {
    console.error('Failed to register service worker:', error);
    return null;
  }
}

/**
 * Subscribe to web push notifications
 * Returns true if subscription was successful
 */
export async function subscribeToPush(): Promise<boolean> {
  if (!swRegistration) {
    const reg = await registerServiceWorker();
    if (!reg) return false;
    swRegistration = reg;
  }

  try {
    // Get VAPID public key from server
    const { publicKey } = await webPushApi.getVapidKey();
    if (!publicKey) {
      console.warn('VAPID public key not available from server');
      return false;
    }

    // Convert base64url to Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    // Check for existing subscription
    let subscription = await swRegistration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    // Send subscription to server
    const subscriptionJson = subscription.toJSON();
    await webPushApi.subscribe(subscriptionJson as any);

    return true;
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
    return false;
  }
}

/**
 * Check if push notifications are supported and permitted
 */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Get current push permission status
 */
export function getPushPermissionStatus(): NotificationPermission {
  if (typeof window === 'undefined') return 'denied';
  return Notification.permission;
}

/**
 * Request push notification permission
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined') return 'denied';
  return Notification.requestPermission();
}

/**
 * Initialize push notifications (called after login)
 */
export async function initPushNotifications(): Promise<void> {
  if (!isPushSupported()) return;

  // Don't auto-subscribe if permission not granted
  if (Notification.permission === 'denied') return;

  try {
    // Register service worker
    await registerServiceWorker();

    // If permission already granted, subscribe
    if (Notification.permission === 'granted') {
      await subscribeToPush();
    }
  } catch (error) {
    console.error('Failed to init push notifications:', error);
  }
}

/**
 * Convert base64url string to Uint8Array (for VAPID key)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
