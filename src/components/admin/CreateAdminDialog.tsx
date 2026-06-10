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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Copy, Check, RefreshCw, ShieldPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiPost, ApiError } from '@/lib/api-client';

interface CreateAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

function generateTempPassword(length = 14): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export default function CreateAdminDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateAdminDialogProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [autoPassword, setAutoPassword] = useState(true);
  const [tempPassword, setTempPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{ adminId: string; tempPassword: string } | null>(null);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
  });

  useEffect(() => {
    if (open) {
      setTempPassword(generateTempPassword());
    } else {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setForm({ fullName: '', email: '' });
    setAutoPassword(true);
    setTempPassword(generateTempPassword());
    setResult(null);
    setCopied(false);
  };

  const handleRegeneratePassword = () => {
    setTempPassword(generateTempPassword());
  };

  const handleSubmit = async () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      toast({ title: 'Validation Error', description: 'Full Name and Email are required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const password = tempPassword;
      const payload = {
        fullName: form.fullName,
        email: form.email,
        password,
      };

      const response = (await apiPost('/users/create-admin', payload)) as Record<string, unknown>;

      setResult({
        adminId: String(response.adminId || response.userId || response.$id || ''),
        tempPassword: password,
      });

      toast({ title: 'Success', description: 'Admin account created successfully' });
      onCreated?.();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to create admin';
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1A2E] border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldPlus className="h-5 w-5 text-red-400" />
            Create Admin Account
          </DialogTitle>
        </DialogHeader>

        {result ? (
          /* ─── Success Result ─── */
          <div className="space-y-4 mt-4">
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-sm font-medium text-emerald-400 mb-3">Admin account created successfully!</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-white/5">
                  <div>
                    <p className="text-xs text-muted-foreground">Admin ID</p>
                    <p className="text-sm font-mono">{result.adminId}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleCopy(result.adminId)}
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
                Share these credentials with the new admin. They should change the password immediately after first login.
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
              Create Another Admin
            </Button>
          </div>
        ) : (
          /* ─── Form ─── */
          <div className="space-y-4 mt-4">
            {/* Warning */}
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-400">
                <Badge variant="secondary" className="bg-red-500/10 text-red-400 mr-1.5 text-[10px]">Super Admin</Badge>
                This action creates a new administrator with full platform access. Proceed with caution.
              </p>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="bg-white/5 border-white/10"
                placeholder="Admin Name"
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
                placeholder="admin@example.com"
              />
            </div>

            {/* Temporary Password */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Temporary Password</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="admin-auto-password" className="text-xs text-muted-foreground">Auto-generate</Label>
                  <Switch
                    id="admin-auto-password"
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
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    <ShieldPlus className="h-4 w-4 mr-2" /> Create Admin
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
