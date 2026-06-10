'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Users, BookOpen, Star, TrendingUp,
  Loader2, ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { instructorApi, type InstructorCourse, type CourseAnalytics } from '@/lib/instructor-api-client';

export default function Analytics() {
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await instructorApi.getCourses();
      setCourses(data.courses);
      if (data.courses.length > 0) {
        setSelectedCourseId(data.courses[0].$id);
        loadAnalytics(data.courses[0].$id);
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async (courseId: string) => {
    setAnalyticsLoading(true);
    try {
      const data = await instructorApi.getCourseAnalytics(courseId);
      setAnalytics(data.analytics);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    loadAnalytics(courseId);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
            Analytics
          </h2>
          <p className="text-sm text-gray-500 mt-1">Course performance and insights</p>
        </div>
        {courses.length > 0 && (
          <div className="relative">
            <select
              value={selectedCourseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {courses.map((c) => (
                <option key={c.$id} value={c.$id}>{c.title || 'Untitled'}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        )}
      </div>

      {analyticsLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : analytics ? (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="shadow-sm border border-gray-200 bg-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Enrollments</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                      {analytics.enrollmentCount}
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-gray-200 bg-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                      ৳{analytics.revenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-teal-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-teal-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-gray-200 bg-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Avg Rating</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                      {analytics.avgRating}
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Star className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-gray-200 bg-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Videos</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                      {analytics.videoCount}
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts using simple HTML/CSS bars */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enrollment & Payments */}
            <Card className="shadow-sm border border-gray-200 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                  Enrollment Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Total Enrollments</span>
                      <span className="font-bold text-gray-900">{analytics.enrollmentCount}</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, analytics.enrollmentCount)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Completed Payments</span>
                      <span className="font-bold text-gray-900">{analytics.paymentCount}</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-teal-500 transition-all duration-500"
                        style={{ width: `${analytics.enrollmentCount > 0 ? (analytics.paymentCount / analytics.enrollmentCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50 text-center mt-4">
                    <p className="text-sm text-gray-600">Conversion Rate</p>
                    <p className="text-xl font-bold text-emerald-700" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                      {analytics.enrollmentCount > 0 ? Math.round((analytics.paymentCount / analytics.enrollmentCount) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rating Distribution */}
            <Card className="shadow-sm border border-gray-200 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                  Rating & Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                      {analytics.avgRating}
                    </p>
                    <div className="flex items-center gap-0.5 mt-1 justify-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < Math.round(analytics.avgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{analytics.reviewCount} reviews</p>
                  </div>
                  <div className="flex-1">
                    {/* Simulated rating bars */}
                    {[5, 4, 3, 2, 1].map((rating) => {
                      // Use a simple visual based on avg rating proximity
                      const proximity = Math.max(0, 1 - Math.abs(analytics.avgRating - rating) / 4);
                      return (
                        <div key={rating} className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500 w-3 text-right">{rating}</span>
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                          <div className="flex-1 h-2 rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                              style={{ width: `${proximity * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 rounded-lg bg-emerald-50 text-center">
                    <p className="text-lg font-bold text-emerald-700" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                      ৳{analytics.revenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600">Total Revenue</p>
                  </div>
                  <div className="p-3 rounded-lg bg-teal-50 text-center">
                    <p className="text-lg font-bold text-teal-700" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                      ৳{analytics.paymentCount > 0 ? Math.round(analytics.revenue / analytics.paymentCount) : 0}
                    </p>
                    <p className="text-xs text-gray-600">Avg Revenue/Student</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card className="shadow-sm border border-gray-200 bg-white">
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-semibold">No analytics data available</p>
            <p className="text-sm text-gray-400 mt-1">Select a course to view analytics</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
