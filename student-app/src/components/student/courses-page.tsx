"use client";

import { useEffect, useState, useCallback } from "react";
import { apiGet } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  BookOpen,
  Star,
  Users,
  Play,
} from "lucide-react";
import { motion } from "framer-motion";

interface CoursesPageProps {
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
  lessonsCount?: number;
  duration?: string;
}

const categories = ["All"];

export default function CoursesPage({ onNavigate }: CoursesPageProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = selectedCategory !== "All" ? `?category=${selectedCategory}` : "";
      const data = await apiGet<Course[]>(`/courses${params}`);
      setCourses(Array.isArray(data) ? data : []);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(search.toLowerCase()) ||
    course.description?.toLowerCase().includes(search.toLowerCase()) ||
    course.instructor?.toLowerCase().includes(search.toLowerCase())
  );

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
          <BookOpen className="h-5 w-5" />
          Course Catalog
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Browse and discover courses
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "gradient-primary text-white shadow-lg"
                : "glass-card text-muted-foreground hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredCourses.map((course, index) => (
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
                <Card className="glass-card-hover overflow-hidden border-0 h-full">
                  <div className="h-36 relative gradient-primary flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-white/40" />
                    {course.category && (
                      <Badge className="absolute top-2 left-2 bg-black/40 text-white text-[10px] border-0 backdrop-blur-sm">
                        {course.category}
                      </Badge>
                    )}
                    {course.price === 0 && (
                      <Badge className="absolute top-2 right-2 bg-green-500/80 text-white text-[10px] border-0">
                        Free
                      </Badge>
                    )}
                    <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm">
                      <Play className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="text-sm font-medium text-white line-clamp-2">{course.title}</h3>
                    {course.instructor && (
                      <p className="text-xs text-muted-foreground mt-1">{course.instructor}</p>
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
                      {course.lessonsCount !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          {course.lessonsCount} lessons
                        </span>
                      )}
                    </div>
                    {course.price !== undefined && course.price > 0 && (
                      <div className="mt-2">
                        <span className="text-sm font-semibold gradient-text">৳{course.price}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="glass-card border-0">
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-sm font-medium text-white">No courses found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {search ? "Try a different search term" : "No courses available in this category"}
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
