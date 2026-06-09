'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  RefreshCw,
  Plus,
  MoreVertical,
  Trash2,
  Edit,
  Upload,
  Link2,
  FileVideo,
  Image as ImageIcon,
  X,
  CheckCircle2,
  Eye,
  Video,
  ChevronDown,
  Play,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete, apiUpload, ApiError } from '@/lib/api-client';
import type { Video as VideoType, Course } from '@/lib/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ---------------------------------------------------------------------------
// FileUploadZone
// ---------------------------------------------------------------------------

function FileUploadZone({
  bucket,
  label,
  accept,
  onUploaded,
  currentUrl,
}: {
  bucket: string;
  label: string;
  accept: string;
  onUploaded: (url: string) => void;
  currentUrl?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(currentUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUploadedUrl(currentUrl || '');
  }, [currentUrl]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      const result = await apiUpload('/upload', formData) as Record<string, unknown>;
      const url = result.url as string;
      setUploadedUrl(url);
      onUploaded(url);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Upload failed';
      console.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="space-y-2">
      {label && <Label className="text-xs text-muted-foreground">{label}</Label>}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-emerald-500/50 bg-emerald-500/5'
            : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
        } ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">Uploading...</p>
          </div>
        ) : uploadedUrl ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            <p className="text-xs text-muted-foreground truncate max-w-full">File uploaded</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-emerald-400 h-6"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            >
              Replace file
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-7 w-7 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">Drag & drop or click</p>
            <p className="text-[10px] text-muted-foreground/50">{accept === 'video/*' ? 'MP4, WebM, MOV' : 'PNG, JPG, WebP'}</p>
          </div>
        )}
      </div>
      {uploadedUrl && (
        <div className="flex items-center gap-2">
          <Input
            value={uploadedUrl}
            readOnly
            className="bg-white/[0.04] border-white/[0.08] text-xs font-mono h-8"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-8 w-8"
            onClick={() => { setUploadedUrl(''); onUploaded(''); }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function VideosTable() {
  const { toast } = useToast();

  // Data state
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editVideo, setEditVideo] = useState<VideoType | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    courseId: '',
    videoUrl: '',
    thumbnailUrl: '',
    duration: 0,
    order: 0,
    isPreview: false,
    isPublished: false,
  });

  const LIMIT = 20;

  // ---- Fetch videos ----
  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (search) params.set('search', search);
      if (courseFilter !== 'all') params.set('courseId', courseFilter);

      const data = await apiGet(`/videos?${params}`) as Record<string, unknown>;
      const docs = (data.documents ?? data.data ?? []) as VideoType[];
      setVideos(docs);
      setTotal((data.total as number) || docs.length);
    } catch {
      setError('Failed to load videos');
      toast({ title: 'Error', description: 'Failed to fetch videos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, search, courseFilter, toast]);

  // ---- Fetch courses (for dropdown) ----
  const fetchCourses = useCallback(async () => {
    try {
      const data = await apiGet('/courses?limit=100') as Record<string, unknown>;
      const docs = (data.documents ?? data.data ?? []) as Course[];
      setCourses(docs);
    } catch {
      // Silently fail — dropdown will just be empty
    }
  }, []);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);
  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  // ---- Dialog helpers ----
  const openCreateDialog = () => {
    setEditVideo(null);
    setForm({
      title: '', slug: '', description: '', courseId: '',
      videoUrl: '', thumbnailUrl: '', duration: 0, order: 0,
      isPreview: false, isPublished: false,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (video: VideoType) => {
    setEditVideo(video);
    setForm({
      title: video.title || '',
      slug: video.slug || '',
      description: video.description || '',
      courseId: video.courseId || '',
      videoUrl: video.videoUrl || '',
      thumbnailUrl: video.thumbnailUrl || '',
      duration: video.duration || 0,
      order: video.order || 0,
      isPreview: video.isPreview || false,
      isPublished: video.isPublished || false,
    });
    setDialogOpen(true);
  };

  // ---- Save ----
  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Validation', description: 'Title is required', variant: 'destructive' });
      return;
    }
    if (!form.courseId) {
      toast({ title: 'Validation', description: 'Course is required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const slug = form.slug || slugify(form.title);
      const payload = { ...form, slug };

      if (editVideo) {
        await apiPut('/videos', { videoId: editVideo.id, ...payload });
      } else {
        await apiPost('/videos', payload);
      }
      toast({ title: 'Success', description: `Video ${editVideo ? 'updated' : 'created'}` });
      setDialogOpen(false);
      fetchVideos();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Network error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ---- Delete ----
  const deleteVideo = async (id: string) => {
    if (!confirm('Delete this video?')) return;
    try {
      await apiDelete(`/videos?id=${id}`);
      toast({ title: 'Deleted', description: 'Video removed' });
      fetchVideos();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete video', variant: 'destructive' });
    }
  };

  // ---- Toggle published ----
  const togglePublished = async (video: VideoType) => {
    try {
      await apiPut('/videos', { videoId: video.id, isPublished: !video.isPublished });
      toast({ title: 'Success', description: video.isPublished ? 'Unpublished' : 'Published' });
      fetchVideos();
    } catch {
      toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
    }
  };

  // ---- Course name lookup ----
  const getCourseName = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    return course?.title || courseId.slice(0, 8) + '...';
  };

  const totalPages = Math.ceil(total / LIMIT);

  // ---- Animation variants ----
  const rowVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.03, duration: 0.3 },
    }),
    exit: { opacity: 0, transition: { duration: 0.15 } },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* ===== Page Header ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Video className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Videos</h2>
            <p className="text-sm text-muted-foreground">{total} total videos</p>
          </div>
        </div>
        <Button onClick={openCreateDialog} className="gradient-primary text-white self-start sm:self-auto">
          <Plus className="h-4 w-4 mr-2" /> Add Video
        </Button>
      </div>

      {/* ===== Filters ===== */}
      <Card className="glass-card border-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search videos..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 bg-white/[0.04] border-white/[0.08]"
              />
            </div>
            <Select value={courseFilter} onValueChange={(v) => { setCourseFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[200px] bg-white/[0.04] border-white/[0.08]">
                <ChevronDown className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchVideos} className="border-white/[0.08] self-start">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ===== Data Table ===== */}
      <Card className="glass-card border-0">
        <CardContent className="p-0">
          {/* Error State */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <AlertCircle className="h-10 w-10 text-destructive/60" />
              <p className="text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={fetchVideos} className="border-white/[0.08]">
                <RefreshCw className="h-4 w-4 mr-2" /> Retry
              </Button>
            </div>
          )}

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.06] hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Video</TableHead>
                  <TableHead className="text-muted-foreground">Course</TableHead>
                  <TableHead className="text-muted-foreground">Duration</TableHead>
                  <TableHead className="text-muted-foreground">Order</TableHead>
                  <TableHead className="text-muted-foreground">Preview</TableHead>
                  <TableHead className="text-muted-foreground">Published</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-white/[0.06]">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full max-w-[120px] bg-white/5" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : videos.length === 0 && !error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <FileVideo className="h-10 w-10 text-muted-foreground/30" />
                        <p className="text-muted-foreground">No videos found</p>
                        <Button variant="outline" size="sm" onClick={openCreateDialog} className="border-white/[0.08]">
                          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add your first video
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {videos.map((video) => (
                      <tr
                        key={video.id}
                        className="border-white/[0.06] hover:bg-white/[0.03] transition-colors"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-8 rounded overflow-hidden bg-white/5 flex-shrink-0">
                              {video.thumbnailUrl ? (
                                <img
                                  src={video.thumbnailUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Play className="h-3.5 w-3.5 text-muted-foreground/40" />
                                </div>
                              )}
                            </div>
                            <span className="truncate max-w-[200px]">{video.title || 'Untitled'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <span className="truncate max-w-[140px] block">{getCourseName(video.courseId)}</span>
                        </TableCell>
                        <TableCell className="text-sm font-mono">
                          {formatDuration(video.duration)}
                        </TableCell>
                        <TableCell className="text-sm">{video.order}</TableCell>
                        <TableCell>
                          {video.isPreview ? (
                            <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-400 text-xs">
                              <Eye className="h-3 w-3 mr-1" /> Preview
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground/40 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => togglePublished(video)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors cursor-pointer ${
                              video.isPublished
                                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${video.isPublished ? 'bg-emerald-400' : 'bg-muted-foreground/40'}`} />
                            {video.isPublished ? 'Published' : 'Draft'}
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#1A1A2E] border-white/10">
                              <DropdownMenuItem onClick={() => openEditDialog(video)}>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => togglePublished(video)}>
                                {video.isPublished ? 'Unpublish' : 'Publish'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteVideo(video.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </tr>
                    ))}
                  </>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden p-4 space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg bg-white/5" />
              ))
            ) : videos.length === 0 && !error ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <FileVideo className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-muted-foreground">No videos found</p>
              </div>
            ) : (
              <AnimatePresence>
                {videos.map((video, i) => (
                  <motion.div
                    key={video.id}
                    custom={i}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="relative w-10 h-7 rounded overflow-hidden bg-white/5 flex-shrink-0">
                            {video.thumbnailUrl ? (
                              <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Play className="h-3 w-3 text-muted-foreground/40" />
                              </div>
                            )}
                          </div>
                          <p className="text-sm font-medium truncate">{video.title || 'Untitled'}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getCourseName(video.courseId)} &middot; {formatDuration(video.duration)} &middot; #{video.order}
                        </p>
                        <div className="flex gap-1 mt-1.5">
                          {video.isPreview && (
                            <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-400 text-[10px]">
                              <Eye className="h-2.5 w-2.5 mr-0.5" /> Preview
                            </Badge>
                          )}
                          <Badge
                            variant="secondary"
                            className={video.isPublished
                              ? 'bg-emerald-500/10 text-emerald-400 text-[10px]'
                              : 'bg-white/5 text-muted-foreground text-[10px]'}
                          >
                            {video.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1A1A2E] border-white/10">
                          <DropdownMenuItem onClick={() => openEditDialog(video)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteVideo(video.id)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="border-white/[0.08]"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="border-white/[0.08]"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== Add/Edit Dialog ===== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1A1A2E] border-white/[0.08] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-emerald-400" />
              {editVideo ? 'Edit Video' : 'Add Video'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Title + Slug */}
            <div className="space-y-2">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm((f) => ({
                    ...f,
                    title,
                    slug: f.slug || slugify(title),
                  }));
                }}
                placeholder="Video title"
                className="bg-white/[0.04] border-white/[0.08]"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="auto-generated-from-title"
                className="bg-white/[0.04] border-white/[0.08] font-mono text-sm"
              />
            </div>

            {/* Course */}
            <div className="space-y-2">
              <Label>Course <span className="text-destructive">*</span></Label>
              <Select value={form.courseId} onValueChange={(v) => setForm((f) => ({ ...f, courseId: v }))}>
                <SelectTrigger className="w-full bg-white/[0.04] border-white/[0.08]">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      <span className="flex items-center gap-2">
                        <FolderOpen className="h-3.5 w-3.5" /> No courses available
                      </span>
                    </SelectItem>
                  ) : (
                    courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="bg-white/[0.04] border-white/[0.08]"
                rows={3}
              />
            </div>

            {/* Video: Upload or Link */}
            <div className="space-y-2">
              <Label>Video</Label>
              <Tabs defaultValue={form.videoUrl ? 'link' : 'upload'} className="w-full">
                <TabsList className="bg-white/[0.04] border border-white/[0.08] w-full">
                  <TabsTrigger value="upload" className="flex-1 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                    <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload
                  </TabsTrigger>
                  <TabsTrigger value="link" className="flex-1 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                    <Link2 className="h-3.5 w-3.5 mr-1.5" /> Link
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="mt-3">
                  <FileUploadZone
                    bucket="videos"
                    label=""
                    accept="video/*"
                    onUploaded={(url) => setForm((f) => ({ ...f, videoUrl: url }))}
                    currentUrl={form.videoUrl}
                  />
                </TabsContent>
                <TabsContent value="link" className="mt-3">
                  <Input
                    value={form.videoUrl}
                    onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
                    className="bg-white/[0.04] border-white/[0.08]"
                    placeholder="https://example.com/video.mp4"
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Thumbnail: Upload or Link */}
            <div className="space-y-2">
              <Label>Thumbnail</Label>
              <Tabs defaultValue={form.thumbnailUrl ? 'link' : 'upload'} className="w-full">
                <TabsList className="bg-white/[0.04] border border-white/[0.08] w-full">
                  <TabsTrigger value="upload" className="flex-1 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                    <ImageIcon className="h-3.5 w-3.5 mr-1.5" /> Upload
                  </TabsTrigger>
                  <TabsTrigger value="link" className="flex-1 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                    <Link2 className="h-3.5 w-3.5 mr-1.5" /> Link
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="mt-3">
                  <FileUploadZone
                    bucket="thumbnails"
                    label=""
                    accept="image/*"
                    onUploaded={(url) => setForm((f) => ({ ...f, thumbnailUrl: url }))}
                    currentUrl={form.thumbnailUrl}
                  />
                </TabsContent>
                <TabsContent value="link" className="mt-3">
                  <Input
                    value={form.thumbnailUrl}
                    onChange={(e) => setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))}
                    className="bg-white/[0.04] border-white/[0.08]"
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Duration + Order */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (sec)</Label>
                <Input
                  type="number"
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))}
                  className="bg-white/[0.04] border-white/[0.08]"
                />
                {form.duration > 0 && (
                  <p className="text-[10px] text-muted-foreground">= {formatDuration(form.duration)}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Order</Label>
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                  className="bg-white/[0.04] border-white/[0.08]"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3 rounded-lg bg-white/[0.02] border border-white/[0.06] p-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Preview (free)</Label>
                <Switch checked={form.isPreview} onCheckedChange={(v) => setForm((f) => ({ ...f, isPreview: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Published</Label>
                <Switch checked={form.isPublished} onCheckedChange={(v) => setForm((f) => ({ ...f, isPublished: v }))} />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-white/[0.08]">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gradient-primary text-white">
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : null}
              {editVideo ? 'Update' : 'Create'} Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
