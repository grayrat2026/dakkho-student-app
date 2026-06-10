"use client";

import { useEffect, useState, useCallback } from "react";
import { apiGet } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GraduationCap,
  BookOpen,
  Play,
  Clock,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";

interface MyCoursesPageProps {
  onNavigate: (page: string, data?: Record<string, string>) => void;
}

interface EnrolledCourse {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  instructor?: string;
  category?: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  lastAccessedAt?: string;
}

export default function MyCoursesPage({ onNavigate }: MyCoursesPageProps) {
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEnrolledCourses = useCallback(async () => {
    try {
      const data = await apiGet<EnrolledCourse[]>("/courses/enrolled");
      setCourses(Array.isArray(data) ? data : []);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEnrolledCourses();
  }, [loadEnrolledCourses]);

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "from-green-500 to-emerald-400";
    if (progress >= 50) return "from-blue-500 to-cyan-400";
    if (progress >= 25) return "from-yellow-500 to-orange-400";
    return "from-red-500 to-pink-400";
  };

  const getProgressLabel = (progress: number) => {
    if (progress >= 100) return "Completed";
    if (progress >= 75) return "Almost Done";
    if (progress >= 50) return "Halfway";
    if (progress >= 25) return "In Progress";
    return "Just Started";
  };

  const formatLastAccessed = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

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
      className="p-4 space-y-4 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-white flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          My Learning
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Track your enrolled courses and progress
        </p>
      </div>

      {/* Stats Summary */}
      {courses.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="glass-card border-0">
            <CardContent className="p-3 text-center">
              <BookOpen className="h-4 w-4 text-blue-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">{courses.length}</div>
              <div className="text-[10px] text-muted-foreground">Courses</div>
            </CardContent>
          </Card>
          <Card className="glass-card border-0">
            <CardContent className="p-3 text-center">
              <CheckCircle2 className="h-4 w-4 text-green-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">
                {courses.filter((c) => c.progress >= 100).length}
              </div>
              <div className="text-[10px] text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card className="glass-card border-0">
            <CardContent className="p-3 text-center">
              <TrendingUp className="h-4 w-4 text-yellow-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">
                {courses.length > 0
                  ? Math.round(courses.reduce((a, c) => a + c.progress, 0) / courses.length)
                  : 0}%
              </div>
              <div className="text-[10px] text-muted-foreground">Avg Progress</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Course List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : courses.length > 0 ? (
        <div className="space-y-3">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <button
                onClick={() => onNavigate("courses/detail", { courseId: course.id })}
                className="text-left w-full"
              >
                <Card className="glass-card-hover overflow-hidden border-0">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className="w-28 h-28 gradient-primary flex items-center justify-center flex-shrink-0">
                        <Play className="h-8 w-8 text-white/60" />
                      </div>
                      <div className="flex-1 p-3 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-medium text-white line-clamp-2">{course.title}</h3>
                          <Badge
                            className={`text-[8px] border-0 whitespace-nowrap bg-gradient-to-r ${getProgressColor(course.progress)} text-white`}
                          >
                            {getProgressLabel(course.progress)}
                          </Badge>
                        </div>
                        {course.instructor && (
                          <p className="text-xs text-muted-foreground mt-0.5">{course.instructor}</p>
                        )}

                        {/* Progress Bar */}
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                            <span>{course.completedLessons}/{course.totalLessons} lessons</span>
                            <span>{course.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(course.progress)} transition-all duration-500`}
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>

                        {course.lastAccessedAt && (
                          <div className="flex items-center gap-1 mt-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">
                              Last accessed {formatLastAccessed(course.lastAccessedAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="glass-card border-0">
          <CardContent className="p-12 text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-sm font-medium text-white">No enrolled courses yet</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Browse the course catalog and start learning!
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
