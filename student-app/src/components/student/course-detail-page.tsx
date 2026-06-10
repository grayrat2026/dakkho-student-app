"use client";

import { useEffect, useState, useCallback } from "react";
import { apiGet, apiPost } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  BookOpen,
  Play,
  Star,
  Users,
  Clock,
  FileText,
  CheckCircle2,
  Lock,
  Loader2,
  Share2,
  Bookmark,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface CourseDetailPageProps {
  onNavigate: (page: string, data?: Record<string, string>) => void;
}

interface Lesson {
  id: string;
  title: string;
  duration?: string;
  isFree?: boolean;
  isCompleted?: boolean;
  type?: string;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Instructor {
  name: string;
  avatarUrl?: string;
  bio?: string;
}

interface CourseDetail {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  instructor?: Instructor | string;
  price?: number;
  category?: string;
  rating?: number;
  studentsCount?: number;
  modules?: Module[];
  duration?: string;
  level?: string;
  isEnrolled?: boolean;
}

export default function CourseDetailPage({ onNavigate }: CourseDetailPageProps) {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  // Get courseId from URL
  const getCourseId = (): string => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("courseId") || "";
  };

  const loadCourse = useCallback(async (id: string) => {
    try {
      const data = await apiGet<CourseDetail>(`/courses/${id}`);
      setCourse(data);
    } catch {
      toast.error("Failed to load course");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = getCourseId();
    if (id) loadCourse(id);
  }, [loadCourse]);

  const handleEnroll = async () => {
    if (!course) return;
    setEnrolling(true);
    try {
      await apiPost(`/courses/${course.id}/enroll`);
      setCourse({ ...course, isEnrolled: true });
      toast.success("Enrolled successfully!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to enroll";
      toast.error(message);
    } finally {
      setEnrolling(false);
    }
  };

  const handleBookmark = async () => {
    if (!course) return;
    try {
      if (bookmarked) {
        await apiPost(`/courses/${course.id}/unbookmark`);
        setBookmarked(false);
        toast.success("Bookmark removed");
      } else {
        await apiPost(`/courses/${course.id}/bookmark`);
        setBookmarked(true);
        toast.success("Course bookmarked");
      }
    } catch {
      toast.error("Failed to update bookmark");
    }
  };

  const instructorName = typeof course?.instructor === "string"
    ? course.instructor
    : course?.instructor?.name || "Unknown Instructor";

  if (loading) {
    return (
      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-4 max-w-2xl mx-auto text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-sm font-medium text-white">Course not found</h3>
        <Button onClick={() => onNavigate("courses")} variant="ghost" className="mt-3 text-xs">
          <ArrowLeft className="h-3 w-3 mr-1" /> Back to Courses
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 space-y-4 max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate("courses")}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="text-sm font-medium text-muted-foreground">Course Details</h1>
      </div>

      {/* Course Thumbnail */}
      <Card className="glass-card border-0 overflow-hidden">
        <div className="h-48 relative gradient-primary flex items-center justify-center">
          <Play className="h-16 w-16 text-white/30" />
          {course.category && (
            <Badge className="absolute top-3 left-3 bg-black/40 text-white border-0 backdrop-blur-sm">
              {course.category}
            </Badge>
          )}
          {course.level && (
            <Badge className="absolute top-3 right-3 bg-black/40 text-white border-0 backdrop-blur-sm">
              {course.level}
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <h1 className="text-xl font-bold text-white">{course.title}</h1>
          {course.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{course.description}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 mt-4">
            {course.rating !== undefined && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-medium text-white">{course.rating}</span>
              </div>
            )}
            {course.studentsCount !== undefined && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{course.studentsCount} students</span>
              </div>
            )}
            {course.duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{course.duration}</span>
              </div>
            )}
          </div>

          {/* Price & Actions */}
          <Separator className="my-4 bg-white/5" />
          <div className="flex items-center justify-between">
            <div>
              {course.price === 0 ? (
                <span className="text-lg font-bold text-green-400">Free</span>
              ) : course.price ? (
                <span className="text-lg font-bold gradient-text">৳{course.price}</span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBookmark}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <Bookmark className={`h-5 w-5 ${bookmarked ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />
              </button>
              <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                <Share2 className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Enroll Button */}
          {course.isEnrolled ? (
            <Button className="w-full mt-3 bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/20 h-11">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Enrolled - Start Learning
            </Button>
          ) : (
            <Button
              onClick={handleEnroll}
              disabled={enrolling}
              className="w-full mt-3 gradient-primary text-white font-medium h-11 hover:opacity-90"
            >
              {enrolling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enrolling...
                </>
              ) : (
                "Enroll Now"
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Instructor */}
      <Card className="glass-card border-0">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold text-white mb-3">Instructor</h2>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-white/10 text-white text-sm">
                {instructorName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-white">{instructorName}</p>
              {typeof course.instructor === "object" && course.instructor.bio && (
                <p className="text-xs text-muted-foreground line-clamp-2">{course.instructor.bio}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Curriculum */}
      {course.modules && course.modules.length > 0 && (
        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Curriculum
            </h2>
            <div className="space-y-3">
              {course.modules.map((module, mIdx) => (
                <div key={module.id}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Module {mIdx + 1}: {module.title}
                    </h3>
                    <span className="text-[10px] text-muted-foreground">
                      {module.lessons?.length || 0} lessons
                    </span>
                  </div>
                  <div className="space-y-1">
                    {module.lessons?.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        {lesson.isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                        ) : lesson.isFree || course.isEnrolled ? (
                          <Play className="h-4 w-4 text-blue-400 flex-shrink-0" />
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                        )}
                        <span className="text-sm text-white flex-1 truncate">{lesson.title}</span>
                        {lesson.duration && (
                          <span className="text-[10px] text-muted-foreground">{lesson.duration}</span>
                        )}
                        {lesson.isFree && !course.isEnrolled && (
                          <Badge className="text-[8px] bg-blue-500/20 text-blue-400 border-0">Free</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  {mIdx < course.modules.length - 1 && <Separator className="my-3 bg-white/5" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
