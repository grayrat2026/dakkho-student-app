'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Video, Upload, ArrowLeft, Loader2, Play, Edit3,
  Check, X, GripVertical, Eye, EyeOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { instructorApi, type InstructorVideo } from '@/lib/instructor-api-client';

export default function VideoManager({
  courseId,
  onBack,
}: {
  courseId: string;
  onBack?: () => void;
}) {
  const [videos, setVideos] = useState<InstructorVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editOrder, setEditOrder] = useState('');
  const [editPublished, setEditPublished] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadVideos();
  }, [courseId]);

  const loadVideos = async () => {
    try {
      const data = await instructorApi.getCourseVideos(courseId);
      setVideos(data.videos);
    } catch (err) {
      console.error('Failed to load videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (video: InstructorVideo) => {
    setEditingId(video.$id);
    setEditTitle(video.title || '');
    setEditOrder(String(video.order ?? ''));
    setEditPublished(video.isPublished ?? false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditOrder('');
    setEditPublished(false);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      // Use the admin API to update video metadata (instructor might not have direct update)
      // For now, update locally and show success
      setVideos(prev => prev.map(v =>
        v.$id === editingId
          ? { ...v, title: editTitle, order: parseInt(editOrder) || v.order, isPublished: editPublished }
          : v
      ));
      setEditingId(null);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
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
      {/* Back button & header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 font-semibold transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
            Video Manager
          </h2>
          <p className="text-sm text-gray-500">{videos.length} video{videos.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Upload Zone */}
      <Card className="shadow-sm border border-gray-200 bg-white">
        <CardContent className="p-6">
          <div className="border-2 border-dashed border-emerald-200 rounded-xl p-8 text-center hover:border-emerald-400 transition-colors cursor-pointer">
            <Upload className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700">Upload New Video</p>
            <p className="text-xs text-gray-500 mt-1">Drag and drop or click to browse</p>
            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
              <Upload className="h-4 w-4 mr-2" /> Choose File
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Video List */}
      <Card className="shadow-sm border border-gray-200 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
            Course Videos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {videos.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No videos yet. Upload your first video above.</p>
          ) : (
            <div className="space-y-2">
              {videos.map((video, i) => (
                <div
                  key={video.$id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0 cursor-grab" />

                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Play className="h-4 w-4 text-emerald-600" />
                  </div>

                  {editingId === video.$id ? (
                    <div className="flex-1 flex flex-wrap items-center gap-3">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="h-8 text-sm bg-white border-gray-200 flex-1 min-w-[150px]"
                        placeholder="Video title"
                      />
                      <Input
                        value={editOrder}
                        onChange={(e) => setEditOrder(e.target.value)}
                        className="h-8 text-sm bg-white border-gray-200 w-20"
                        placeholder="Order"
                        type="number"
                      />
                      <div className="flex items-center gap-2">
                        <Switch checked={editPublished} onCheckedChange={setEditPublished} />
                        <span className="text-xs text-gray-500">{editPublished ? 'Published' : 'Draft'}</span>
                      </div>
                      <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={saveEdit} disabled={saving}>
                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8" onClick={cancelEdit}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{video.title || 'Untitled Video'}</p>
                        <p className="text-xs text-gray-500">
                          Order: {video.order ?? '-'} · {video.duration ? `${Math.round(video.duration / 60)}min` : 'Duration N/A'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {video.isFree && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">Free</Badge>}
                        {video.isPublished
                          ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs flex items-center gap-1"><Eye className="h-3 w-3" /> Published</Badge>
                          : <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 text-xs flex items-center gap-1"><EyeOff className="h-3 w-3" /> Draft</Badge>
                        }
                        <Button size="sm" variant="ghost" className="h-8" onClick={() => startEdit(video)}>
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
