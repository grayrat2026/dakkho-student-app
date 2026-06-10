'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, Trash2 } from 'lucide-react';
import { useBookmarkStore, useNavigationStore } from '@/lib/store';
import { type Course, courseApi } from '@/lib/api-client';
import { CourseCardGrid } from '../shared/CourseCardGrid';
import { EmptyState } from '../shared/EmptyState';
import { LoadingSkeleton } from '../shared/LoadingSkeleton';
import { toast } from 'sonner';

export function BookmarksPage() {
  const { bookmarks, toggleBookmark } = useBookmarkStore();
  const navigate = useNavigationStore((s) => s.navigate);

  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courseApi.list({ limit: 100 })
      .then((res) => setAllCourses(res.courses))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const bookmarkedCourses = allCourses.filter((c) => bookmarks.includes(c.id));

  const handleRemove = (courseId: string) => {
    const course = allCourses.find((c) => c.id === courseId);
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
      <div>
        <h1 className="text-2xl font-extrabold text-foreground mb-2">Bookmarks</h1>
        <LoadingSkeleton type="card" count={3} />
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
