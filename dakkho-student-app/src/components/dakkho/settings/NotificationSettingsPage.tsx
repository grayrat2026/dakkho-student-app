'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Bell, Mail, MessageSquare, Smartphone, ChevronLeft, Volume2,
  VolumeX, BookOpen, CreditCard, Megaphone, Users, Award,
  Calendar, AlertTriangle, CheckCircle, Loader2,
} from 'lucide-react';
import { useNavigationStore, useAuthStore } from '@/lib/store';
import { notificationApi, type NotificationPreferences } from '@/lib/api-client';
import { GlassCard } from '../shared/GlassCard';
import { GradientButton } from '../shared/GradientButton';

function Toggle({ enabled, onToggle, color = 'sky' }: { enabled: boolean; onToggle: () => void; color?: string }) {
  const bgColor = color === 'emerald' ? 'bg-emerald-500' : 'bg-sky-500';
  return (
    <motion.button
      className={`w-11 h-6 rounded-full p-0.5 transition-colors ${enabled ? bgColor : 'bg-muted'}`}
      onClick={onToggle}
      whileTap={{ scale: 0.9 }}
    >
      <motion.div
        className="w-5 h-5 rounded-full bg-white shadow-sm"
        animate={{ x: enabled ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );
}

interface NotifSetting {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  push: boolean;
  email: boolean;
  sms: boolean;
}

// Map preference keys from the API response to setting IDs
const categoryMapping: Record<string, string> = {
  course: 'courseUpdates',
  grades: 'grades',
  schedule: 'schedule',
  payment: 'payment',
  promo: 'promotions',
  social: 'social',
  alerts: 'system',
};

const defaultSettings: NotifSetting[] = [
  { id: 'course', label: 'Course Updates', description: 'New videos, assignments, and materials', icon: BookOpen, push: true, email: true, sms: false },
  { id: 'grades', label: 'Grades & Results', description: 'Exam results and grade postings', icon: Award, push: true, email: true, sms: true },
  { id: 'schedule', label: 'Schedule Changes', description: 'Class cancellations and room changes', icon: Calendar, push: true, email: false, sms: true },
  { id: 'payment', label: 'Payment & Billing', description: 'Subscription and payment receipts', icon: CreditCard, push: true, email: true, sms: false },
  { id: 'promo', label: 'Promotions & Offers', description: 'Special discounts and seasonal offers', icon: Megaphone, push: false, email: true, sms: false },
  { id: 'social', label: 'Social & Community', description: 'Comments, replies, and mentions', icon: Users, push: true, email: false, sms: false },
  { id: 'alerts', label: 'System Alerts', description: 'Maintenance and security notifications', icon: AlertTriangle, push: true, email: true, sms: true },
];

export function NotificationSettingsPage() {
  const { goBack } = useNavigationStore();
  const user = useAuthStore((s) => s.user);

  const [masterPush, setMasterPush] = useState(true);
  const [masterEmail, setMasterEmail] = useState(true);
  const [masterSMS, setMasterSMS] = useState(false);
  const [quietHours, setQuietHours] = useState(false);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('08:00');
  const [settings, setSettings] = useState<NotifSetting[]>(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notification settings from D1 via Worker API
  const fetchSettings = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const data = await notificationApi.getSettings();
      const prefs = data.preferences;

      // Apply fetched preferences to state
      setMasterPush(prefs.pushEnabled);
      setMasterEmail(prefs.emailEnabled);
      setMasterSMS(prefs.smsEnabled);
      setQuietHours(prefs.quietHoursEnabled);
      setQuietStart(prefs.quietHoursStart || '22:00');
      setQuietEnd(prefs.quietHoursEnd || '08:00');

      // Map per-category preferences
      setSettings((prev) =>
        prev.map((s) => {
          const key = categoryMapping[s.id];
          const catPrefs = prefs[key as keyof NotificationPreferences] as { push: boolean; email: boolean } | undefined;
          if (catPrefs) {
            return {
              ...s,
              push: catPrefs.push,
              email: catPrefs.email,
            };
          }
          return s;
        })
      );
    } catch (err: any) {
      console.error('Failed to fetch notification settings:', err);
      // Don't show error for auth issues — just use defaults silently
      if (err?.status === 401 || err?.status === 403) {
        // Auth issue — user might not be verified yet, use defaults silently
      } else {
        setError('Failed to load settings. Using defaults.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const toggleChannel = (id: string, channel: 'push' | 'email' | 'sms') => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [channel]: !s[channel] } : s))
    );
  };

  const handleSave = async () => {
    if (!user?.id) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      // Build preferences object from current state
      const prefs: NotificationPreferences = {
        pushEnabled: masterPush,
        emailEnabled: masterEmail,
        smsEnabled: masterSMS,
        quietHoursEnabled: quietHours,
        quietHoursStart: quietStart,
        quietHoursEnd: quietEnd,
        courseUpdates: {
          push: settings.find((s) => s.id === 'course')?.push ?? true,
          email: settings.find((s) => s.id === 'course')?.email ?? true,
        },
        grades: {
          push: settings.find((s) => s.id === 'grades')?.push ?? true,
          email: settings.find((s) => s.id === 'grades')?.email ?? true,
        },
        schedule: {
          push: settings.find((s) => s.id === 'schedule')?.push ?? true,
          email: settings.find((s) => s.id === 'schedule')?.email ?? false,
        },
        payment: {
          push: settings.find((s) => s.id === 'payment')?.push ?? true,
          email: settings.find((s) => s.id === 'payment')?.email ?? true,
        },
        promotions: {
          push: settings.find((s) => s.id === 'promo')?.push ?? false,
          email: settings.find((s) => s.id === 'promo')?.email ?? false,
        },
        social: {
          push: settings.find((s) => s.id === 'social')?.push ?? true,
          email: settings.find((s) => s.id === 'social')?.email ?? false,
        },
        system: {
          push: settings.find((s) => s.id === 'alerts')?.push ?? true,
          email: settings.find((s) => s.id === 'alerts')?.email ?? true,
        },
      };

      await notificationApi.updateSettings(prefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save notification settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
        <span className="ml-3 text-sm text-muted-foreground">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0">
      {/* Header */}
      <motion.div className="flex items-center gap-3 mb-6" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <motion.button
          className="w-9 h-9 rounded-xl bg-muted/30 flex items-center justify-center text-foreground"
          onClick={goBack}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
        <div>
          <h1 className="text-xl font-extrabold text-foreground">Notification Preferences</h1>
          <p className="text-xs text-muted-foreground">Choose how and when you get notified</p>
        </div>
      </motion.div>

      {saved && (
        <motion.div
          className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        >
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Preferences saved!</p>
        </motion.div>
      )}

      {error && (
        <motion.div
          className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        >
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Master Toggles */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <GlassCard className="p-5 mb-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-sky-500" /> Notification Channels
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-sky-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Push Notifications</p>
                  <p className="text-xs text-muted-foreground">Real-time alerts on your device</p>
                </div>
              </div>
              <Toggle enabled={masterPush} onToggle={() => setMasterPush(!masterPush)} />
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive updates via email</p>
                </div>
              </div>
              <Toggle enabled={masterEmail} onToggle={() => setMasterEmail(!masterEmail)} color="emerald" />
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">SMS Notifications</p>
                  <p className="text-xs text-muted-foreground">Text message alerts for critical updates</p>
                </div>
              </div>
              <Toggle enabled={masterSMS} onToggle={() => setMasterSMS(!masterSMS)} />
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Quiet Hours */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <GlassCard className="p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              {quietHours ? <VolumeX className="w-4 h-4 text-sky-500" /> : <Volume2 className="w-4 h-4 text-sky-500" />}
              Quiet Hours
            </h3>
            <Toggle enabled={quietHours} onToggle={() => setQuietHours(!quietHours)} />
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            During quiet hours, notifications are added to your notification tray silently without push alerts or sound.
          </p>
          {quietHours && (
            <motion.div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <div className="flex-1">
                <label className="text-xs font-semibold text-muted-foreground block mb-1">From</label>
                <input
                  type="time"
                  value={quietStart}
                  onChange={(e) => setQuietStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-white/30 dark:border-white/10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
              </div>
              <span className="text-muted-foreground mt-5">—</span>
              <div className="flex-1">
                <label className="text-xs font-semibold text-muted-foreground block mb-1">To</label>
                <input
                  type="time"
                  value={quietEnd}
                  onChange={(e) => setQuietEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-white/30 dark:border-white/10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
              </div>
            </motion.div>
          )}
        </GlassCard>
      </motion.div>

      {/* Per-Category Settings */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <GlassCard className="p-5">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-sky-500" /> Notification Types
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Turn off a category to stop receiving those notifications completely. Turn on to receive them (push if enabled, or silently during quiet hours).
          </p>
          <div className="space-y-1">
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_50px_50px_50px] gap-2 items-center pb-2 border-b border-white/20 dark:border-white/5">
              <span className="text-xs font-bold text-muted-foreground">Type</span>
              <span className="text-xs font-bold text-muted-foreground text-center">Push</span>
              <span className="text-xs font-bold text-muted-foreground text-center">Email</span>
              <span className="text-xs font-bold text-muted-foreground text-center">SMS</span>
            </div>
            {settings.map((s, i) => (
              <motion.div
                key={s.id}
                className="grid grid-cols-[1fr_50px_50px_50px] gap-2 items-center py-3 border-b border-white/10 dark:border-white/5 last:border-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.03 }}
              >
                <div className="flex items-center gap-2">
                  <s.icon className="w-4 h-4 text-sky-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{s.label}</p>
                    <p className="text-xs text-muted-foreground hidden sm:block">{s.description}</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={s.push && masterPush}
                    onChange={() => toggleChannel(s.id, 'push')}
                    disabled={!masterPush}
                    className="w-4 h-4 rounded accent-sky-500"
                  />
                </div>
                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={s.email && masterEmail}
                    onChange={() => toggleChannel(s.id, 'email')}
                    disabled={!masterEmail}
                    className="w-4 h-4 rounded accent-emerald-500"
                  />
                </div>
                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={s.sms && masterSMS}
                    onChange={() => toggleChannel(s.id, 'sms')}
                    disabled={!masterSMS}
                    className="w-4 h-4 rounded accent-amber-500"
                  />
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-white/20 dark:border-white/5">
            <GradientButton onClick={handleSave} size="sm" disabled={isSaving}>
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> Save Preferences</>
              )}
            </GradientButton>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
