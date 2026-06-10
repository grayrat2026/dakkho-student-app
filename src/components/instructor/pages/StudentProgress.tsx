'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Loader2, TrendingUp, BookOpen, Clock, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { instructorApi, type StudentProgressEntry } from '@/lib/instructor-api-client';

export default function StudentProgress({
  courseId,
  courseTitle,
  onBack,
}: {
  courseId: string;
  courseTitle?: string;
  onBack?: () => void;
}) {
  const [progressData, setProgressData] = useState<{
    totalStudents: number;
    totalVideos: number;
    averageProgress: number;
    progress: StudentProgressEntry[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [courseId]);

  const loadProgress = async () => {
    try {
      const data = await instructorApi.getCourseProgress(courseId);
      setProgressData({
        totalStudents: data.totalStudents,
        totalVideos: data.totalVideos,
        averageProgress: data.averageProgress,
        progress: data.progress,
      });
    } catch (err) {
      console.error('Failed to load progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatWatchTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
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
      {/* Back & header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 font-semibold transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
            Student Progress
          </h2>
          {courseTitle && <p className="text-sm text-gray-500">{courseTitle}</p>}
        </div>
      </div>

      {/* Aggregate Stats */}
      {progressData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-sm border border-gray-200 bg-white">
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 text-emerald-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>{progressData.totalStudents}</p>
              <p className="text-xs text-gray-500">Total Students</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border border-gray-200 bg-white">
            <CardContent className="p-4 text-center">
              <BookOpen className="h-5 w-5 text-teal-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>{progressData.totalVideos}</p>
              <p className="text-xs text-gray-500">Total Videos</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border border-gray-200 bg-white">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-5 w-5 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>{progressData.averageProgress}%</p>
              <p className="text-xs text-gray-500">Avg Progress</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border border-gray-200 bg-white">
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 text-emerald-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                {formatWatchTime(progressData.progress.reduce((sum, p) => sum + p.totalWatchTime, 0))}
              </p>
              <p className="text-xs text-gray-500">Total Watch Time</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress Table */}
      <Card className="shadow-sm border border-gray-200 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
            Individual Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!progressData || progressData.progress.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No student progress data available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Student ID</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Progress</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Videos Completed</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Watch Time</th>
                  </tr>
                </thead>
                <tbody>
                  {progressData.progress.map((entry, i) => (
                    <tr key={entry.userId || i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-3">
                        <span className="font-medium text-gray-900 truncate block max-w-[150px]">
                          {entry.userId ? `${entry.userId.slice(0, 12)}...` : '-'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24">
                            <Progress value={entry.progressPercent} className="h-2" />
                          </div>
                          <span className="text-xs font-semibold text-gray-700">{entry.progressPercent}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-gray-600">
                        {entry.completedVideos} / {entry.totalVideos}
                      </td>
                      <td className="p-3 text-gray-600">
                        {formatWatchTime(entry.totalWatchTime)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
