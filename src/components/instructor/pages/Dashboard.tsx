'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Users, Star, DollarSign, Clock, Calendar,
  TrendingUp, ChevronRight, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { instructorApi, type InstructorDashboard as DashboardData } from '@/lib/instructor-api-client';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function Dashboard({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentReviews, setRecentReviews] = useState<Array<{ rating: number; comment?: string; student_name?: string; created_at: string }>>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<Array<{ title: string; scheduled_at: string; duration_minutes: number; meeting_url?: string }>>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await instructorApi.getDashboard();
      setDashboard(data.dashboard);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
    // Also load reviews and schedule in parallel
    try {
      const [reviewsData, scheduleData] = await Promise.all([
        instructorApi.getReviews({ limit: 5 }),
        instructorApi.getSchedule(5),
      ]);
      setRecentReviews(reviewsData.reviews as typeof recentReviews);
      setUpcomingClasses(scheduleData.schedule as typeof upcomingClasses);
    } catch (err) {
      console.error('Failed to load side data:', err);
    }
  };

  const statCards = [
    { title: 'Total Courses', value: dashboard?.courseCount ?? 0, icon: BookOpen, color: 'bg-emerald-500/10', iconColor: 'text-emerald-600' },
    { title: 'Total Students', value: dashboard?.totalStudents ?? 0, icon: Users, color: 'bg-teal-500/10', iconColor: 'text-teal-600' },
    { title: 'Average Rating', value: dashboard?.avgRating ?? 0, icon: Star, color: 'bg-amber-500/10', iconColor: 'text-amber-600' },
    { title: 'Revenue', value: `৳${(dashboard?.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: 'bg-emerald-500/10', iconColor: 'text-emerald-600' },
  ];

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.title} variants={itemVariants}>
              <Card className="shadow-sm border border-gray-200 bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{stat.title}</p>
                      <p className="text-2xl font-bold mt-1 text-gray-900" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                        {stat.value}
                      </p>
                    </div>
                    <div className={`w-11 h-11 rounded-xl ${stat.color} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reviews */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-sm border border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                  <Star className="h-5 w-5 text-amber-500" />
                  Recent Reviews
                </CardTitle>
                <button
                  onClick={() => onNavigate?.('reviews')}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                >
                  View All <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {recentReviews.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No reviews yet</p>
              ) : (
                <div className="space-y-3">
                  {recentReviews.map((review, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {Array.from({ length: 5 }).map((_, si) => (
                          <Star key={si} className={`h-3.5 w-3.5 ${si < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{review.comment || 'No comment'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {review.student_name || 'Anonymous'} · {formatDate(review.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Classes */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-sm border border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                  <Calendar className="h-5 w-5 text-emerald-600" />
                  Upcoming Classes
                </CardTitle>
                <button
                  onClick={() => onNavigate?.('schedule')}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                >
                  View All <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingClasses.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No upcoming classes</p>
              ) : (
                <div className="space-y-3">
                  {upcomingClasses.map((cls, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{cls.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(cls.scheduled_at)} · {formatTime(cls.scheduled_at)} · {cls.duration_minutes}min
                        </p>
                      </div>
                      {cls.meeting_url && (
                        <a
                          href={cls.meeting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex-shrink-0"
                        >
                          Join
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Course Performance */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm border border-gray-200 bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Quick Stats
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-xl bg-emerald-50">
                <p className="text-2xl font-bold text-emerald-700" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                  {dashboard?.courseCount ?? 0}
                </p>
                <p className="text-xs text-gray-600 mt-1">Active Courses</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-teal-50">
                <p className="text-2xl font-bold text-teal-700" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                  {dashboard?.totalStudents ?? 0}
                </p>
                <p className="text-xs text-gray-600 mt-1">Enrolled Students</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-amber-50">
                <p className="text-2xl font-bold text-amber-700" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                  {dashboard?.avgRating ?? 0}
                </p>
                <p className="text-xs text-gray-600 mt-1">Avg Rating</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-emerald-50">
                <p className="text-2xl font-bold text-emerald-700" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                  {dashboard?.upcomingClasses ?? 0}
                </p>
                <p className="text-xs text-gray-600 mt-1">Upcoming Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
