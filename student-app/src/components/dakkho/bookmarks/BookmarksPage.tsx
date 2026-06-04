'use client';

import { motion } from 'framer-motion';
import { Bookmark, Trash2, Loader2 } from 'lucide-react';
import { useBookmarkStore, useNavigationStore } from '@/lib/store';
import { useCourses } from '@/lib/data-hooks';
import { CourseCardGrid } from '../shared/CourseCardGrid';
import { EmptyState } from '../shared/EmptyState';
import { toast } from 'sonner';

export function BookmarksPage() {
  const { bookmarks, toggleBookmark } = useBookmarkStore();
  const navigate = useNavigationStore((s) => s.navigate);
  const { data: courses, loading, error } = useCourses();

  const bookmarkedCourses = courses.filter((c) => bookmarks.includes(c.id));

  const handleRemove = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    toggleBookmark(courseId);
    toast.success(`Removed "${course?.title || 'Course'}" from bookmarks`, {
      action: {
        label: 'Undo',
        onClick: () => toggleBookmark(courseId),
      },
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
        <p className="text-sm text-muted-foreground font-semibold">Loading bookmarks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-bold text-red-500">Failed to load bookmarks</p>
        <p className="text-sm text-muted-foreground mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-extrabold text-foreground mb-2">Bookmarks</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {bookmarkedCourses.length} saved course{bookmarkedCourses.length !== 1 ? 's' : ''}
        </p>
      </motion.div>

      {bookmarkedCourses.length > 0 ? (
        <CourseCardGrid courses={bookmarkedCourses} />
      ) : (
        <EmptyState
          icon={Bookmark}
          title="No bookmarks yet"
          description="Save courses to watch later by clicking the bookmark icon"
          actionLabel="Explore Courses"
          onAction={() => navigate('explore')}
        />
      )}
    </div>
  );
}
