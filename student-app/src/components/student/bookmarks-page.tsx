"use client";

import { useEffect, useState, useCallback } from "react";
import { apiGet, apiPost } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bookmark,
  Play,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface BookmarksPageProps {
  onNavigate: (page: string, data?: Record<string, string>) => void;
}

interface BookmarkedCourse {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  instructor?: string;
  category?: string;
  rating?: number;
  studentsCount?: number;
  price?: number;
  bookmarkedAt: string;
}

export default function BookmarksPage({ onNavigate }: BookmarksPageProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkedCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBookmarks = useCallback(async () => {
    try {
      const data = await apiGet<BookmarkedCourse[]>("/bookmarks");
      setBookmarks(Array.isArray(data) ? data : []);
    } catch {
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const removeBookmark = async (courseId: string) => {
    try {
      await apiPost(`/courses/${courseId}/unbookmark`);
      setBookmarks((prev) => prev.filter((b) => b.id !== courseId));
      toast.success("Bookmark removed");
    } catch {
      toast.error("Failed to remove bookmark");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 space-y-4 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-white flex items-center gap-2">
          <Bookmark className="h-5 w-4" />
          Bookmarks
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Courses you&apos;ve saved for later
        </p>
      </div>

      {/* Bookmarked Courses */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : bookmarks.length > 0 ? (
        <div className="space-y-3">
          <AnimatePresence>
            {bookmarks.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="glass-card-hover overflow-hidden border-0">
                  <CardContent className="p-0">
                    <div className="flex">
                      <button
                        onClick={() => onNavigate("courses/detail", { courseId: course.id })}
                        className="w-28 h-28 gradient-primary flex items-center justify-center flex-shrink-0"
                      >
                        <Play className="h-8 w-8 text-white/60" />
                      </button>
                      <div className="flex-1 p-3 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            onClick={() => onNavigate("courses/detail", { courseId: course.id })}
                            className="text-left flex-1 min-w-0"
                          >
                            <h3 className="text-sm font-medium text-white line-clamp-2">
                              {course.title}
                            </h3>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeBookmark(course.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-400" />
                          </button>
                        </div>
                        {course.instructor && (
                          <p className="text-xs text-muted-foreground mt-0.5">{course.instructor}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {course.rating !== undefined && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                              <span className="text-xs text-muted-foreground">{course.rating}</span>
                            </div>
                          )}
                          {course.studentsCount !== undefined && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{course.studentsCount}</span>
                            </div>
                          )}
                          {course.category && (
                            <Badge className="text-[8px] bg-white/10 text-white border-0">
                              {course.category}
                            </Badge>
                          )}
                        </div>
                        {course.price !== undefined && (
                          <div className="mt-1.5">
                            {course.price === 0 ? (
                              <span className="text-xs font-medium text-green-400">Free</span>
                            ) : (
                              <span className="text-xs font-semibold gradient-text">৳{course.price}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Card className="glass-card border-0">
          <CardContent className="p-12 text-center">
            <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-sm font-medium text-white">No bookmarks yet</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Save courses to your bookmarks to find them easily later
            </p>
            <button
              onClick={() => onNavigate("courses")}
              className="mt-4 px-4 py-2 rounded-lg gradient-primary text-white text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Browse Courses
            </button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
