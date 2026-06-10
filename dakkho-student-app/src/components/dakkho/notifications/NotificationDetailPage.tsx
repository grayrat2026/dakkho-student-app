'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Info, AlertTriangle, CheckCircle, AlertCircle, Megaphone, BookOpen, Clock, ExternalLink } from 'lucide-react';
import { useNotificationStore, useNavigationStore, useAuthStore, type AppNotification } from '@/lib/store';
import { formatTimeAgo } from '@/lib/utils';
import { GlassCard } from '../shared/GlassCard';

const typeIcons: Record<string, React.ElementType> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  announcement: Megaphone,
  'course-update': BookOpen,
};

const typeColors: Record<string, string> = {
  info: 'text-sky-500 bg-sky-50 dark:bg-sky-900/20',
  success: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
  warning: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
  error: 'text-red-500 bg-red-50 dark:bg-red-900/20',
  announcement: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
  'course-update': 'text-teal-500 bg-teal-50 dark:bg-teal-900/20',
};

export function NotificationDetailPage() {
  const pageParams = useNavigationStore((s) => s.pageParams);
  const navigate = useNavigationStore((s) => s.navigate);
  const { notifications, markAsRead } = useNotificationStore();
  const user = useAuthStore((s) => s.user);

  const [notification, setNotification] = useState<AppNotification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Find notification by ID from pageParams
    const notifId = pageParams?.notificationId as string;
    if (notifId) {
      const found = notifications.find((n) => n.id === notifId);
      if (found) {
        setNotification(found);
        if (!found.isRead) {
          markAsRead(found.id);
        }
      }
    }
    setLoading(false);
  }, [pageParams, notifications, markAsRead]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          className="w-8 h-8 rounded-full border-2 border-sky-500 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  if (!notification) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
          <Bell className="w-10 h-10 text-muted-foreground/30" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Notification Not Found</h2>
        <p className="text-sm text-muted-foreground mt-1">This notification may have been removed or doesn't exist.</p>
        <motion.button
          className="mt-4 px-4 py-2 rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 text-sm font-semibold"
          onClick={() => navigate('notifications')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Back to Notifications
        </motion.button>
      </motion.div>
    );
  }

  const Icon = typeIcons[notification.type] || Info;
  const colorClass = typeColors[notification.type] || typeColors.info;

  const handleAction = () => {
    if (notification.actionUrl) {
      // If it's an internal route, navigate within app
      const url = notification.actionUrl;
      if (url.startsWith('/')) {
        const { page, params } = require('@/lib/store').urlToPage(url);
        navigate(page as any, params);
      } else {
        window.open(url, '_blank', 'noopener');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <motion.button
          className="w-10 h-10 rounded-xl bg-muted/50 dark:bg-muted/30 flex items-center justify-center"
          onClick={() => navigate('notifications')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </motion.button>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Notification Details</h1>
          <p className="text-sm text-muted-foreground">
            {user?.fullName || 'User'} &middot; {notification.id.slice(0, 8)}...
          </p>
        </div>
      </div>

      {/* Notification Card */}
      <GlassCard className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
            <Icon className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-xl font-bold text-foreground">{notification.title}</h2>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase ${colorClass}`}>
                {notification.type}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>{new Date(notification.createdAt).toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              <span>&middot;</span>
              <span>{formatTimeAgo(notification.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Notification Body */}
        <div className="bg-muted/30 dark:bg-muted/20 rounded-xl p-5 mb-6">
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{notification.message}</p>
        </div>

        {/* Action Button */}
        {notification.actionUrl && (
          <motion.button
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20"
            onClick={handleAction}
            whileHover={{ scale: 1.01, boxShadow: '0 10px 25px -5px rgba(14, 165, 233, 0.4)' }}
            whileTap={{ scale: 0.99 }}
          >
            <ExternalLink className="w-4 h-4" />
            Open Action
          </motion.button>
        )}
      </GlassCard>

      {/* Meta Info */}
      <GlassCard className="p-4 mt-4">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground">Notification ID</span>
            <p className="font-mono text-foreground mt-0.5">{notification.id}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Type</span>
            <p className="text-foreground mt-0.5 capitalize">{notification.type}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Status</span>
            <p className={`mt-0.5 ${notification.isRead ? 'text-emerald-500' : 'text-amber-500'}`}>
              {notification.isRead ? 'Read' : 'Unread'}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Received</span>
            <p className="text-foreground mt-0.5">{formatTimeAgo(notification.createdAt)}</p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
