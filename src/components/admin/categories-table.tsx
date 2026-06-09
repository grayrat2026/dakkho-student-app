'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  RefreshCw,
  Plus,
  MoreVertical,
  Trash2,
  Edit,
  Layers,
  AlertCircle,
  Tag,
  ChevronRight,
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
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete, ApiError } from '@/lib/api-client';
import type { Category } from '@/lib/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Predefined color palette
const PREDEFINED_COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
  '#84CC16', '#A855F7', '#E11D48', '#0EA5E9', '#D946EF',
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function CategoriesTable() {
  const { toast } = useToast();

  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '',
    slug: '',
    icon: '',
    color: '#10B981',
    parentId: '',
    order: 0,
  });

  // ---- Fetch categories ----
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet('/categories?limit=100') as Record<string, unknown>;
      const docs = (data.documents ?? data.data ?? []) as Category[];
      setCategories(docs);
      setTotal((data.total as number) || docs.length);
    } catch {
      setError('Failed to load categories');
      toast({ title: 'Error', description: 'Failed to fetch categories', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // ---- Dialog helpers ----
  const openCreateDialog = () => {
    setEditCategory(null);
    setForm({
      name: '', slug: '', icon: '', color: '#10B981', parentId: '', order: 0,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (cat: Category) => {
    setEditCategory(cat);
    setForm({
      name: cat.name || '',
      slug: cat.slug || '',
      icon: cat.icon || '',
      color: cat.color || '#10B981',
      parentId: cat.parentId || '',
      order: cat.order ?? 0,
    });
    setDialogOpen(true);
  };

  // ---- Save ----
  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Validation', description: 'Name is required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const slug = form.slug || slugify(form.name);
      const payload = {
        name: form.name,
        slug,
        icon: form.icon || undefined,
        color: form.color || undefined,
        parentId: form.parentId || undefined,
        order: form.order,
      };

      if (editCategory) {
        await apiPut('/categories', { categoryId: editCategory.id, ...payload });
      } else {
        await apiPost('/categories', payload);
      }
      toast({ title: 'Success', description: `Category ${editCategory ? 'updated' : 'created'}` });
      setDialogOpen(false);
      fetchCategories();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Network error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ---- Delete ----
  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await apiDelete(`/categories?id=${id}`);
      toast({ title: 'Deleted', description: 'Category removed' });
      fetchCategories();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete category', variant: 'destructive' });
    }
  };

  // ---- Parent name lookup ----
  const getParentName = (parentId: string) => {
    const parent = categories.find((c) => c.id === parentId);
    return parent?.name || parentId;
  };

  // ---- Animation variants ----
  const rowVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.03, duration: 0.3 },
    }),
    exit: { opacity: 0, transition: { duration: 0.15 } },
  };

  // ---- Top-level categories for parent select ----
  const topLevelCategories = categories.filter((c) => !c.parentId);

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
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Layers className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Categories</h2>
            <p className="text-sm text-muted-foreground">{total} total categories</p>
          </div>
        </div>
        <Button onClick={openCreateDialog} className="gradient-primary text-white self-start sm:self-auto">
          <Plus className="h-4 w-4 mr-2" /> Add Category
        </Button>
      </div>

      {/* ===== Filters ===== */}
      <Card className="glass-card border-0">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={fetchCategories} className="border-white/[0.08]">
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
              <Button variant="outline" onClick={fetchCategories} className="border-white/[0.08]">
                <RefreshCw className="h-4 w-4 mr-2" /> Retry
              </Button>
            </div>
          )}

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.06] hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Icon</TableHead>
                  <TableHead className="text-muted-foreground">Name</TableHead>
                  <TableHead className="text-muted-foreground">Slug</TableHead>
                  <TableHead className="text-muted-foreground">Color</TableHead>
                  <TableHead className="text-muted-foreground">Courses</TableHead>
                  <TableHead className="text-muted-foreground">Order</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-white/[0.06]">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full max-w-[100px] bg-white/5" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : categories.length === 0 && !error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <Layers className="h-10 w-10 text-muted-foreground/30" />
                        <p className="text-muted-foreground">No categories found</p>
                        <Button variant="outline" size="sm" onClick={openCreateDialog} className="border-white/[0.08]">
                          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add your first category
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {categories.map((cat) => (
                      <tr
                        key={cat.id}
                        className="border-white/[0.06] hover:bg-white/[0.03] transition-colors"
                      >
                        {/* Icon */}
                        <TableCell>
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-base"
                            style={{
                              background: (cat.color || '#10B981') + '18',
                              color: cat.color || '#10B981',
                            }}
                          >
                            {cat.icon || cat.name?.charAt(0).toUpperCase() || <Tag className="h-4 w-4" />}
                          </div>
                        </TableCell>
                        {/* Name */}
                        <TableCell className="font-medium">
                          <div>
                            <span className="truncate max-w-[200px] block">{cat.name || 'Unnamed'}</span>
                            {cat.parentId && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                                <span className="text-xs text-muted-foreground">{getParentName(cat.parentId)}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        {/* Slug */}
                        <TableCell className="text-sm text-muted-foreground font-mono">
                          {cat.slug || '—'}
                        </TableCell>
                        {/* Color */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-4 h-4 rounded-full border border-white/10 flex-shrink-0"
                              style={{ backgroundColor: cat.color || '#10B981' }}
                            />
                            <span className="text-xs text-muted-foreground font-mono">{cat.color || '—'}</span>
                          </div>
                        </TableCell>
                        {/* Course Count */}
                        <TableCell className="text-sm">
                          {cat.courseCount != null ? (
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 text-xs">
                              {cat.courseCount} courses
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground/40 text-xs">—</span>
                          )}
                        </TableCell>
                        {/* Order */}
                        <TableCell className="text-sm">{cat.order ?? 0}</TableCell>
                        {/* Actions */}
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#1A1A2E] border-white/10">
                              <DropdownMenuItem onClick={() => openEditDialog(cat)}>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteCategory(cat.id)} className="text-destructive">
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
                <Skeleton key={i} className="h-20 rounded-lg bg-white/5" />
              ))
            ) : categories.length === 0 && !error ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <Layers className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-muted-foreground">No categories found</p>
              </div>
            ) : (
              <AnimatePresence>
                {categories.map((cat, i) => (
                  <motion.div
                    key={cat.id}
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
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                            style={{
                              background: (cat.color || '#10B981') + '18',
                              color: cat.color || '#10B981',
                            }}
                          >
                            {cat.icon || cat.name?.charAt(0).toUpperCase() || <Tag className="h-3.5 w-3.5" />}
                          </div>
                          <p className="text-sm font-medium truncate">{cat.name || 'Unnamed'}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">{cat.slug || '—'}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span
                            className="w-3 h-3 rounded-full border border-white/10"
                            style={{ backgroundColor: cat.color || '#10B981' }}
                          />
                          {cat.courseCount != null && (
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 text-[10px]">
                              {cat.courseCount} courses
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">#{cat.order ?? 0}</span>
                        </div>
                        {cat.parentId && (
                          <div className="flex items-center gap-1 mt-1">
                            <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                            <span className="text-xs text-muted-foreground">{getParentName(cat.parentId)}</span>
                          </div>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1A1A2E] border-white/10">
                          <DropdownMenuItem onClick={() => openEditDialog(cat)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteCategory(cat.id)} className="text-destructive">
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
        </CardContent>
      </Card>

      {/* ===== Add/Edit Dialog ===== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1A1A2E] border-white/[0.08] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-amber-400" />
              {editCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Name */}
            <div className="space-y-2">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    name,
                    slug: f.slug || slugify(name),
                  }));
                }}
                placeholder="Category name"
                className="bg-white/[0.04] border-white/[0.08]"
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="auto-generated-from-name"
                className="bg-white/[0.04] border-white/[0.08] font-mono text-sm"
              />
            </div>

            {/* Icon + Color */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icon</Label>
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
                <Label>Color</Label>
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

            {/* Parent Category */}
            <div className="space-y-2">
              <Label>Parent Category</Label>
              <Select
                value={form.parentId || '_none'}
                onValueChange={(v) => setForm((f) => ({ ...f, parentId: v === '_none' ? '' : v }))}
              >
                <SelectTrigger className="w-full bg-white/[0.04] border-white/[0.08]">
                  <SelectValue placeholder="No parent (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">No parent (top-level)</SelectItem>
                  {topLevelCategories
                    .filter((c) => c.id !== editCategory?.id)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Order */}
            <div className="space-y-2">
              <Label>Order</Label>
              <Input
                type="number"
                value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                className="bg-white/[0.04] border-white/[0.08]"
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
                  <p className="text-sm font-medium">{form.name || 'Category Name'}</p>
                  <p className="text-xs text-muted-foreground font-mono">{form.slug || 'category-slug'}</p>
                </div>
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
              {editCategory ? 'Update' : 'Create'} Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
