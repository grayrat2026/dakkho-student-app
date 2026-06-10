'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Camera, Loader2, Save, Phone, BookOpen, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { instructorApi, type InstructorProfile as ProfileData } from '@/lib/instructor-api-client';

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await instructorApi.getProfile();
      if (data.profile) {
        const p = data.profile;
        setProfile(p);
        setName(p.name || '');
        setBio(p.bio || '');
        setSpecialization(p.specialization || '');
        setTitle(p.title || '');
        setPhone(p.phone || '');
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const data = await instructorApi.updateProfile({ name, bio, specialization, title, phone });
      if (data.success) {
        setProfile(data.profile);
        setMessage({ type: 'success', text: 'Profile updated successfully' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update profile' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setMessage(null);
    try {
      const data = await instructorApi.uploadAvatar(file);
      if (data.success && data.avatar_url) {
        setProfile(prev => prev ? { ...prev, avatarUrl: data.avatar_url, avatar: data.avatar_url } : null);
        setMessage({ type: 'success', text: 'Avatar updated successfully' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to upload avatar' });
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
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
        Profile
      </h2>

      {message && (
        <div className={`p-3 rounded-lg text-sm border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Avatar Card */}
      <Card className="shadow-sm border border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
            <User className="h-5 w-5 text-emerald-600" /> Avatar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                {(profile?.avatarUrl || profile?.avatar) ? (
                  <img src={profile.avatarUrl || profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-gray-400" />
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center cursor-pointer shadow-lg hover:bg-emerald-700 transition-colors">
                <Camera className="h-4 w-4 text-white" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
            <div>
              <p className="font-bold text-gray-900">{profile?.name || 'Instructor'}</p>
              <p className="text-sm text-gray-500">{profile?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card className="shadow-sm border border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
            <BookOpen className="h-5 w-5 text-emerald-600" /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-700 text-sm font-semibold">Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-white border-gray-200" placeholder="Your full name" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 text-sm font-semibold">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-white border-gray-200" placeholder="e.g. Senior Instructor" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-700 text-sm font-semibold flex items-center gap-1"><Award className="h-3.5 w-3.5" /> Specialization</Label>
              <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} className="bg-white border-gray-200" placeholder="e.g. Web Development" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 text-sm font-semibold flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-white border-gray-200" placeholder="+880..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-700 text-sm font-semibold">Bio</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="bg-white border-gray-200 min-h-[100px]"
              placeholder="Tell students about yourself..."
            />
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
