'use client';

import { motion } from 'framer-motion';
import { Clock, Trash2, Play, ChevronRight, Loader2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { GlassCard } from '../shared/GlassCard';
import { GradientButton } from '../shared/GradientButton';
import { ProgressBar } from '../shared/ProgressBar';
import { formatTimeAgo } from '@/lib/mock-data';
import { useCourses } from '@/lib/data-hooks';
import { useNavigationStore, useWatchProgressStore } from '@/lib/store';

export function WatchHistoryPage() {
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigationStore((s) => s.navigate);
  const progress = useWatchProgressStore((s) => s.progress);
  const { data: courses, loading, error } = useCourses();

  // Build history items from watch progress store
  const historyItems = useMemo(() => {
    const entries = Object.values(progress)
      .sort((a, b) => (b.lastWatched || 0) - (a.lastWatched || 0));

    return entries.map((entry) => {
      const course = courses.find((c) => c.id === entry.courseId);
      return {
        id: entry.videoId,
        videoId: entry.videoId,
        courseId: entry.courseId,
        courseName: course?.title || 'Unknown Course',
        watchedAt: entry.lastWatched ? new Date(entry.lastWatched).toISOString() : '',
        progress: entry.progress || 0,
        completed: entry.completed || false,
      };
    });
  }, [progress, courses]);

  const [history, setHistory] = useState<typeof historyItems>([]);

  // Sync history from progress store once courses are loaded
  useEffect(() => {
    if (!loading && courses.length >= 0) {
      setHistory(historyItems);
    }
  }, [loading, historyItems]);

  const handleClearHistory = () => {
    setHistory([]);
    setShowConfirm(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
        <p className="text-sm text-muted-foreground font-semibold">Loading watch history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto text-center py-16">
        <p className="text-lg font-bold text-red-500">Failed to load history</p>
        <p className="text-sm text-muted-foreground mt-2">{error}</p>
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
            <p className="text-sm text-muted-foreground">{history.length} videos watched</p>
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
              <GradientButton variant="danger" size="sm" onClick={handleClearHistory}>Clear All</GradientButton>
              <GradientButton variant="primary" size="sm" onClick={() => setShowConfirm(false)}>Cancel</GradientButton>
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
                  {/* Play icon */}
                  <motion.div
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500/10 to-blue-600/10 flex items-center justify-center flex-shrink-0"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('video-player', { videoId: item.videoId, courseId: item.courseId })}
                  >
                    <Play className="w-5 h-5 text-sky-500" />
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-foreground truncate">{item.videoId}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.courseName}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {item.watchedAt && (
                        <span>{formatTimeAgo(item.watchedAt)}</span>
                      )}
                      {item.completed && (
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
