'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useAnimation, PanInfo } from 'framer-motion';
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, AlertCircle, Megaphone, BookOpen, Headphones, RefreshCw, Loader2, BellRing } from 'lucide-react';
import { useNavigationStore, useAuthStore, type AppNotification } from '@/lib/store';
import { notificationApi, type ServerNotification } from '@/lib/api-client';
import { isPushSupported, getPushPermissionStatus, requestPushPermission, subscribeToPush } from '@/lib/web-push';
import { GlassCard } from '../shared/GlassCard';

const typeIcons: Record<string, React.ElementType> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  announcement: Megaphone,
  'course-update': BookOpen,
  support: Headphones,
};

const typeColors: Record<string, string> = {
  info: 'text-sky-500 bg-sky-50 dark:bg-sky-900/20',
  success: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
  warning: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
  error: 'text-red-500 bg-red-50 dark:bg-red-900/20',
  announcement: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
  'course-update': 'text-teal-500 bg-teal-50 dark:bg-teal-900/20',
  support: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
};

// Parse SQLite datetime "2026-06-09 20:40:11" → JS Date
function parseDate(val: string): Date {
  if (!val) return new Date();
  // If already ISO format with T, parse directly
  if (val.includes('T')) return new Date(val);
  // SQLite format: "YYYY-MM-DD HH:MM:SS" → add T
  return new Date(val.replace(' ', 'T') + 'Z');
}

function formatTimeAgo(dateStr: string): string {
  const date = parseDate(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function SwipeableNotification({
  notification,
  onDismiss,
  onMarkRead,
  onNotificationClick,
  index,
}: {
  notification: AppNotification;
  onDismiss: (id: string) => void;
  onMarkRead: (id: string) => void;
  onNotificationClick: (notification: AppNotification) => void;
  index: number;
}) {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      controls.start({ x: info.offset.x > 0 ? 300 : -300, opacity: 0, transition: { duration: 0.2 } }).then(() => {
        setIsDismissed(true);
        onDismiss(notification.id);
      });
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } });
    }
  };

  const Icon = typeIcons[notification.type] || Info;
  const colorClass = typeColors[notification.type] || typeColors.info;

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ delay: index * 0.03 }}
          style={{ x }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.7}
          onDragEnd={handleDragEnd}
          className="touch-pan-y"
        >
          <GlassCard
            hover
            className={`p-4 flex items-start gap-4 cursor-pointer ${!notification.isRead ? 'border-l-4 border-l-sky-400' : ''}`}
            onClick={() => {
              onMarkRead(notification.id);
              onNotificationClick(notification);
            }}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className={`text-sm font-bold ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {notification.title}
                </h3>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatTimeAgo(notification.createdAt)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
            </div>
            {!notification.isRead && (
              <div className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0 mt-2" />
            )}
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'support' | 'announcements'>('all');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [enablingPush, setEnablingPush] = useState(false);

  const navigate = useNavigationStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);

  // Check push notification status
  useEffect(() => {
    if (isPushSupported()) {
      setPushEnabled(getPushPermissionStatus() === 'granted');
    }
  }, []);

  const handleEnablePush = async () => {
    setEnablingPush(true);
    try {
      const permission = await requestPushPermission();
      if (permission === 'granted') {
        await subscribeToPush();
        setPushEnabled(true);
      }
    } catch (error) {
      console.error('Failed to enable push:', error);
    } finally {
      setEnablingPush(false);
    }
  };

  // Fetch notifications from API (D1 database)
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setRefreshing(true);
      const data = await notificationApi.list({ limit: 50 });
      const mapped: AppNotification[] = data.notifications.map((n: ServerNotification) => ({
        id: String(n.id),
        title: n.title || '',
        message: n.message || '',
        type: (n.type || 'info') as AppNotification['type'],
        isRead: !!n.read,
        createdAt: n.createdAt || '',
        actionUrl: n.actionUrl || '',
        category: n.category || '',
      }));
      setNotifications(mapped);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    // Optimistically update UI
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    // Also mark on server
    try {
      await notificationApi.markRead(id);
    } catch {}
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await notificationApi.markAllRead();
    } catch {}
  };

  const handleNotificationClick = (notification: AppNotification) => {
    // Navigate based on actionUrl
    if (notification.actionUrl) {
      const url = notification.actionUrl;
      // If it's a support ticket URL, navigate to contact support
      if (url.includes('contact-support') || url.includes('help/contact-support')) {
        navigate('contact-support');
      } else if (url.includes('notifications')) {
        // Notification detail page
        navigate('notification-detail', {
          userId: user?.id || 'anonymous',
          notificationId: notification.id,
          notificationSlug: notification.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50),
        });
      } else {
        // Try to sync from URL for other pages
        try {
          const urlPath = new URL(url).pathname;
          // Attempt URL → page sync
          const { page, params } = require('@/lib/store').urlToPage(urlPath);
          navigate(page as any, params);
        } catch {
          // Fallback: just go to notifications
        }
      }
    } else {
      navigate('notification-detail', {
        userId: user?.id || 'anonymous',
        notificationId: notification.id,
        notificationSlug: notification.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50),
      });
    }
  };

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  const filtered = notifications.filter((n) => {
    if (dismissedIds.has(n.id)) return false;
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'announcements') return n.type === 'announcement' || n.category === 'announcement';
    if (activeTab === 'support') return n.category === 'support' || n.title.toLowerCase().includes('support') || n.title.toLowerCase().includes('ticket') || n.title.toLowerCase().includes('reply') || n.type === 'support';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead && !dismissedIds.has(n.id)).length;

  const tabs = [
    { key: 'all' as const, label: 'All' },
    { key: 'unread' as const, label: `Unread (${unreadCount})` },
    { key: 'support' as const, label: 'Support' },
    { key: 'announcements' as const, label: 'Announcements' },
  ];

  return (
    <div>
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">{unreadCount} unread notifications</p>
        </div>
        <div className="flex items-center gap-2">
          {!pushEnabled && isPushSupported() && (
            <motion.button
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-semibold shadow-lg shadow-sky-500/20"
              onClick={handleEnablePush}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={enablingPush}
            >
              <BellRing className={`w-4 h-4 ${enablingPush ? 'animate-pulse' : ''}`} />
              {enablingPush ? 'Enabling...' : 'Enable Push'}
            </motion.button>
          )}
          <motion.button
            className="p-2.5 rounded-xl bg-muted/30 text-muted-foreground hover:text-sky-500 transition-colors"
            onClick={fetchNotifications}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </motion.button>
          {unreadCount > 0 && (
            <motion.button
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 text-sm font-semibold"
              onClick={handleMarkAllRead}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted/30 rounded-xl p-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {tabs.map((tab) => (
          <motion.button
            key={tab.key}
            className={`flex-shrink-0 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-slate-800 shadow-sm text-sky-600 dark:text-sky-400'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab(tab.key)}
            whileTap={{ scale: 0.97 }}
          >
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Notification list */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((notification, i) => (
              <SwipeableNotification
                key={notification.id}
                notification={notification}
                onDismiss={handleDismiss}
                onMarkRead={handleMarkRead}
                onNotificationClick={handleNotificationClick}
                index={i}
              />
            ))}
          </AnimatePresence>
        )}

        {!loading && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-semibold text-foreground">No notifications</p>
            <p className="text-xs text-muted-foreground mt-1">You&apos;re all caught up! Swipe to dismiss individual notifications.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
