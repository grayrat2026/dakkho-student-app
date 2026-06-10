'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, ExternalLink, Loader2, Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { instructorApi, type ScheduleEntry } from '@/lib/instructor-api-client';

export default function Schedule() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      const data = await instructorApi.getSchedule(50);
      setSchedule(data.schedule);
    } catch (err) {
      console.error('Failed to load schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  const groupByDate = (entries: ScheduleEntry[]) => {
    const groups: Record<string, ScheduleEntry[]> = {};
    for (const entry of entries) {
      const dateKey = formatDate(entry.scheduled_at);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(entry);
    }
    return groups;
  };

  const grouped = groupByDate(schedule);

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
          Schedule
        </h2>
        <p className="text-sm text-gray-500 mt-1">Upcoming live classes and sessions</p>
      </div>

      {schedule.length === 0 ? (
        <Card className="shadow-sm border border-gray-200 bg-white">
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-semibold">No upcoming classes</p>
            <p className="text-sm text-gray-400 mt-1">Your scheduled classes will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, entries]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-gray-700" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                  {date}
                </h3>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div className="space-y-3">
                {entries.map((entry, i) => (
                  <motion.div
                    key={entry.id || i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="shadow-sm border border-gray-200 bg-white hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                            <Video className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 text-sm" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                              {entry.title}
                            </h4>
                            {entry.description && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{entry.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-emerald-600" />
                                {formatTime(entry.scheduled_at)} · {entry.duration_minutes}min
                              </span>
                              {entry.platform && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                                  {entry.platform}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {entry.status && (
                              <Badge className={`text-xs ${
                                entry.status === 'live' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                                entry.status === 'scheduled' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' :
                                'bg-gray-100 text-gray-600 hover:bg-gray-100'
                              }`}>
                                {entry.status === 'live' ? '🔴 Live' : entry.status}
                              </Badge>
                            )}
                            {entry.meeting_url && (
                              <a
                                href={entry.meeting_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                              >
                                <ExternalLink className="h-3 w-3" /> Join
                              </a>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
