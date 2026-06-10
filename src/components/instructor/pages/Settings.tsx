'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, KeyRound, Shield, Loader2, Mail, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useUnifiedAuth } from '@/lib/unified-auth';
import { instructorApi } from '@/lib/instructor-api-client';

export default function Settings() {
  const { user } = useUnifiedAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'All password fields are required' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const data = await instructorApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      if (data.success) {
        setMessage({ type: 'success', text: 'Password changed successfully' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: 'Failed to change password' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
          Settings
        </h2>
        <p className="text-sm text-gray-500 mt-1">Manage your account settings</p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Account Info */}
      <Card className="shadow-sm border border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
            <Shield className="h-5 w-5 text-emerald-600" /> Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-500 text-xs font-semibold">Email</Label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-900">{user?.email || 'N/A'}</span>
              </div>
            </div>
            <div>
              <Label className="text-gray-500 text-xs font-semibold">Role</Label>
              <div className="flex items-center gap-2 mt-1">
                <Shield className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-gray-900 font-medium">Instructor</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="shadow-sm border border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
            <KeyRound className="h-5 w-5 text-emerald-600" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-700 text-sm font-semibold">Current Password</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="bg-white border-gray-200"
              placeholder="Enter current password"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-700 text-sm font-semibold">New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-white border-gray-200"
                placeholder="Min. 8 characters"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 text-sm font-semibold">Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-white border-gray-200"
                placeholder="Repeat new password"
              />
            </div>
          </div>
          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-red-500">Passwords do not match</p>
          )}
          <Button onClick={handleChangePassword} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />}
            Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="shadow-sm border border-red-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base text-red-600" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Account deletion is not available from the instructor portal. Please contact the administrator if you need your account removed.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
