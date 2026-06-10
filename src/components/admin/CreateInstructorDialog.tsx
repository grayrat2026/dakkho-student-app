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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Copy, Check, RefreshCw, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiPost, apiGet, ApiError } from '@/lib/api-client';

interface CourseOption {
  $id: string;
  title: string;
}

interface CreateInstructorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

const DEPARTMENTS = [
  'Computer Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Business Administration',
  'Mathematics',
  'Physics',
  'Chemistry',
  'English',
  'Bangla',
  'Web Development',
  'Mobile Development',
  'Data Science',
  'Machine Learning',
  'Cybersecurity',
  'Graphic Design',
  'Digital Marketing',
  'Other',
];

function generateTempPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export default function CreateInstructorDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateInstructorDialogProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [courseSearch, setCourseSearch] = useState('');
  const [showCoursePicker, setShowCoursePicker] = useState(false);
  const [autoPassword, setAutoPassword] = useState(true);
  const [tempPassword, setTempPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{ instructorId: string; tempPassword: string } | null>(null);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    specialization: '',
    title: '',
    bio: '',
  });

  // Fetch courses for assignment
  useEffect(() => {
    if (open) {
      fetchCourses();
      const pwd = generateTempPassword();
      setTempPassword(pwd);
    } else {
      resetForm();
    }
  }, [open]);

  const fetchCourses = async () => {
    try {
      const data = (await apiGet('/courses?limit=100')) as Record<string, unknown>;
      setCourses(
        ((data.documents as Record<string, unknown>[]) || []).map((c) => ({
          $id: String(c.$id),
          title: String(c.title || 'Untitled'),
        }))
      );
    } catch {
      // Silently fail — course picker just won't have options
    }
  };

  const resetForm = () => {
    setForm({ fullName: '', email: '', phone: '', department: '', specialization: '', title: '', bio: '' });
    setSelectedCourseIds([]);
    setCourseSearch('');
    setShowCoursePicker(false);
    setAutoPassword(true);
    setTempPassword(generateTempPassword());
    setResult(null);
    setCopied(false);
  };

  const handleRegeneratePassword = () => {
    setTempPassword(generateTempPassword());
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  const handleSubmit = async () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      toast({ title: 'Validation Error', description: 'Full Name and Email are required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const password = autoPassword ? tempPassword : tempPassword;
      const payload = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
        department: form.department || undefined,
        specialization: form.specialization || undefined,
        title: form.title || undefined,
        bio: form.bio || undefined,
        password,
        courseIds: selectedCourseIds.length > 0 ? selectedCourseIds : undefined,
      };

      const response = (await apiPost('/users/create-instructor', payload)) as Record<string, unknown>;

      setResult({
        instructorId: String(response.instructorId || response.userId || response.$id || ''),
        tempPassword: password,
      });

      toast({ title: 'Success', description: 'Instructor account created successfully' });
      onCreated?.();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to create instructor';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(courseSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1A2E] border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-dakkho-teal" />
            Create Instructor Account
          </DialogTitle>
        </DialogHeader>

        {result ? (
          /* ─── Success Result ─── */
          <div className="space-y-4 mt-4">
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-sm font-medium text-emerald-400 mb-3">Instructor account created successfully!</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-white/5">
                  <div>
                    <p className="text-xs text-muted-foreground">Instructor ID</p>
                    <p className="text-sm font-mono">{result.instructorId}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleCopy(result.instructorId)}
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-white/5">
                  <div>
                    <p className="text-xs text-muted-foreground">Temporary Password</p>
                    <p className="text-sm font-mono">{result.tempPassword}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleCopy(result.tempPassword)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Share these credentials with the instructor. They will be required to change the password on first login.
              </p>
            </div>
            <Button
              onClick={() => {
                setResult(null);
                resetForm();
              }}
              variant="outline"
              className="w-full border-white/10"
            >
              Create Another Instructor
            </Button>
          </div>
        ) : (
          /* ─── Form ─── */
          <div className="space-y-4 mt-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="bg-white/5 border-white/10"
                placeholder="Dr. John Smith"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-white/5 border-white/10"
                placeholder="instructor@example.com"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="bg-white/5 border-white/10"
                placeholder="+880..."
              />
            </div>

            {/* Department/Technology */}
            <div className="space-y-2">
              <Label>Department / Technology</Label>
              <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Specialization */}
            <div className="space-y-2">
              <Label>Specialization</Label>
              <Input
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                className="bg-white/5 border-white/10"
                placeholder="e.g. React, Machine Learning, Data Structures"
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="bg-white/5 border-white/10"
                placeholder="e.g. Professor, Senior Lecturer"
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="bg-white/5 border-white/10"
                rows={3}
                placeholder="Brief instructor bio..."
              />
            </div>

            {/* Temporary Password */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Temporary Password</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="auto-password" className="text-xs text-muted-foreground">Auto-generate</Label>
                  <Switch
                    id="auto-password"
                    checked={autoPassword}
                    onCheckedChange={setAutoPassword}
                  />
                </div>
              </div>
              {autoPassword ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-2.5 rounded-md bg-white/5 border border-white/10 font-mono text-sm">
                    {tempPassword}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 flex-shrink-0"
                    onClick={handleRegeneratePassword}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 flex-shrink-0"
                    onClick={() => handleCopy(tempPassword)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Input
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="bg-white/5 border-white/10 font-mono"
                  placeholder="Enter a password"
                  type="text"
                />
              )}
            </div>

            {/* Assign Courses */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Assign Courses</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-dakkho-teal"
                  onClick={() => setShowCoursePicker(!showCoursePicker)}
                >
                  {showCoursePicker ? 'Hide' : 'Select Courses'} ({selectedCourseIds.length} selected)
                </Button>
              </div>

              {selectedCourseIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedCourseIds.map((id) => {
                    const course = courses.find((c) => c.$id === id);
                    return (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="bg-dakkho-teal/10 text-dakkho-teal cursor-pointer hover:bg-dakkho-teal/20"
                        onClick={() => toggleCourse(id)}
                      >
                        {course?.title || id.slice(0, 8)} &times;
                      </Badge>
                    );
                  })}
                </div>
              )}

              {showCoursePicker && (
                <div className="border border-white/10 rounded-lg p-2 max-h-48 overflow-y-auto bg-white/[0.02]">
                  <Input
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="bg-white/5 border-white/10 mb-2 h-8 text-sm"
                    placeholder="Search courses..."
                  />
                  {filteredCourses.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">No courses found</p>
                  ) : (
                    filteredCourses.map((course) => {
                      const isSelected = selectedCourseIds.includes(course.$id);
                      return (
                        <button
                          key={course.$id}
                          onClick={() => toggleCourse(course.$id)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between hover:bg-white/5 transition-colors ${
                            isSelected ? 'bg-dakkho-teal/10 text-dakkho-teal' : ''
                          }`}
                        >
                          <span className="truncate">{course.title}</span>
                          {isSelected && <Check className="h-4 w-4 flex-shrink-0 ml-2" />}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

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
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 gradient-primary text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" /> Create Instructor
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
