'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCw,
  Star,
  BookOpen,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Link,
  Clock,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from '@/lib/api-client';
import type { Course } from '@/lib/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapCourse(doc: Record<string, unknown>): Course {
  return {
    id: String(doc.id ?? ''),
    title: String(doc.title ?? ''),
    slug: String(doc.slug ?? ''),
    description: doc.description ? String(doc.description) : undefined,
    thumbnailUrl: doc.thumbnailUrl ? String(doc.thumbnailUrl) : undefined,
    previewVideoUrl: doc.previewVideoUrl ? String(doc.previewVideoUrl) : undefined,
    categoryId: doc.categoryId ? String(doc.categoryId) : undefined,
    instructorId: doc.instructorId ? String(doc.instructorId) : undefined,
    technologyId: doc.technologyId ? Number(doc.technologyId) : undefined,
    level: (doc.level as Course['level']) ?? 'beginner',
    language: (doc.language as Course['language']) ?? 'bangla',
    duration: Number(doc.duration ?? 0),
    totalVideos: Number(doc.totalVideos ?? 0),
    rating: Number(doc.rating ?? 0),
    totalReviews: Number(doc.totalReviews ?? 0),
    totalStudents: Number(doc.totalStudents ?? 0),
    price: Number(doc.price ?? 0),
    isFeatured: Boolean(doc.isFeatured),
    isPublished: Boolean(doc.isPublished),
    tags: doc.tags ? String(doc.tags) : undefined,
    createdAt: String(doc.createdAt ?? ''),
    updatedAt: String(doc.updatedAt ?? ''),
  };
}

const PAGE_SIZE = 20;

