"use client";

import { useEffect, useState, useCallback } from "react";
import { useStudentStore } from "@/lib/store";
import { apiGet } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Play,
  Trophy,
  TrendingUp,
  Clock,
  Star,
  ArrowRight,
  Megaphone,
  GraduationCap,
} from "lucide-react";
import { motion } from "framer-motion";

interface HomePageProps {
  onNavigate: (page: string, data?: Record<string, string>) => void;
}

interface Course {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  instructor?: string;
  price?: number;
  category?: string;
  rating?: number;
  studentsCount?: number;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function HomePage({ onNavigate }: HomePageProps) {
  const { studentUser } = useStudentStore();
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [continueWatching, setContinueWatching] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHomeData = useCallback(async () => {
    try {
      const [courses, enrolled, announce] = await Promise.allSettled([
        apiGet<Course[]>("/courses?limit=6"),
        apiGet<Course[]>("/courses/enrolled?limit=4"),
        apiGet<Announcement[]>("/announcements?limit=3"),
      ]);

      if (courses.status === "fulfilled") setFeaturedCourses(courses.value || []);
      if (enrolled.status === "fulfilled") setContinueWatching(enrolled.value || []);
      if (announce.status === "fulfilled") setAnnouncements(announce.value || []);
    } catch {
      // Silently fail - show skeleton states
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getFirstName = () => {
    if (!studentUser?.name) return "Student";
    return studentUser.name.split(" ")[0];
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 space-y-6 max-w-4xl mx-auto"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants}>
        <Card className="glass-card overflow-hidden border-0">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">{getGreeting()},</p>
                <h1 className="text-2xl font-bold text-white">{getFirstName()} 👋</h1>
                <p className="text-sm text-muted-foreground">
                  Continue your learning journey today
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center animate-float">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="glass-card rounded-xl p-3 text-center">
                <BookOpen className="h-4 w-4 text-blue-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">{continueWatching.length}</div>
                <div className="text-[10px] text-muted-foreground">Enrolled</div>
              </div>
              <div className="glass-card rounded-xl p-3 text-center">
                <Trophy className="h-4 w-4 text-yellow-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">0</div>
                <div className="text-[10px] text-muted-foreground">Completed</div>
              </div>
              <div className="glass-card rounded-xl p-3 text-center">
                <TrendingUp className="h-4 w-4 text-green-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">0h</div>
                <div className="text-[10px] text-muted-foreground">Learned</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Continue Watching */}
      {continueWatching.length > 0 && (
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" />
              Continue Watching
            </h2>
            <button
              onClick={() => onNavigate("my-courses")}
              className="text-xs text-muted-foreground hover:text-white flex items-center gap-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {continueWatching.map((course) => (
              <button
                key={course.id}
                onClick={() => onNavigate("courses/detail", { courseId: course.id })}
                className="flex-shrink-0 w-56"
              >
                <Card className="glass-card-hover overflow-hidden border-0">
                  <div className="h-28 gradient-primary flex items-center justify-center">
                    <Play className="h-8 w-8 text-white/80" />
                  </div>
                  <CardContent className="p-3">
                    <h3 className="text-sm font-medium text-white truncate">{course.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{course.instructor}</p>
                    {/* Progress bar */}
                    <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full gradient-primary rounded-full" style={{ width: "35%" }} />
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Continue Watching Skeleton */}
      {loading && (
        <div>
          <Skeleton className="h-5 w-40 mb-3" />
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-56">
                <Skeleton className="h-48 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Courses */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-400" />
            Featured Courses
          </h2>
          <button
            onClick={() => onNavigate("courses")}
            className="text-xs text-muted-foreground hover:text-white flex items-center gap-1"
          >
            Browse All <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : featuredCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {featuredCourses.map((course) => (
              <button
                key={course.id}
                onClick={() => onNavigate("courses/detail", { courseId: course.id })}
                className="text-left"
              >
                <Card className="glass-card-hover overflow-hidden border-0 h-full">
                  <div className="h-32 relative gradient-primary flex items-center justify-center">
                    <BookOpen className="h-10 w-10 text-white/60" />
                    {course.category && (
                      <Badge className="absolute top-2 left-2 bg-black/40 text-white text-[10px] border-0 backdrop-blur-sm">
                        {course.category}
                      </Badge>
                    )}
                    {course.price === 0 && (
                      <Badge className="absolute top-2 right-2 bg-green-500/80 text-white text-[10px] border-0 backdrop-blur-sm">
                        Free
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="text-sm font-medium text-white line-clamp-2">{course.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      {course.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs text-muted-foreground">{course.rating}</span>
                        </div>
                      )}
                      {course.studentsCount !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          {course.studentsCount} students
                        </span>
                      )}
                    </div>
                    {course.instructor && (
                      <p className="text-xs text-muted-foreground mt-1">{course.instructor}</p>
                    )}
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        ) : (
          <Card className="glass-card border-0">
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-sm font-medium text-white">No courses available yet</h3>
              <p className="text-xs text-muted-foreground mt-1">Check back soon for new courses!</p>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Announcements */}
      {(announcements.length > 0 || loading) && (
        <motion.div variants={itemVariants}>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-3">
            <Megaphone className="h-4 w-4 text-cyan-400" />
            Announcements
          </h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {announcements.map((announcement) => (
                <Card key={announcement.id} className="glass-card border-0">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <Megaphone className="h-4 w-4 text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white">{announcement.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {announcement.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-2">
                          {new Date(announcement.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
