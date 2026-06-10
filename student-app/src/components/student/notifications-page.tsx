"use client";

import { useEffect, useState, useCallback } from "react";
import { useStudentStore, type NotificationItem } from "@/lib/store";
import { apiGet, apiPut } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Megaphone,
  CheckCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface NotificationsPageProps {
  onNavigate: (page: string) => void;
}

const notificationIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  announcement: Megaphone,
};

const notificationColors: Record<string, string> = {
  info: "text-blue-400 bg-blue-400/10",
  success: "text-green-400 bg-green-400/10",
  warning: "text-yellow-400 bg-yellow-400/10",
  error: "text-red-400 bg-red-400/10",
  announcement: "text-cyan-400 bg-cyan-400/10",
};

export default function NotificationsPage({ onNavigate }: NotificationsPageProps) {
  const { setNotifications, setUnreadCount, unreadCount } = useStudentStore();
  const [notifications, setLocalNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await apiGet<{ notifications: any[]; total: number; unreadCount: number }>("/notifications");
      const rawItems = data.notifications || [];
      // Map Appwrite documents to NotificationItem format
      const items: NotificationItem[] = rawItems.map((doc: any) => ({
        id: doc.$id || doc.id,
        title: doc.title || "",
        message: doc.message || "",
        type: doc.type || "info",
        read: doc.isRead === true || doc.read === true,
        createdAt: doc.$createdAt || doc.createdAt || new Date().toISOString(),
        link: doc.actionUrl || doc.link,
      }));
      setLocalNotifications(items);
      setNotifications(items);
      setUnreadCount(data.unreadCount ?? items.filter((n) => !n.read).length);
    } catch {
      // Show empty state
    } finally {
      setLoading(false);
    }
  }, [setNotifications, setUnreadCount]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await apiPut("/notifications/read", { notificationId: id });
      setLocalNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch {
      // Silently fail
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiPut("/notifications/read", { all: true });
      setLocalNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 space-y-4 max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
          {unreadCount > 0 && (
            <Badge className="gradient-primary text-white border-0 text-[10px]">
              {unreadCount}
            </Badge>
          )}
        </h1>
        {unreadCount > 0 && (
          <Button
            onClick={markAllAsRead}
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-white"
          >
            <CheckCheck className="h-3 w-3 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-2">
          <AnimatePresence>
            {notifications.map((notification, index) => {
              const IconComponent = notificationIcons[notification.type] || Info;
              const colorClass = notificationColors[notification.type] || notificationColors.info;

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={`border-0 cursor-pointer transition-all ${
                      notification.read
                        ? "glass-card opacity-60"
                        : "glass-card-hover ring-1 ring-blue-500/20"
                    }`}
                    onClick={() => {
                      if (!notification.read) markAsRead(notification.id);
                      if (notification.link) onNavigate(notification.link);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-medium text-white">{notification.title}</h3>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {formatTime(notification.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full gradient-primary flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <Card className="glass-card border-0">
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-sm font-medium text-white">No notifications</h3>
            <p className="text-xs text-muted-foreground mt-1">
              You&apos;re all caught up! New notifications will appear here.
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
