'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Users, Video, BarChart3, ArrowLeft, Loader2,
  Star, Clock, Play,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { instructorApi, type InstructorCourse, type InstructorEnrollment, type InstructorVideo } from '@/lib/instructor-api-client';

export default function CourseDetail({
  courseId,
  onBack,
  onNavigate,
}: {
  courseId: string;
  onBack?: () => void;
  onNavigate?: (page: string, params?: Record<string, string>) => void;
}) {
  const [course, setCourse] = useState<InstructorCourse | null>(null);
  const [studentCount, setStudentCount] = useState(0);
  const [students, setStudents] = useState<InstructorEnrollment[]>([]);
  const [videos, setVideos] = useState<InstructorVideo[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('students');

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    setLoading(true);
    try {
      const data = await instructorApi.getCourse(courseId);
      setCourse(data.course);
      setStudentCount(data.studentCount);
    } catch (err) {
      console.error('Failed to load course:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const data = await instructorApi.getCourseStudents(courseId);
      setStudents(data.students);
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  const loadVideos = async () => {
    try {
      const data = await instructorApi.getCourseVideos(courseId);
      setVideos(data.videos);
    } catch (err) {
      console.error('Failed to load videos:', err);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await instructorApi.getCourseAnalytics(courseId);
      setAnalytics(data.analytics as unknown as Record<string, unknown>);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'students' && students.length === 0) loadStudents();
    if (tab === 'videos' && videos.length === 0) loadVideos();
    if (tab === 'analytics' && !analytics) loadAnalytics();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-16">
        <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-semibold">Course not found</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack || (() => onNavigate?.('courses'))}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 font-semibold transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Courses
      </button>

      {/* Course Header */}
      <Card className="shadow-sm border border-gray-200 bg-white overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-64 h-48 md:h-auto flex-shrink-0 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
            {course.thumbnailUrl ? (
              <img src={course.thumbnailUrl} alt={course.title || 'Course'} className="w-full h-full object-cover" />
            ) : (
              <BookOpen className="h-12 w-12 text-emerald-300" />
            )}
          </div>
          <div className="flex-1 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                  {course.title || 'Untitled Course'}
                </h2>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.description || 'No description'}</p>
              </div>
              {(course.isPublished || course.status === 'published') ? (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Published</Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">Draft</Badge>
              )}
            </div>
            <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-emerald-600" /> {studentCount} Students
              </span>
              <span className="flex items-center gap-1.5">
                <Video className="h-4 w-4 text-emerald-600" /> {course.level || 'All Levels'}
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-amber-400" /> {course.rating ?? 0}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="students" className="data-[state=active]:bg-white data-[state=active]:text-emerald-700">
            <Users className="h-4 w-4 mr-1.5" /> Students
          </TabsTrigger>
          <TabsTrigger value="videos" className="data-[state=active]:bg-white data-[state=active]:text-emerald-700">
            <Video className="h-4 w-4 mr-1.5" /> Videos
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-emerald-700">
            <BarChart3 className="h-4 w-4 mr-1.5" /> Analytics
          </TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card className="shadow-sm border border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                Enrolled Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No students enrolled yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Progress</th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((enrollment) => (
                        <tr key={enrollment.$id || enrollment.userId} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="p-3 font-medium text-gray-900">
                            {enrollment.student?.name || 'Unknown'}
                          </td>
                          <td className="p-3 text-gray-500">
                            {enrollment.student?.email || '-'}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 rounded-full bg-gray-200">
                                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${enrollment.progress ?? 0}%` }} />
                              </div>
                              <span className="text-xs text-gray-500">{enrollment.progress ?? 0}%</span>
                            </div>
                          </td>
                          <td className="p-3">
                            {enrollment.completed
                              ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">Completed</Badge>
                              : <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">In Progress</Badge>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos">
          <Card className="shadow-sm border border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                  Course Videos
                </CardTitle>
                <button
                  onClick={() => onNavigate?.('video-manager', { courseId })}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  Manage Videos →
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {videos.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No videos uploaded yet</p>
              ) : (
                <div className="space-y-2">
                  {videos.map((video) => (
                    <div key={video.$id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <Play className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{video.title || 'Untitled Video'}</p>
                        <p className="text-xs text-gray-500">Order: {video.order ?? '-'} · {video.duration ? `${Math.round(video.duration / 60)}min` : 'Duration N/A'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {video.isFree && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">Free</Badge>}
                        {video.isPublished
                          ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">Published</Badge>
                          : <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 text-xs">Draft</Badge>
                        }
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card className="shadow-sm border border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                Course Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-50 text-center">
                    <p className="text-2xl font-bold text-emerald-700" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                      {String(analytics.enrollmentCount ?? 0)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Enrollments</p>
                  </div>
                  <div className="p-4 rounded-xl bg-teal-50 text-center">
                    <p className="text-2xl font-bold text-teal-700" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                      {String(analytics.videoCount ?? 0)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Videos</p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50 text-center">
                    <p className="text-2xl font-bold text-amber-700" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                      {String(analytics.avgRating ?? 0)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Avg Rating</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50 text-center">
                    <p className="text-2xl font-bold text-emerald-700" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                      ৳{Number(analytics.revenue ?? 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Revenue</p>
                  </div>
                  <div className="p-4 rounded-xl bg-teal-50 text-center">
                    <p className="text-2xl font-bold text-teal-700" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                      {String(analytics.paymentCount ?? 0)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Payments</p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50 text-center">
                    <p className="text-2xl font-bold text-amber-700" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                      {String(analytics.reviewCount ?? 0)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Reviews</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">No analytics data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
