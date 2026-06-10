"use client";

import { useState } from "react";
import { useStudentStore } from "@/lib/store";
import { apiPut, apiUpload } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Camera, Loader2, Save } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface EditProfilePageProps {
  onNavigate: (page: string) => void;
}

export default function EditProfilePage({ onNavigate }: EditProfilePageProps) {
  const { studentUser, setStudentUser } = useStudentStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    fullName: studentUser?.name || "",
    phone: studentUser?.phone || "",
    institute: studentUser?.institute || "",
    technology: studentUser?.technology || "",
    semester: studentUser?.semester || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await apiPut("/profile", form);
      // Worker returns { profile: updatedDoc } - update local user state
      const updatedProfile = data.profile || data.user;
      if (updatedProfile) {
        setStudentUser({
          ...studentUser!,
          name: updatedProfile.fullName || updatedProfile.name || studentUser?.name,
          phone: updatedProfile.phone || form.phone,
          institute: updatedProfile.institute || form.institute,
          technology: updatedProfile.technology || form.technology,
          semester: updatedProfile.semester || form.semester,
          avatarUrl: updatedProfile.avatarUrl || updatedProfile.avatar_url || studentUser?.avatarUrl,
        });
      } else {
        // Fallback: update local state with form data
        setStudentUser({
          ...studentUser!,
          name: form.fullName,
          phone: form.phone,
          institute: form.institute,
          technology: form.technology,
          semester: form.semester,
        });
      }
      toast.success("Profile updated successfully");
      onNavigate("profile");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await apiUpload("/profile/avatar", formData);
      if (data.avatarUrl) {
        setStudentUser({ ...studentUser!, avatarUrl: data.avatarUrl });
      }
      toast.success("Avatar updated");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload avatar";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 space-y-4 max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate("profile")}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="text-lg font-semibold text-white">Edit Profile</h1>
      </div>

      {/* Avatar Upload */}
      <Card className="glass-card border-0">
        <CardContent className="p-6 flex flex-col items-center gap-4">
          <div className="relative group">
            <Avatar className="h-24 w-24 ring-4 ring-white/10">
              <AvatarImage src={studentUser?.avatarUrl} />
              <AvatarFallback className="gradient-primary text-white text-2xl">
                {studentUser?.name ? getInitials(studentUser.name) : "S"}
              </AvatarFallback>
            </Avatar>
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="h-6 w-6 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Tap to change avatar</p>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <form onSubmit={handleSubmit}>
        <Card className="glass-card border-0">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm text-muted-foreground">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm text-muted-foreground">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="01XXXXXXXXX"
                className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="institute" className="text-sm text-muted-foreground">Institute</Label>
              <Input
                id="institute"
                name="institute"
                value={form.institute}
                onChange={handleChange}
                placeholder="Your institute name"
                className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="technology" className="text-sm text-muted-foreground">Technology</Label>
                <Input
                  id="technology"
                  name="technology"
                  value={form.technology}
                  onChange={handleChange}
                  placeholder="e.g. CSE"
                  className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester" className="text-sm text-muted-foreground">Semester</Label>
                <Input
                  id="semester"
                  name="semester"
                  value={form.semester}
                  onChange={handleChange}
                  placeholder="e.g. 5th"
                  className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary text-white font-medium h-11 hover:opacity-90 transition-opacity"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </motion.div>
  );
}