const levelBadgeStyles: Record<string, string> = {
  beginner: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  intermediate: 'bg-dakkho-blue/15 text-dakkho-blue border border-dakkho-blue/20',
  advanced: 'bg-dakkho-purple/15 text-dakkho-purple border border-dakkho-purple/20',
  expert: 'bg-dakkho-orange/15 text-dakkho-orange border border-dakkho-orange/20',
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CoursesTable() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [publishedFilter, setPublishedFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    categoryId: '',
    instructorId: '',
    technologyId: '',
    level: 'beginner' as Course['level'],
    language: 'bangla' as Course['language'],
    duration: 0,
    price: 0,
    isFeatured: false,
    isPublished: false,
    tags: '',
    thumbnailUrl: '',
    thumbnailFile: null as File | null,
  });

  // Dropdown data
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [instructors, setInstructors] = useState<{ id: string; name: string }[]>([]);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (search) params.set('search', search);
      if (levelFilter !== 'all') params.set('level', levelFilter);
      if (publishedFilter === 'true') params.set('published', 'true');
      if (publishedFilter === 'false') params.set('published', 'false');

      const data = (await apiGet(`/courses?${params}`)) as Record<string, unknown>;
      const docs = (data.documents as Record<string, unknown>[]) || [];
      setCourses(docs.map(mapCourse));
      setTotal((data.total as number) || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch courses';
      setError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, search, levelFilter, publishedFilter, toast]);

  const fetchDropdownData = useCallback(async () => {
    try {
      const [catData, instData] = await Promise.all([
        apiGet('/categories?limit=200') as Promise<Record<string, unknown>>,
        apiGet('/instructors?limit=200') as Promise<Record<string, unknown>>,
      ]);
      const catDocs = (catData.documents as Record<string, unknown>[]) || [];
      const instDocs = (instData.documents as Record<string, unknown>[]) || [];
      setCategories(
        catDocs.map((d) => ({ id: String(d.id), name: String(d.name ?? 'Unknown') })),
      );
      setInstructors(
        instDocs.map((d) => ({ id: String(d.id), name: String(d.name ?? 'Unknown') })),
      );
    } catch {
      // silent — dropdowns can be empty
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

  // -------------------------------------------------------------------------
  // CRUD handlers
  // -------------------------------------------------------------------------

  const openCreateDialog = () => {
    setEditCourse(null);
    setForm({
      title: '',
      slug: '',
      description: '',
      categoryId: '',
      instructorId: '',
      technologyId: '',
      level: 'beginner',
      language: 'bangla',
      duration: 0,
      price: 0,
      isFeatured: false,
      isPublished: false,
      tags: '',
      thumbnailUrl: '',
      thumbnailFile: null,
    });
    setFormOpen(true);
  };

  const openEditDialog = (course: Course) => {
    setEditCourse(course);
    setForm({
      title: course.title,
      slug: course.slug,
      description: course.description ?? '',
      categoryId: course.categoryId ?? '',
      instructorId: course.instructorId ?? '',
      technologyId: course.technologyId ? String(course.technologyId) : '',
      level: course.level,
      language: course.language,
      duration: course.duration,
      price: course.price,
      isFeatured: course.isFeatured,
      isPublished: course.isPublished,
      tags: course.tags ?? '',
      thumbnailUrl: course.thumbnailUrl ?? '',
      thumbnailFile: null,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Handle thumbnail upload
      let thumbnailUrl = form.thumbnailUrl;
      if (form.thumbnailFile) {
        try {
          const fd = new FormData();
          fd.append('file', form.thumbnailFile);
          fd.append('folder', 'course-thumbnails');
          const uploadResult = (await apiUpload('/upload', fd)) as Record<string, unknown>;
          thumbnailUrl = String(uploadResult.url || uploadResult.key || '');
        } catch {
          toast({ title: 'Warning', description: 'Thumbnail upload failed, using URL instead' });
        }
      }

      const slug = form.slug || slugify(form.title);
      const payload: Record<string, unknown> = {
        title: form.title,
        slug,
        description: form.description || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        categoryId: form.categoryId || undefined,
        instructorId: form.instructorId || undefined,
        technologyId: form.technologyId ? Number(form.technologyId) : undefined,
        level: form.level,
        language: form.language,
        duration: form.duration,
        price: form.price,
        isFeatured: form.isFeatured,
        isPublished: form.isPublished,
        tags: form.tags || undefined,
      };

      if (editCourse) {
        await apiPut('/courses', { courseId: editCourse.id, ...payload });
        toast({ title: 'Success', description: 'Course updated successfully' });
      } else {
        await apiPost('/courses', {
          ...payload,
          totalVideos: 0,
          rating: 0,
          totalReviews: 0,
          totalStudents: 0,
        });
        toast({ title: 'Success', description: 'Course created successfully' });
      }

      setFormOpen(false);
      fetchCourses();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save course';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiDelete(`/courses?id=${deleteTarget.id}`);
      toast({ title: 'Deleted', description: 'Course has been deleted' });
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchCourses();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete course';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const togglePublished = async (course: Course) => {
    try {
      await apiPut('/courses', { courseId: course.id, isPublished: !course.isPublished });
      toast({
        title: 'Success',
        description: `Course ${!course.isPublished ? 'published' : 'unpublished'}`,
      });
      fetchCourses();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update course';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const renderLevelBadge = (level: string) => (
    <span className={`status-badge ${levelBadgeStyles[level] || levelBadgeStyles.beginner}`}>
      {level}
    </span>
  );

  // ---- Instructor name lookup ----
  const getInstructorName = (instructorId: string) => {
    const instructor = instructors.find((inst) => inst.id === instructorId);
    return instructor?.name || instructorId.slice(0, 8) + '...';
  };

  // -------------------------------------------------------------------------
  // JSX
  // -------------------------------------------------------------------------

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* ---- Page Header ---- */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <h1 className="page-title">Courses</h1>
          <Badge
            variant="secondary"
            className="bg-dakkho-purple/15 text-dakkho-purple border border-dakkho-purple/20 text-xs"
          >
            {total}
          </Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={openCreateDialog} className="gradient-purple text-white gap-2">
            <Plus className="h-4 w-4" />
            Add Course
          </Button>
        </div>
      </div>

      {/* ---- Filters Bar ---- */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search courses by title..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-white/[0.04] border-white/[0.08] h-10"
            />
          </div>

          {/* Level filter */}
          <Select
            value={levelFilter}
            onValueChange={(v) => {
              setLevelFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px] bg-white/[0.04] border-white/[0.08] h-10">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
            </SelectContent>
          </Select>

          {/* Published filter */}
          <Select
            value={publishedFilter}
            onValueChange={(v) => {
              setPublishedFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px] bg-white/[0.04] border-white/[0.08] h-10">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Published</SelectItem>
              <SelectItem value="false">Draft</SelectItem>
            </SelectContent>
          </Select>

          {/* Refresh */}
          <Button
            variant="outline"
            size="icon"
            onClick={fetchCourses}
            className="border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] h-10 w-10"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ---- Data Table ---- */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Course</th>
                <th className="hidden lg:table-cell">Instructor</th>
                <th>Level</th>
                <th className="hidden md:table-cell">Language</th>
                <th className="hidden xl:table-cell">Duration</th>
                <th className="hidden lg:table-cell">Students</th>
                <th className="hidden xl:table-cell">Rating</th>
                <th>Published</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* ---- Loading skeleton ---- */}
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skel-${i}`}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-14 rounded-md" />
                        <Skeleton className="h-4 w-36" />
                      </div>
                    </td>
                    <td className="hidden lg:table-cell">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td>
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </td>
                    <td className="hidden md:table-cell">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="hidden xl:table-cell">
                      <Skeleton className="h-4 w-14" />
                    </td>
                    <td className="hidden lg:table-cell">
                      <Skeleton className="h-4 w-10" />
                    </td>
                    <td className="hidden xl:table-cell">
                      <Skeleton className="h-4 w-14" />
                    </td>
                    <td>
                      <Skeleton className="h-5 w-10 rounded-full" />
                    </td>
                    <td className="text-right">
                      <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                    </td>
                  </tr>
                ))}

              {/* ---- Error state ---- */}
              {!loading && error && (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <AlertTriangle className="h-10 w-10 text-dakkho-warning" />
                      <p className="text-muted-foreground text-sm">{error}</p>
                      <Button variant="outline" size="sm" onClick={fetchCourses} className="gap-2">
                        <RefreshCw className="h-3.5 w-3.5" /> Retry
                      </Button>
                    </div>
                  </td>
                </tr>
              )}

              {/* ---- Empty state ---- */}
              {!loading && !error && courses.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <BookOpen className="h-10 w-10 text-muted-foreground/50" />
                      <p className="text-muted-foreground text-sm">No courses found</p>
                      <p className="text-muted-foreground/60 text-xs">
                        Create your first course or adjust filters
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={openCreateDialog}
                        className="gap-2 mt-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Course
                      </Button>
                    </div>
                  </td>
                </tr>
              )}

              {/* ---- Data rows ---- */}
              {!loading &&
                !error &&
                courses.map((course) => (
                  <tr key={course.id}>
                    {/* Thumbnail + Title */}
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-14 rounded-md overflow-hidden flex-shrink-0 bg-white/[0.04] border border-white/[0.06]">
                          {course.thumbnailUrl ? (
                            <img
                              src={course.thumbnailUrl}
                              alt={course.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <BookOpen className="h-4 w-4 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            {course.isFeatured && (
                              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                            )}
                            <span className="font-medium text-foreground truncate max-w-[180px]">
                              {course.title || 'Untitled'}
                            </span>
                          </div>
                          {course.price > 0 && (
                            <span className="text-xs text-dakkho-success">৳{course.price}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Instructor */}
                    <td className="hidden lg:table-cell text-muted-foreground text-sm">
                      {course.instructorId ? (
                        <span className="truncate max-w-[120px] block">{getInstructorName(course.instructorId)}</span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>

                    {/* Level */}
                    <td>{renderLevelBadge(course.level)}</td>

                    {/* Language */}
                    <td className="hidden md:table-cell text-muted-foreground text-sm capitalize">
                      {course.language}
                    </td>

                    {/* Duration */}
                    <td className="hidden xl:table-cell text-muted-foreground text-sm">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(course.duration)}
                      </span>
                    </td>

                    {/* Students */}
                    <td className="hidden lg:table-cell text-muted-foreground text-sm">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {course.totalStudents}
                      </span>
                    </td>

                    {/* Rating */}
                    <td className="hidden xl:table-cell text-sm">
                      {course.rating > 0 ? (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                          <span className="text-amber-400">{course.rating.toFixed(1)}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>

                    {/* Published toggle */}
                    <td>
                      <div
                        className="cursor-pointer"
                        onClick={() => togglePublished(course)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') togglePublished(course);
                        }}
                      >
                        <Switch
                          checked={course.isPublished}
                          className="data-[state=checked]:bg-dakkho-success data-[state=unchecked]:bg-white/10"
                        />
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-white/[0.06]"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-[#1A1A2E] border-white/[0.08] z-50"
                        >
                          <DropdownMenuItem
                            onClick={() => openEditDialog(course)}
                            className="gap-2"
                          >
                            <Pencil className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => togglePublished(course)}
                            className="gap-2"
                          >
                            {course.isPublished ? 'Unpublish' : 'Publish'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/[0.06]" />
                          <DropdownMenuItem
                            onClick={() => {
                              setDeleteTarget(course);
                              setDeleteOpen(true);
                            }}
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* ---- Pagination ---- */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-white/[0.08] bg-transparent"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-white/[0.08] bg-transparent"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ---- Mobile Card Layout ---- */}
      <div className="md:hidden space-y-3">
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-16 rounded-md" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}

        {!loading && !error && courses.length === 0 && (
          <div className="glass-card rounded-xl p-8 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No courses found</p>
          </div>
        )}

        <AnimatePresence>
          {!loading &&
            !error &&
            courses.map((course) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="glass-card rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-12 w-16 rounded-md overflow-hidden flex-shrink-0 bg-white/[0.04] border border-white/[0.06]">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        {course.isFeatured && (
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                        )}
                        <p className="text-sm font-medium text-foreground truncate">
                          {course.title || 'Untitled'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {course.language.charAt(0).toUpperCase() + course.language.slice(1)} ·{' '}
                        {formatDuration(course.duration)} · {course.totalStudents} students
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-[#1A1A2E] border-white/[0.08] z-50"
                    >
                      <DropdownMenuItem
                        onClick={() => openEditDialog(course)}
                        className="gap-2"
                      >
                        <Pencil className="h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => togglePublished(course)}
                        className="gap-2"
                      >
                        {course.isPublished ? 'Unpublish' : 'Publish'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/[0.06]" />
                      <DropdownMenuItem
                        onClick={() => {
                          setDeleteTarget(course);
                          setDeleteOpen(true);
                        }}
                        className="gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  {renderLevelBadge(course.level)}
                  <span
                    className={`status-badge ${course.isPublished ? 'status-badge-active' : 'status-badge-inactive'}`}
                  >
                    {course.isPublished ? 'Published' : 'Draft'}
                  </span>
                  {course.price > 0 && (
                    <span className="status-badge bg-dakkho-success/15 text-dakkho-success border border-dakkho-success/20">
                      ৳{course.price}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {/* ---- Add/Edit Course Dialog ---- */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-[#1A1A2E] border-white/[0.08] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editCourse ? 'Edit Course' : 'Add Course'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editCourse ? 'Update course information' : 'Create a new course'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Title + Slug */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-muted-foreground">
                  Title
                </Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setForm({
                      ...form,
                      title,
                      slug: form.slug === slugify(form.title) ? slugify(title) : form.slug,
                    });
                  }}
                  className="bg-white/[0.04] border-white/[0.08]"
                  placeholder="Enter course title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-muted-foreground">
                  Slug{' '}
                  <span className="text-muted-foreground/50 text-xs">(auto-generated if empty)</span>
                </Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="bg-white/[0.04] border-white/[0.08]"
                  placeholder="course-slug"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-muted-foreground">
                Description
              </Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-white/[0.04] border-white/[0.08] min-h-[100px]"
                placeholder="Describe the course..."
                rows={4}
              />
            </div>

            {/* Thumbnail */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Thumbnail</Label>
              <div className="flex gap-3 items-start">
                <div className="h-20 w-28 rounded-lg overflow-hidden bg-white/[0.04] border border-white/[0.06] flex-shrink-0">
                  {form.thumbnailUrl ? (
                    <img
                      src={form.thumbnailUrl}
                      alt="Thumbnail preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <ImagePlus className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-white/[0.08] bg-white/[0.04] gap-2"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) setForm({ ...form, thumbnailFile: file });
                        };
                        input.click();
                      }}
                    >
                      <ImagePlus className="h-3.5 w-3.5" /> Upload
                    </Button>
                    {form.thumbnailFile && (
                      <span className="text-xs text-muted-foreground self-center truncate max-w-[120px]">
                        {form.thumbnailFile.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link className="h-3.5 w-3.5 text-muted-foreground/50" />
                    <Input
                      value={form.thumbnailUrl}
                      onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                      className="bg-white/[0.04] border-white/[0.08] h-8 text-xs"
                      placeholder="Or paste image URL"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Category + Instructor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Category</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => setForm({ ...form, categoryId: v })}
                >
                  <SelectTrigger className="bg-white/[0.04] border-white/[0.08]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Instructor</Label>
                <Select
                  value={form.instructorId}
                  onValueChange={(v) => setForm({ ...form, instructorId: v })}
                >
                  <SelectTrigger className="bg-white/[0.04] border-white/[0.08]">
                    <SelectValue placeholder="Select instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Level + Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Level</Label>
                <Select
                  value={form.level}
                  onValueChange={(v) => setForm({ ...form, level: v as Course['level'] })}
                >
                  <SelectTrigger className="bg-white/[0.04] border-white/[0.08]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Language</Label>
                <Select
                  value={form.language}
                  onValueChange={(v) => setForm({ ...form, language: v as Course['language'] })}
                >
                  <SelectTrigger className="bg-white/[0.04] border-white/[0.08]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bangla">Bangla</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="hindi">Hindi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Duration + Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-muted-foreground">
                  Duration (minutes)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min={0}
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                  className="bg-white/[0.04] border-white/[0.08]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price" className="text-muted-foreground">
                  Price (৳)
                </Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="bg-white/[0.04] border-white/[0.08]"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-muted-foreground">
                Tags{' '}
                <span className="text-muted-foreground/50 text-xs">(comma-separated)</span>
              </Label>
              <Input
                id="tags"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="bg-white/[0.04] border-white/[0.08]"
                placeholder="e.g. web-dev, javascript, react"
              />
            </div>

            {/* Switches */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-muted-foreground">Featured</Label>
                  <p className="text-xs text-muted-foreground/50">Show in featured section</p>
                </div>
                <Switch
                  checked={form.isFeatured}
                  onCheckedChange={(v) => setForm({ ...form, isFeatured: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-muted-foreground">Published</Label>
                  <p className="text-xs text-muted-foreground/50">Make visible to students</p>
                </div>
                <Switch
                  checked={form.isPublished}
                  onCheckedChange={(v) => setForm({ ...form, isPublished: v })}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              className="border-white/[0.08] bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.title.trim()}
              className="gradient-purple text-white gap-2"
            >
              {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
              {editCourse ? 'Update Course' : 'Create Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Delete Confirmation Dialog ---- */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-[#1A1A2E] border-white/[0.08]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-dakkho-warning" />
              Delete Course
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">{deleteTarget?.title}</span>? This
              action cannot be undone. All videos, enrollments, and associated data will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/[0.08] bg-transparent">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Course
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
