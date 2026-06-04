'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, Bell, Users, Building2, User, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, ApiError } from '@/lib/api-client';

interface NotifHistoryItem {
  id: string;
  title: string;
  message: string;
  type: string;
  targetType: string;
  targetId: string;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  source: string;
  userId?: string;
  read?: boolean;
}

export default function NotificationsPanel() {
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'info',
    targetAll: false,
    targetUserId: '',
    targetInstitute: '',
    actionUrl: '',
  });
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<NotifHistoryItem[]>([]);
  const [totalHistory, setTotalHistory] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { toast } = useToast();

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const data = await apiGet('/notifications?limit=50') as Record<string, unknown>;
      setHistory((data.documents as NotifHistoryItem[]) || []);
      setTotalHistory(Number(data.total) || 0);
    } catch {
      toast({ title: 'Error loading history', variant: 'destructive' });
    } finally {
      setLoadingHistory(false);
    }
  }, [toast]);

  // Auto-load history on mount
  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleSend = async () => {
    if (!form.title || !form.message) {
      toast({ title: 'Error', description: 'Title and message are required', variant: 'destructive' });
      return;
    }
    if (!form.targetAll && !form.targetUserId && !form.targetInstitute) {
      toast({ title: 'Error', description: 'Select a target audience', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const data = await apiPost('/notifications', form) as Record<string, unknown>;
      const count = Number(data.count) || 0;
      const logged = data.logged;

      if (count === 0 && form.targetAll) {
        toast({
          title: 'Notification Logged',
          description: 'No Appwrite users found yet, but the notification has been logged to history. It will be delivered when users register.',
        });
      } else {
        toast({ title: 'Success', description: `Sent ${count} notification(s)` });
      }

      setForm({ title: '', message: '', type: 'info', targetAll: false, targetUserId: '', targetInstitute: '', actionUrl: '' });
      // Refresh history
      fetchHistory();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Network error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const typeColors: Record<string, string> = {
    info: 'bg-blue-500/10 text-blue-400',
    success: 'bg-green-500/10 text-green-400',
    warning: 'bg-amber-500/10 text-amber-400',
    error: 'bg-red-500/10 text-red-400',
    announcement: 'bg-purple-500/10 text-purple-400',
    'course-update': 'bg-cyan-500/10 text-cyan-400',
  };

  const targetLabels: Record<string, string> = {
    all: 'All Users',
    user: 'Specific User',
    institute: 'Institute',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Tabs defaultValue="send" className="space-y-4">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="send" className="data-[state=active]:bg-dakkho-blue/20 data-[state=active]:text-dakkho-blue">
            <Send className="h-4 w-4 mr-2" /> Send
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-dakkho-blue/20 data-[state=active]:text-dakkho-blue">
            <Bell className="h-4 w-4 mr-2" /> History ({totalHistory})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send">
          <Card className="glass-card border-0">
            <CardHeader><CardTitle className="text-lg">Send In-App Notification</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-white/5 border-white/10" placeholder="Notification title" />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="course-update">Course Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="bg-white/5 border-white/10" rows={4} placeholder="Notification message..." />
              </div>
              <div className="space-y-2">
                <Label>Action URL (optional)</Label>
                <Input value={form.actionUrl} onChange={(e) => setForm({ ...form, actionUrl: e.target.value })} className="bg-white/5 border-white/10" placeholder="https://..." />
              </div>

              <div className="border-t border-white/[0.06] pt-4">
                <p className="text-sm font-medium mb-3">Target Audience</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03]">
                    <div className="flex items-center gap-2"><Users className="h-4 w-4 text-dakkho-teal" /><span className="text-sm">All Users</span></div>
                    <Switch checked={form.targetAll} onCheckedChange={(v) => setForm({ ...form, targetAll: v, targetUserId: '', targetInstitute: '' })} />
                  </div>
                  {!form.targetAll && (
                    <>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><User className="h-3.5 w-3.5" /> Specific User ID</Label>
                        <Input value={form.targetUserId} onChange={(e) => setForm({ ...form, targetUserId: e.target.value, targetInstitute: '' })} className="bg-white/5 border-white/10" placeholder="User ID" />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5" /> Institute</Label>
                        <Input value={form.targetInstitute} onChange={(e) => setForm({ ...form, targetInstitute: e.target.value, targetUserId: '' })} className="bg-white/5 border-white/10" placeholder="Institute ID" />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Button onClick={handleSend} disabled={sending} className="w-full gradient-primary text-white">
                {sending ? 'Sending...' : <><Send className="h-4 w-4 mr-2" /> Send Notification</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="glass-card border-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Notification History</CardTitle>
              <Button variant="ghost" size="sm" onClick={fetchHistory} disabled={loadingHistory}>
                <RefreshCw className={`h-4 w-4 ${loadingHistory ? 'animate-spin' : ''}`} />
              </Button>
            </CardHeader>
            <CardContent>
              {loadingHistory && history.length === 0 ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />)}</div>
              ) : history.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No notifications sent yet.</p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {history.map((notif) => (
                    <div key={notif.id} className="p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{notif.title || 'No Title'}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={typeColors[notif.type] || typeColors.info}>
                            {notif.type || 'info'}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-white/10">
                            {targetLabels[notif.targetType] || notif.targetType || '—'}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{notif.message || ''}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">
                          {notif.sentCount > 0 ? `${notif.sentCount} delivered` : 'Logged'} {notif.targetId && notif.targetId !== 'all' ? `→ ${notif.targetId.slice(0, 8)}...` : ''}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
