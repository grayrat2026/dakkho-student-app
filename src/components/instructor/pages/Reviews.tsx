'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Loader2, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { instructorApi, type ReviewEntry, type ReviewStats } from '@/lib/instructor-api-client';

export default function Reviews() {
  const [reviews, setReviews] = useState<ReviewEntry[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadReviews();
  }, [page]);

  const loadReviews = async () => {
    try {
      const data = await instructorApi.getReviews({ page, limit: 10 });
      setReviews(data.reviews);
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
          Reviews
        </h2>
        <p className="text-sm text-gray-500 mt-1">Student feedback and ratings</p>
      </div>

      {/* Rating Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="shadow-sm border border-gray-200 bg-white">
            <CardContent className="p-6 flex items-center gap-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                  {stats.average_rating}
                </p>
                <div className="flex items-center gap-0.5 mt-1 justify-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.round(stats.average_rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">{stats.total_reviews} reviews</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.rating_distribution[rating] || 0;
                  const percent = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-3 text-right">{rating}</span>
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      <div className="flex-1 h-2 rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-8">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border border-gray-200 bg-white">
            <CardContent className="p-6 grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-xl bg-emerald-50">
                <p className="text-2xl font-bold text-emerald-700" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                  {(stats.rating_distribution[5] || 0) + (stats.rating_distribution[4] || 0)}
                </p>
                <p className="text-xs text-gray-600">Positive (4-5★)</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-amber-50">
                <p className="text-2xl font-bold text-amber-700" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                  {stats.rating_distribution[3] || 0}
                </p>
                <p className="text-xs text-gray-600">Neutral (3★)</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-red-50">
                <p className="text-2xl font-bold text-red-700" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                  {(stats.rating_distribution[2] || 0) + (stats.rating_distribution[1] || 0)}
                </p>
                <p className="text-xs text-gray-600">Negative (1-2★)</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-teal-50">
                <p className="text-2xl font-bold text-teal-700" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                  {stats.total_reviews > 0 ? Math.round(((stats.rating_distribution[5] || 0) + (stats.rating_distribution[4] || 0)) / stats.total_reviews * 100) : 0}%
                </p>
                <p className="text-xs text-gray-600">Satisfaction</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reviews List */}
      <Card className="shadow-sm border border-gray-200 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
            All Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold">No reviews yet</p>
              <p className="text-sm text-gray-400 mt-1">Student reviews will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review, i) => (
                <div key={review.id || i} className="p-4 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{review.student_name || 'Anonymous'}</p>
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {Array.from({ length: 5 }).map((_, si) => (
                              <Star key={si} className={`h-3.5 w-3.5 ${si < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(review.created_at)}</span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {stats && stats.total_reviews > 10 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-xs text-gray-500">Page {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={reviews.length < 10}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
