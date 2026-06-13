'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Search, Filter, RefreshCw, Send, CheckCircle,
  Clock, AlertCircle, ChevronRight, Loader2, Settings, X,
  Mail, Phone, Plus, Trash2, Eye, ArrowUpDown, Paperclip,
} from 'lucide-react';
import { apiGet, apiPost, apiPut, apiUpload, getAuthToken } from '@/lib/api-client';

// ─── Types (camelCase — API client auto-transforms snake_case → camelCase) ───
interface Ticket {
  id: number;
  ticketId: string;
  userId: string | null;
  name: string | null;
  email: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  description: string | null;
  resolvedContent: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: number;
  ticketId: string;
  senderType: string;
  senderId: string | null;
  senderName: string | null;
  message: string;
  attachments: string;
  source: string;
  createdAt: string;
}

interface Stats {
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  total: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dakkho-admin-api.dakkho-admin.workers.dev';
const AUTH_TOKEN_KEY = 'dakkho_admin_token';

const statusColors: Record<string, string> = {
  open: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  closed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const statusLabel: Record<string, string> = {
  open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed',
};

const priorityColors: Record<string, string> = {
  low: 'text-emerald-400', normal: 'text-sky-400', high: 'text-orange-400', urgent: 'text-red-400', medium: 'text-sky-400',
};

/** Safely parse a date that might be "2026-06-09 20:40:11" (SQLite) or ISO */
function parseDate(d: string | null | undefined): Date | null {
  if (!d) return null;
  try {
    // SQLite datetime format: "YYYY-MM-DD HH:mm:ss" — replace space with T for JS parsing
    const iso = d.includes(' ') && !d.includes('T') ? d.replace(' ', 'T') : d;
    const parsed = new Date(iso);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

function formatDate(d: string | null | undefined): string {
  const date = parseDate(d);
  if (!date) return '—';
  return date.toLocaleDateString();
}

function formatTime(d: string | null | undefined): string {
  const date = parseDate(d);
  if (!date) return '';
  return date.toLocaleTimeString();
}

function formatDateTime(d: string | null | undefined): string {
  const date = parseDate(d);
  if (!date) return '—';
  return date.toLocaleString();
}

// ─── Ticket Detail Panel ───
function TicketDetailPanel({ ticket, onBack, onRefresh }: { ticket: Ticket; onBack: () => void; onRefresh: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [resolveText, setResolveText] = useState('');
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const data = await apiGet(`/support/tickets/${ticket.ticketId}`) as any;
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  }, [ticket.ticketId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const handleReply = async () => {
    if (!replyText.trim() && replyFiles.length === 0) return;
    setSending(true);
    try {
      if (replyFiles.length > 0) {
        // Use multipart form for file attachments
        const formData = new FormData();
        formData.append('message', replyText);
        replyFiles.forEach(f => formData.append('files', f));
        await apiUpload(`/support/tickets/${ticket.ticketId}/reply`, formData);
      } else {
        await apiPost(`/support/tickets/${ticket.ticketId}/reply`, { message: replyText });
      }
      setReplyText('');
      setReplyFiles([]);
      await fetchMessages();
      onRefresh();
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    if (!resolveText.trim()) return;
    setResolving(true);
    try {
      await apiPut(`/support/tickets/${ticket.ticketId}/resolve`, { resolvedContent: resolveText });
      setShowResolve(false);
      setResolveText('');
      await fetchMessages();
      onRefresh();
    } catch (error) {
      console.error('Failed to resolve ticket:', error);
    } finally {
      setResolving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatusUpdating(true);
    try {
      await apiPut(`/support/tickets/${ticket.ticketId}/status`, { status: newStatus });
      await fetchMessages();
      onRefresh();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
          <ChevronRight className="w-5 h-5 rotate-180" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-white truncate">{ticket.subject}</h2>
          <p className="text-xs text-slate-400">{ticket.ticketId} · {ticket.category} · <span className={priorityColors[ticket.priority] || 'text-sky-400'}>{ticket.priority.toUpperCase()}</span></p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-bold border ${statusColors[ticket.status] || statusColors.open}`}>
          {statusLabel[ticket.status] || ticket.status}
        </span>
      </div>

      {/* Ticket Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white/[0.03] rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">From</p>
          <p className="text-sm text-white font-medium truncate">{ticket.name || ticket.email}</p>
          <p className="text-[10px] text-slate-400 truncate">{ticket.email}</p>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Created</p>
          <p className="text-sm text-white font-medium">{formatDate(ticket.createdAt)}</p>
          <p className="text-[10px] text-slate-400">{formatTime(ticket.createdAt)}</p>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Category</p>
          <p className="text-sm text-white font-medium">{ticket.category}</p>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Actions</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
              <button onClick={() => setShowResolve(!showResolve)} className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">
                Resolve
              </button>
            )}
            {ticket.status !== 'closed' && (
              <button onClick={() => handleStatusChange('closed')} disabled={statusUpdating} className="text-[10px] px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 hover:bg-slate-500/20">
                Close
              </button>
            )}
            {ticket.status === 'closed' && (
              <button onClick={() => handleStatusChange('open')} disabled={statusUpdating} className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
                Reopen
              </button>
            )}
            {ticket.status === 'open' && (
              <button onClick={() => handleStatusChange('in_progress')} disabled={statusUpdating} className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20">
                In Progress
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resolution Banner */}
      {(ticket.status === 'resolved' || ticket.status === 'closed') && ticket.resolvedContent && (
        <div className="mb-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-emerald-400">Resolved</h4>
              <p className="text-xs text-slate-300 mt-1">{ticket.resolvedContent}</p>
              <p className="text-[10px] text-slate-400 mt-1">By: {ticket.resolvedBy || 'Admin'} · {formatDateTime(ticket.resolvedAt)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Form */}
      <AnimatePresence>
        {showResolve && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
              <h4 className="text-sm font-bold text-emerald-400 mb-2">Resolve Ticket</h4>
              <textarea
                value={resolveText}
                onChange={(e) => setResolveText(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                placeholder="Describe how the issue was resolved..."
              />
              <div className="flex gap-2 mt-2">
                <button onClick={handleResolve} disabled={resolving || !resolveText.trim()} className="px-4 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/30 disabled:opacity-50">
                  {resolving ? <Loader2 className="w-3 h-3 animate-spin inline" /> : <CheckCircle className="w-3 h-3 inline" />} Resolve
                </button>
                <button onClick={() => setShowResolve(false)} className="px-4 py-1.5 rounded-lg bg-white/5 text-slate-400 text-xs font-bold hover:bg-white/10">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="bg-white/[0.03] rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conversation</h3>
          <button onClick={fetchMessages} className="p-1.5 rounded-lg hover:bg-white/5"><RefreshCw className="w-3.5 h-3.5 text-slate-500" /></button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[40vh] overflow-y-auto custom-scrollbar pr-1">
            {messages.map((msg) => {
              const isUser = msg.senderType === 'user';
              const isSystem = msg.senderType === 'system';
              let attachments: string[] = [];
              try { attachments = JSON.parse(msg.attachments || '[]'); } catch {}

              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                    isUser ? 'bg-blue-500/10 text-white rounded-br-sm' :
                    isSystem ? 'bg-amber-500/10 text-white rounded-bl-sm' :
                    'bg-white/[0.06] text-white rounded-bl-sm'
                  }`}>
                    {!isUser && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold text-blue-400">{msg.senderName || msg.senderType}</span>
                        {msg.source === 'telegram' && <span className="text-[8px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full">Telegram</span>}
                        {msg.source === 'admin' && <span className="text-[8px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full">Admin</span>}
                        {msg.source === 'email' && <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full">Email</span>}
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    {attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {attachments.map((att, i) => (
                          <a key={i} href={`${API_BASE}/admin/support/attachment-url?key=${encodeURIComponent(att)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">
                            <Paperclip className="w-3 h-3" /><span className="truncate">{att.split('/').pop()?.replace(/^\d+-/, '') || `Attachment ${i + 1}`}</span>
                          </a>
                        ))}
                      </div>
                    )}
                    <p className="text-[9px] text-slate-500 mt-1 text-right">{formatDateTime(msg.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reply Box */}
      {ticket.status !== 'closed' && (
        <div className="bg-white/[0.03] rounded-xl p-4">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg bg-black/30 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            placeholder="Type your reply..."
          />
          {/* File attachments */}
          <div className="flex items-center gap-2 mt-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setReplyFiles(prev => [...prev, ...files].slice(0, 5));
                e.target.value = '';
              }}
            />
            <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="Attach files">
              <Paperclip className="w-4 h-4" />
            </button>
            {replyFiles.length > 0 && (
              <div className="flex flex-wrap gap-1 flex-1">
                {replyFiles.map((f, i) => (
                  <span key={i} className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded-lg flex items-center gap-1">
                    <Paperclip className="w-2.5 h-2.5" />
                    <span className="truncate max-w-[100px]">{f.name}</span>
                    <button onClick={() => setReplyFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end mt-2">
            <button
              onClick={handleReply}
              disabled={sending || (!replyText.trim() && replyFiles.length === 0)}
              className="px-5 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-sm font-bold hover:bg-blue-500/30 disabled:opacity-50 flex items-center gap-2"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Settings Panel ───
function SettingsPanel({ onBack }: { onBack: () => void }) {
  const [config, setConfig] = useState({ telegramChatIds: [''], supportEmail: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet('/support/config') as any;
        setConfig({
          telegramChatIds: data.telegramChatIds?.length ? data.telegramChatIds : [''],
          supportEmail: data.supportEmail || '',
        });
      } catch (error) {
        console.error('Failed to load config:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const chatIds = config.telegramChatIds.filter(id => id.trim());
      await apiPut('/support/config', {
        telegramChatIds: chatIds,
        supportEmail: config.supportEmail,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
          <ChevronRight className="w-5 h-5 rotate-180" />
        </button>
        <h2 className="text-lg font-bold text-white">Support Settings</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /></div>
      ) : (
        <div className="space-y-6">
          {/* Telegram Chat IDs */}
          <div className="bg-white/[0.03] rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" /> Telegram Chat IDs
            </h3>
            <p className="text-xs text-slate-400 mb-3">Add or remove chat IDs that receive support notifications.</p>
            <div className="space-y-2">
              {config.telegramChatIds.map((id, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => {
                      const newIds = [...config.telegramChatIds];
                      newIds[i] = e.target.value;
                      setConfig({ ...config, telegramChatIds: newIds });
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Chat ID"
                  />
                  {config.telegramChatIds.length > 1 && (
                    <button onClick={() => {
                      const newIds = config.telegramChatIds.filter((_, idx) => idx !== i);
                      setConfig({ ...config, telegramChatIds: newIds });
                    }} className="p-2 rounded-lg hover:bg-red-500/10 text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => setConfig({ ...config, telegramChatIds: [...config.telegramChatIds, ''] })} className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">
                <Plus className="w-3 h-3" /> Add Chat ID
              </button>
            </div>
          </div>

          {/* Support Email */}
          <div className="bg-white/[0.03] rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400" /> Support Email
            </h3>
            <p className="text-xs text-slate-400 mb-3">Email address used for support ticket confirmations.</p>
            <input
              type="email"
              value={config.supportEmail}
              onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="support@dakkho.pro.bd"
            />
          </div>

          {/* Save */}
          <div className="flex items-center gap-3">
            <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-lg bg-blue-500/20 text-blue-400 font-bold hover:bg-blue-500/30 disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Save Settings
            </button>
            {saved && <span className="text-xs text-emerald-400 font-medium">Saved!</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Support Panel ───
export default function SupportPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats>({ open: 0, inProgress: 0, resolved: 0, closed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchTickets = useCallback(async () => {
    try {
      const [ticketsData, statsData] = await Promise.all([
        apiGet(`/support/tickets?status=${statusFilter}&search=${encodeURIComponent(search)}&page=${page}&limit=20`) as any,
        apiGet('/support/stats') as any,
      ]);
      setTickets(ticketsData.tickets || []);
      setTotal(ticketsData.total || 0);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // Settings view
  if (showSettings) {
    return <SettingsPanel onBack={() => setShowSettings(false)} />;
  }

  // Ticket detail view
  if (selectedTicket) {
    return <TicketDetailPanel ticket={selectedTicket} onBack={() => setSelectedTicket(null)} onRefresh={fetchTickets} />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage student support requests</p>
        </div>
        <button onClick={() => setShowSettings(true)} className="p-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Open', count: stats.open, color: 'border-blue-500/30 bg-blue-500/5', text: 'text-blue-400' },
          { label: 'In Progress', count: stats.inProgress, color: 'border-amber-500/30 bg-amber-500/5', text: 'text-amber-400' },
          { label: 'Resolved', count: stats.resolved, color: 'border-emerald-500/30 bg-emerald-500/5', text: 'text-emerald-400' },
          { label: 'Closed', count: stats.closed, color: 'border-slate-500/30 bg-slate-500/5', text: 'text-slate-400' },
          { label: 'Total', count: stats.total, color: 'border-purple-500/30 bg-purple-500/5', text: 'text-purple-400' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl border p-3 ${stat.color}`}>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{stat.label}</p>
            <p className={`text-xl font-bold ${stat.text}`}>{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            placeholder="Search tickets..."
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === status ? 'bg-blue-500/20 text-blue-400' : 'bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]'
              }`}
            >
              {status === 'all' ? 'All' : statusLabel[status] || status}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white/[0.02] rounded-xl border border-white/[0.04] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No tickets found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center gap-4 p-4 hover:bg-white/[0.02] cursor-pointer transition-colors"
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-blue-400 font-mono">{ticket.ticketId}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusColors[ticket.status] || statusColors.open}`}>
                      {statusLabel[ticket.status] || ticket.status}
                    </span>
                    <span className={`text-[10px] font-bold ${priorityColors[ticket.priority] || 'text-sky-400'}`}>{ticket.priority.toUpperCase()}</span>
                  </div>
                  <p className="text-sm text-white font-medium truncate">{ticket.subject}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                    <span>{ticket.name || ticket.email}</span>
                    <span>{ticket.category}</span>
                    <span>{formatDate(ticket.createdAt)}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-slate-400">Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} of {total}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-xs text-slate-400 disabled:opacity-50 hover:bg-white/[0.08]">Previous</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total} className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-xs text-slate-400 disabled:opacity-50 hover:bg-white/[0.08]">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
