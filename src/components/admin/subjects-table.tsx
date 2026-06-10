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
  BookMarked,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Tag,
  Palette,
  Hash,
  ToggleLeft,
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
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client';
import type { Subject } from '@/lib/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapSubject(doc: Record<string, unknown>): Subject {
  return {
    id: String(doc.id ?? ''),
    name: String(doc.name ?? ''),
    slug: String(doc.slug ?? ''),
    description: doc.description ? String(doc.description) : undefined,
    icon: doc.icon ? String(doc.icon) : undefined,
    color: doc.color ? String(doc.color) : undefined,
    technologyId: doc.technologyId ? Number(doc.technologyId) : undefined,
    sortOrder: Number(doc.sortOrder ?? 0),
    courseCount: Number(doc.courseCount ?? 0),
    isActive: Boolean(doc.isActive),
    createdAt: String(doc.createdAt ?? ''),
    updatedAt: String(doc.updatedAt ?? ''),
  };
}

const PAGE_SIZE = 20;

// Predefined color palette (matching categories-table)
const PREDEFINED_COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
  '#84CC16', '#A855F7', '#E11D48', '#0EA5E9', '#D946EF',
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SubjectsTable() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    technologyId: '',
    icon: '',
    color: '#10B981',
    sortOrder: 0,
    isActive: true,
  });

  // Inline create state for technology
  const [inlineTechName, setInlineTechName] = useState('');
  const [showInlineTech, setShowInlineTech] = useState(false);
  const [creatingTech, setCreatingTech] = useState(false);

  // Dropdown data — technologies
  const [technologies, setTechnologies] = useState<{ id: number; name: string }[]>([]);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (search) params.set('search', search);
      if (statusFilter === 'active') params.set('isActive', 'true');
      if (statusFilter === 'inactive') params.set('isActive', 'false');

      const data = (await apiGet(`/subjects?${params}`)) as Record<string, unknown>;
      const docs = (data.subjects as Record<string, unknown>[]) || (data.documents as Record<string, unknown>[]) || [];
      setSubjects(docs.map(mapSubject));
      setTotal((data.total as number) || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch subjects';
      setError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, toast]);

  const fetchTechnologies = useCallback(async () => {
    try {
      const data = (await apiGet('/technologies?limit=200')) as Record<string, unknown>;
      const docs = (data.technologies as Record<string, unknown>[]) || (data.documents as Record<string, unknown>[]) || [];
      setTechnologies(
        docs.map((d) => ({ id: Number(d.id), name: String(d.name ?? 'Unknown') })),
      );
    } catch {
      // silent — dropdown can be empty
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  useEffect(() => {
    fetchTechnologies();
  }, [fetchTechnologies]);

  // -------------------------------------------------------------------------
  // CRUD handlers
  // -------------------------------------------------------------------------

  const openCreateDialog = () => {
    setEditSubject(null);
    setForm({
      name: '',
      slug: '',
      description: '',
      technologyId: '',
      icon: '',
      color: '#10B981',
      sortOrder: 0,
      isActive: true,
    });
    setInlineTechName('');
    setShowInlineTech(false);
    setFormOpen(true);
  };

  const openEditDialog = (subject: Subject) => {
    setEditSubject(subject);
    setForm({
      name: subject.name,
      slug: subject.slug,
      description: subject.description ?? '',
      technologyId: subject.technologyId ? String(subject.technologyId) : '',
      icon: subject.icon ?? '',
      color: subject.color ?? '#10B981',
      sortOrder: subject.sortOrder,
      isActive: subject.isActive,
    });
    setInlineTechName('');
    setShowInlineTech(false);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Validation', description: 'Name is required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const slug = form.slug || slugify(form.name);
      const payload: Record<string, unknown> = {
        name: form.name,
        slug,
        description: form.description || undefined,
        technology_id: form.technologyId ? Number(form.technologyId) : undefined,
        icon: form.icon || undefined,
        color: form.color || undefined,
        sort_order: form.sortOrder,
        is_active: form.isActive,
      };

      if (editSubject) {
        await apiPut('/subjects', { subjectId: editSubject.id, ...payload });
        toast({ title: 'Success', description: 'Subject updated successfully' });
      } else {
        await apiPost('/subjects', {
          ...payload,
          course_count: 0,
        });
        toast({ title: 'Success', description: 'Subject created successfully' });
      }

      setFormOpen(false);
      fetchSubjects();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save subject';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiDelete(`/subjects?id=${deleteTarget.id}`);
      toast({ title: 'Deleted', description: 'Subject has been deleted' });
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchSubjects();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete subject';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const toggleActive = async (subject: Subject) => {
    try {
      await apiPut('/subjects', { subjectId: subject.id, is_active: !subject.isActive });
      toast({
        title: 'Success',
        description: `Subject ${!subject.isActive ? 'activated' : 'deactivated'}`,
      });
      fetchSubjects();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update subject';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  // ---- Inline create technology ----
  const handleInlineCreateTech = async () => {
    if (!inlineTechName.trim()) return;
    setCreatingTech(true);
    try {
      await apiPost('/technologies', { name: inlineTechName.trim() });
      toast({ title: 'Technology Created', description: `"${inlineTechName.trim()}" added` });
      setInlineTechName('');
      setShowInlineTech(false);
      // Re-fetch technologies so the new one appears in the dropdown
      await fetchTechnologies();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create technology';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setCreatingTech(false);
    }
  };

  // ---- Technology name lookup ----
  const getTechnologyName = (technologyId: number) => {
    const tech = technologies.find((t) => t.id === technologyId);
    return tech?.name || String(technologyId);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ---- Animation variants ----
  const rowVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.03, duration: 0.3 },
    }),
    exit: { opacity: 0, transition: { duration: 0.15 } },
  };

  // -------------------------------------------------------------------------
  // JSX
  // -------------------------------------------------------------------------

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* ---- Page Header ---- */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <BookMarked className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="page-title">Subjects</h1>
            <p className="text-sm text-muted-foreground">{total} total subjects</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={openCreateDialog} className="gradient-primary text-white gap-2">
            <Plus className="h-4 w-4" />
            Add Subject
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
              placeholder="Search subjects by name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-white/[0.04] border-white/[0.08] h-10"
            />
          </div>

          {/* Status filter */}
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px] bg-white/[0.04] border-white/[0.08] h-10">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* Refresh */}
          <Button
            variant="outline"
            size="icon"
            onClick={fetchSubjects}
            className="border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] h-10 w-10"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ---- Desktop Data Table ---- */}
      <div className="glass-card rounded-xl overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Slug</th>
                <th className="hidden lg:table-cell">Technology</th>
                <th>Courses</th>
                <th>Status</th>
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
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </td>
                    <td>
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="hidden lg:table-cell">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </td>
                    <td>
                      <Skeleton className="h-4 w-10" />
                    </td>
                    <td>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </td>
                    <td className="text-right">
                      <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                    </td>
                  </tr>
                ))}

              {/* ---- Error state ---- */}
              {!loading && error && (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <AlertTriangle className="h-10 w-10 text-dakkho-warning" />
                      <p className="text-muted-foreground text-sm">{error}</p>
                      <Button variant="outline" size="sm" onClick={fetchSubjects} className="gap-2">
                        <RefreshCw className="h-3.5 w-3.5" /> Retry
                      </Button>
                    </div>
                  </td>
                </tr>
              )}

              {/* ---- Empty state ---- */}
              {!loading && !error && subjects.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <BookMarked className="h-10 w-10 text-muted-foreground/50" />
                      <p className="text-muted-foreground text-sm">No subjects found</p>
                      <p className="text-muted-foreground/60 text-xs">
                        Create your first subject or adjust filters
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={openCreateDialog}
                        className="gap-2 mt-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Subject
                      </Button>
                    </div>
                  </td>
                </tr>
              )}

              {/* ---- Data rows ---- */}
              {!loading &&
                !error &&
                subjects.map((subject, i) => (
                  <motion.tr
                    key={subject.id}
                    custom={i}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="border-white/[0.06] hover:bg-white/[0.03] transition-colors"
                  >
                    {/* Icon + Name */}
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                          style={{
                            background: (subject.color || '#10B981') + '18',
                            color: subject.color || '#10B981',
                          }}
                        >
                          {subject.icon || subject.name?.charAt(0).toUpperCase() || (
                            <Tag className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-medium text-foreground truncate max-w-[200px] block">
                            {subject.name || 'Unnamed'}
                          </span>
                          {subject.description && (
                            <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
                              {subject.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="text-sm text-muted-foreground font-mono">
                      {subject.slug || '—'}
                    </td>

                    {/* Technology */}
                    <td className="hidden lg:table-cell">
                      {subject.technologyId ? (
                        <Badge
                          variant="outline"
                          className="bg-white/[0.04] text-muted-foreground border-white/[0.08] text-xs"
                        >
                          {getTechnologyName(subject.technologyId)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/50 text-sm">—</span>
                      )}
                    </td>

                    {/* Course Count */}
                    <td className="text-sm">
                      {subject.courseCount > 0 ? (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 text-xs">
                          {subject.courseCount} courses
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/50 text-xs">0</span>
                      )}
                    </td>

                    {/* Status */}
                    <td>
                      <div
                        className="cursor-pointer"
                        onClick={() => toggleActive(subject)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') toggleActive(subject);
                        }}
                      >
                        <Switch
                          checked={subject.isActive}
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
                            onClick={() => openEditDialog(subject)}
                            className="gap-2"
                          >
                            <Pencil className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleActive(subject)}
                            className="gap-2"
                          >
                            <ToggleLeft className="h-4 w-4" />
                            {subject.isActive ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/[0.06]" />
                          <DropdownMenuItem
                            onClick={() => {
                              setDeleteTarget(subject);
                              setDeleteOpen(true);
                            }}
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
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
                <Skeleton className="h-9 w-9 rounded-lg" />
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

        {!loading && !error && subjects.length === 0 && (
          <div className="glass-card rounded-xl p-8 text-center">
            <BookMarked className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No subjects found</p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Create your first subject or adjust filters
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={openCreateDialog}
              className="gap-2 mt-3"
            >
              <Plus className="h-3.5 w-3.5" /> Add Subject
            </Button>
          </div>
        )}

        <AnimatePresence>
          {!loading &&
            !error &&
            subjects.map((subject, i) => (
              <motion.div
                key={subject.id}
                custom={i}
                variants={rowVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="glass-card rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                      style={{
                        background: (subject.color || '#10B981') + '18',
                        color: subject.color || '#10B981',
                      }}
                    >
                      {subject.icon || subject.name?.charAt(0).toUpperCase() || (
                        <Tag className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {subject.name || 'Unnamed'}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {subject.slug || '—'}
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
                        onClick={() => openEditDialog(subject)}
                        className="gap-2"
                      >
                        <Pencil className="h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => toggleActive(subject)}
                        className="gap-2"
                      >
                        <ToggleLeft className="h-4 w-4" />
                        {subject.isActive ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/[0.06]" />
                      <DropdownMenuItem
                        onClick={() => {
                          setDeleteTarget(subject);
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
                  <span
                    className={`status-badge ${
                      subject.isActive
                        ? 'status-badge-active'
                        : 'status-badge-inactive'
                    }`}
                  >
                    {subject.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {subject.technologyId && (
                    <span className="status-badge bg-white/[0.04] text-muted-foreground border border-white/[0.08]">
                      {getTechnologyName(subject.technologyId)}
                    </span>
                  )}
                  {subject.courseCount > 0 && (
                    <span className="status-badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      {subject.courseCount} courses
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground/50">#{subject.sortOrder}</span>
                </div>
              </motion.div>
            ))}
        </AnimatePresence>

        {/* ---- Mobile Pagination ---- */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 pt-2">
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
        )}
      </div>

      {/* ---- Add/Edit Subject Dialog ---- */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-[#1A1A2E] border-white/[0.08] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <BookMarked className="h-5 w-5 text-emerald-400" />
              {editSubject ? 'Edit Subject' : 'Add Subject'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editSubject ? 'Update subject information' : 'Create a new subject'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Name */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    name,
                    slug: f.slug === slugify(f.name) ? slugify(name) : f.slug,
                  }));
                }}
                placeholder="Subject name"
                className="bg-white/[0.04] border-white/[0.08]"
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">
                Slug{' '}
                <span className="text-muted-foreground/50 text-xs">(auto-generated if empty)</span>
              </Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="subject-slug"
                className="bg-white/[0.04] border-white/[0.08] font-mono text-sm"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="bg-white/[0.04] border-white/[0.08] min-h-[80px]"
                placeholder="Describe the subject..."
                rows={3}
              />
            </div>

            {/* Technology */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Technology</Label>
              <Select
                value={form.technologyId}
                onValueChange={(v) => setForm((f) => ({ ...f, technologyId: v }))}
              >
                <SelectTrigger className="w-full bg-white/[0.04] border-white/[0.08]">
                  <SelectValue placeholder="Select technology" />
                </SelectTrigger>
                <SelectContent>
                  {technologies.map((tech) => (
                    <SelectItem key={tech.id} value={String(tech.id)}>
                      {tech.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Inline create technology */}
              {!showInlineTech ? (
                <button
                  type="button"
                  onClick={() => setShowInlineTech(true)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors mt-1"
                >
                  + Create new technology
                </button>
              ) : (
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    value={inlineTechName}
                    onChange={(e) => setInlineTechName(e.target.value)}
                    placeholder="New technology name"
                    className="bg-white/[0.04] border-white/[0.08] h-8 text-sm flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleInlineCreateTech();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleInlineCreateTech}
                    disabled={creatingTech || !inlineTechName.trim()}
                    className="gradient-primary text-white h-8 text-xs px-3"
                  >
                    {creatingTech ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Add'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowInlineTech(false);
                      setInlineTechName('');
                    }}
                    className="h-8 text-xs text-muted-foreground px-2"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* Icon + Color */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" /> Icon
                </Label>
                <Input
                  value={form.icon}
                  onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                  placeholder="emoji or text"
                  className="bg-white/[0.04] border-white/[0.08]"
                />
                {form.icon && (
                  <div className="flex justify-center">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{
                        background: (form.color || '#10B981') + '18',
                        color: form.color || '#10B981',
                      }}
                    >
                      {form.icon}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5" /> Color
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="w-10 h-9 p-1 bg-transparent border-white/[0.08] cursor-pointer rounded"
                  />
                  <Input
                    value={form.color}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="bg-white/[0.04] border-white/[0.08] font-mono text-sm flex-1"
                    placeholder="#hex"
                  />
                </div>
                {/* Predefined color swatches */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {PREDEFINED_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, color }))}
                      className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                        form.color === color ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" /> Sort Order
              </Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                className="bg-white/[0.04] border-white/[0.08]"
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/[0.06] p-3">
              <div>
                <Label className="text-foreground text-sm">Active</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Inactive subjects won&apos;t appear to students
                </p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
                className="data-[state=checked]:bg-dakkho-success data-[state=unchecked]:bg-white/10"
              />
            </div>

            {/* Preview */}
            <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-4">
              <p className="text-xs text-muted-foreground mb-2">Preview</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                  style={{
                    background: (form.color || '#10B981') + '18',
                    color: form.color || '#10B981',
                  }}
                >
                  {form.icon || form.name?.charAt(0).toUpperCase() || <Tag className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{form.name || 'Subject Name'}</p>
                  <p className="text-xs text-muted-foreground font-mono">{form.slug || 'subject-slug'}</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              className="border-white/[0.08]"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gradient-primary text-white">
              {saving && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              )}
              {editSubject ? 'Update' : 'Create'} Subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Delete Confirmation AlertDialog ---- */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-[#1A1A2E] border-white/[0.08]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Subject</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete &ldquo;{deleteTarget?.name}&rdquo;? This action cannot
              be undone. Any courses associated with this subject may be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/[0.08] bg-transparent hover:bg-white/[0.04]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
