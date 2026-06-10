'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Users, Star, Loader2, Search, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { instructorApi, type InstructorCourse } from '@/lib/instructor-api-client';

export default function Courses({ onNavigate }: { onNavigate?: (page: string, params?: Record<string, string>) => void }) {
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await instructorApi.getCourses();
      setCourses(data.courses);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((c) =>
    (c.title || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (course: InstructorCourse) => {
    const published = course.isPublished || course.status === 'published' || course.status === 'active';
    return published
      ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">Published</Badge>
      : <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 text-xs">Draft</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
            My Courses
          </h2>
          <p className="text-sm text-gray-500 mt-1">{courses.length} course{courses.length !== 1 ? 's' : ''} assigned to you</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border-gray-200"
          />
        </div>
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-semibold">No courses found</p>
          <p className="text-sm text-gray-400 mt-1">Courses assigned to you will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course, i) => (
            <motion.div
              key={course.$id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="shadow-sm border border-gray-200 bg-white hover:shadow-md transition-all cursor-pointer group"
                onClick={() => onNavigate?.('course-detail', { courseId: course.$id })}
              >
                <div className="relative h-40 rounded-t-xl overflow-hidden bg-gray-100">
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title || 'Course'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
                      <BookOpen className="h-10 w-10 text-emerald-300" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(course)}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-2" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                    {course.title || 'Untitled Course'}
                  </h3>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {course.studentCount ?? 0} students
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-amber-400" />
                      {course.rating ?? 0}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {course.level || 'All Levels'}
                    </span>
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                      <Eye className="h-3.5 w-3.5" /> View
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
