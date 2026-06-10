'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, BookOpen, X, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiDelete, ApiError } from '@/lib/api-client';

interface CourseOption {
  $id: string;
  title: string;
  instructorId?: string;
}

interface AssignCoursesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  instructorName: string;
  onAssigned?: () => void;
}

export default function AssignCoursesDialog({
  open,
  onOpenChange,
  instructorId,
  instructorName,
  onAssigned,
}: AssignCoursesDialogProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [originalAssignedIds, setOriginalAssignedIds] = useState<Set<string>>(new Set());
  const [courseSearch, setCourseSearch] = useState('');

  useEffect(() => {
    if (open && instructorId) {
      fetchData();
    }
  }, [open, instructorId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all courses
      const data = (await apiGet('/courses?limit=200')) as Record<string, unknown>;
      const allCourses = ((data.documents as Record<string, unknown>[]) || []).map((c) => ({
        $id: String(c.$id),
        title: String(c.title || 'Untitled'),
        instructorId: c.instructorId ? String(c.instructorId) : undefined,
      }));
      setCourses(allCourses);

      // Determine currently assigned courses
      const assigned = new Set<string>();
      allCourses.forEach((c) => {
        if (c.instructorId === instructorId) {
          assigned.add(c.$id);
        }
      });
      setAssignedIds(assigned);
      setOriginalAssignedIds(new Set(assigned));
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch courses', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleCourse = (courseId: string) => {
    setAssignedIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Determine courses to add and remove
      const toAdd = [...assignedIds].filter((id) => !originalAssignedIds.has(id));
      const toRemove = [...originalAssignedIds].filter((id) => !assignedIds.has(id));

      // Add new assignments
      for (const courseId of toAdd) {
        try {
          await apiPost(`/instructors/${instructorId}/assign-course`, { courseId });
        } catch (error) {
          const message = error instanceof ApiError ? error.message : 'Failed to assign course';
          console.error(`Failed to assign course ${courseId}:`, message);
        }
      }

      // Remove assignments
      for (const courseId of toRemove) {
        try {
          await apiDelete(`/instructors/${instructorId}/assign-course/${courseId}`);
        } catch (error) {
          const message = error instanceof ApiError ? error.message : 'Failed to unassign course';
          console.error(`Failed to unassign course ${courseId}:`, message);
        }
      }

      const totalChanges = toAdd.length + toRemove.length;
      if (totalChanges > 0) {
        toast({
          title: 'Success',
          description: `${toAdd.length} course(s) assigned, ${toRemove.length} course(s) unassigned`,
        });
      } else {
        toast({ title: 'No Changes', description: 'No course assignments were changed' });
      }

      onAssigned?.();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to update course assignments';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const assignedCourses = courses.filter((c) => assignedIds.has(c.$id));
  const availableCourses = filteredCourses.filter((c) => !assignedIds.has(c.$id));
  const hasChanges =
    assignedIds.size !== originalAssignedIds.size ||
    [...assignedIds].some((id) => !originalAssignedIds.has(id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1A2E] border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-dakkho-teal" />
            Assign Courses — {instructorName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Currently Assigned */}
              {assignedCourses.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Assigned Courses ({assignedCourses.length})
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {assignedCourses.map((course) => (
                      <Badge
                        key={course.$id}
                        variant="secondary"
                        className="bg-dakkho-teal/10 text-dakkho-teal cursor-pointer hover:bg-red-500/20 hover:text-red-400 transition-colors pr-1"
                      >
                        {course.title}
                        <button
                          onClick={() => toggleCourse(course.$id)}
                          className="ml-1.5 hover:bg-white/10 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Search available courses */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Available Courses</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="pl-9 bg-white/5 border-white/10 h-9 text-sm"
                    placeholder="Search courses to assign..."
                  />
                </div>
              </div>

              {/* Course list */}
              <div className="border border-white/10 rounded-lg max-h-56 overflow-y-auto">
                {availableCourses.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    {courseSearch ? 'No matching courses found' : 'All courses already assigned'}
                  </p>
                ) : (
                  availableCourses.map((course) => (
                    <button
                      key={course.$id}
                      onClick={() => toggleCourse(course.$id)}
                      className="w-full text-left px-3 py-2.5 text-sm flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/[0.04] last:border-b-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <BookOpen className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{course.title}</span>
                      </div>
                      <span className="text-xs text-dakkho-teal flex-shrink-0 ml-2">+ Assign</span>
                    </button>
                  ))
                )}
              </div>

              {/* Change summary */}
              {hasChanges && (
                <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-400">
                    You have unsaved changes. Make sure to click &quot;Save Changes&quot; to apply.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 border-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  className="flex-1 gradient-primary text-white"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
