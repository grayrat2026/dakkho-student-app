'use client';

import { motion } from 'framer-motion';
import { Clock, Trash2, Play, ChevronRight, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { GlassCard } from '../shared/GlassCard';
import { GradientButton } from '../shared/GradientButton';
import { ProgressBar } from '../shared/ProgressBar';
import { formatDuration, formatTimeAgo } from '@/lib/utils';
import { useNavigationStore, useAuthStore, useWatchProgressStore } from '@/lib/store';
import { watchHistoryApi, type WatchHistoryItem } from '@/lib/api-client';

export function WatchHistoryPage() {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [total, setTotal] = useState(0);
  const navigate = useNavigationStore((s) => s.navigate);
  const { user } = useAuthStore();
  const progressStore = useWatchProgressStore();

  // Fetch watch history from D1 via Worker API
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await watchHistoryApi.list({ limit: 100 });
      setHistory(res.history);
      setTotal(res.total);
    } catch (err: any) {
      // If user is not logged in (401) or email not verified (403), fall back to local data
      if (err?.status === 401 || err?.status === 403) {
        // Use local watch progress as fallback
        const localProgress = Object.values(progressStore.progress)
          .filter((p) => p.progress > 0)
          .sort((a, b) => b.lastWatched - a.lastWatched)
          .map((p) => ({
            id: p.videoId,
            videoId: p.videoId,
            videoTitle: '',
            courseId: p.courseId,
            courseName: '',
            watchedAt: new Date(p.lastWatched).toISOString(),
            progress: p.progress,
            lastPosition: p.lastPosition,
            duration: 0,
            videoThumbnail: '',
            courseThumbnail: '',
          }));
        setHistory(localProgress);
        setTotal(localProgress.length);
      } else {
        setError(err?.message || 'Failed to load watch history');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchHistory();
    } else {
      // Not logged in — use local watch progress as fallback
      const localProgress = Object.values(progressStore.progress)
        .filter((p) => p.progress > 0)
        .sort((a, b) => b.lastWatched - a.lastWatched)
        .map((p) => ({
          id: p.videoId,
          videoId: p.videoId,
          videoTitle: '',
          courseId: p.courseId,
          courseName: '',
          watchedAt: new Date(p.lastWatched).toISOString(),
          progress: p.progress,
          lastPosition: p.lastPosition,
          duration: 0,
          videoThumbnail: '',
          courseThumbnail: '',
        }));
      setHistory(localProgress);
      setTotal(localProgress.length);
      setLoading(false);
    }
  }, [user, fetchHistory]);

  const handleClearHistory = async () => {
    setClearing(true);
    try {
      if (user) {
        await watchHistoryApi.clear();
      }
      // Also clear local progress store
      const current = progressStore.progress;
      const cleared: Record<string, any> = {};
      for (const [key, val] of Object.entries(current)) {
        if (!val.completed) {
          // Keep incomplete progress but remove from "history" view
          // Actually, clear all watch progress
        }
      }
      // Clear localStorage watch progress
      if (typeof window !== 'undefined') {
        localStorage.removeItem('dakkho-watch-progress');
      }
      setHistory([]);
      setTotal(0);
      setShowConfirm(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to clear history');
    } finally {
      setClearing(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
          <span className="ml-3 text-muted-foreground">Loading watch history...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !user) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="text-center py-16">
          <Clock className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">Login Required</h3>
          <p className="text-sm text-muted-foreground/60 mt-1">Please login to view your watch history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">Watch History</h1>
            <p className="text-sm text-muted-foreground">{total} videos watched</p>
          </div>
        </div>
        {history.length > 0 && (
          <motion.button
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            onClick={() => setShowConfirm(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Trash2 className="w-4 h-4" />
            Clear History
          </motion.button>
        )}
      </motion.div>

      {/* Error banner */}
      {error && (
        <GlassCard className="p-4 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-500">{error}</p>
        </GlassCard>
      )}

      {/* Clear confirmation */}
      {showConfirm && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowConfirm(false)}
        >
          <GlassCard className="p-6 max-w-sm w-full" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">Clear Watch History?</h3>
            <p className="text-sm text-muted-foreground mb-4">This action cannot be undone. All your watch history will be permanently deleted.</p>
            <div className="flex gap-3">
              <GradientButton variant="danger" size="sm" onClick={handleClearHistory} disabled={clearing}>
                {clearing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Clear All
              </GradientButton>
              <GradientButton variant="primary" size="sm" onClick={() => setShowConfirm(false)} disabled={clearing}>Cancel</GradientButton>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* History List */}
      {history.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <Clock className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">No Watch History</h3>
          <p className="text-sm text-muted-foreground/60 mt-1">Start watching videos to see your history here.</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {history.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard hover className="p-4">
                <div className="flex items-start gap-4">
                  {/* Play icon / thumbnail */}
                  <motion.div
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500/10 to-blue-600/10 flex items-center justify-center flex-shrink-0 overflow-hidden"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('video-player', { videoId: item.videoId, courseId: item.courseId })}
                  >
                    {item.videoThumbnail ? (
                      <img
                        src={item.videoThumbnail}
                        alt={item.videoTitle}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <Play className="w-5 h-5 text-sky-500" />
                    )}
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-foreground truncate">
                          {item.videoTitle || `Video ${item.videoId}`}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {item.courseName || `Course ${item.courseId}`}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {item.duration > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(item.duration)}
                        </span>
                      )}
                      <span>{formatTimeAgo(item.watchedAt)}</span>
                      {item.progress >= 100 && (
                        <span className="text-emerald-500 font-semibold">Completed</span>
                      )}
                    </div>

                    <div className="mt-2">
                      <ProgressBar value={item.progress} size="sm" showLabel />
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
