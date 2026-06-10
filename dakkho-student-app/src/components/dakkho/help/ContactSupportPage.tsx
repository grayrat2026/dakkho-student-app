'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, ChevronLeft, Send, Paperclip, AlertCircle,
  CheckCircle, Clock, User, Mail, X, FileText, Loader2,
  RefreshCw, Eye, Image as ImageIcon, File, Download,
} from 'lucide-react';
import { useNavigationStore, useAuthStore } from '@/lib/store';
import { supportApi, type SupportTicket, type SupportMessage } from '@/lib/api-client';
import { GlassCard } from '../shared/GlassCard';
import { GradientButton } from '../shared/GradientButton';

// ─── Ticket Detail View ───
function TicketDetail({ ticket, onBack }: { ticket: SupportTicket; onBack: () => void }) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      const data = await supportApi.getTicket(ticket.ticket_id);
      setMessages(data.messages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  }, [ticket.ticket_id]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await supportApi.addMessage(ticket.ticket_id, {
        message: replyText,
        name: user?.name || ticket.name || undefined,
        senderType: 'user',
      }, replyFiles.length > 0 ? replyFiles : undefined);
      setReplyText('');
      setReplyFiles([]);
      await fetchMessages();
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setSending(false);
    }
  };

  const statusColors: Record<string, string> = {
    open: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    in_progress: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    resolved: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    closed: 'bg-slate-50 dark:bg-slate-900/20 text-slate-600 dark:text-slate-400',
  };
  const statusLabel: Record<string, string> = {
    open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed',
  };

  return (
    <div className="pb-20 lg:pb-0">
      <motion.div className="flex items-center gap-3 mb-4" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <motion.button className="w-9 h-9 rounded-xl bg-muted/30 flex items-center justify-center text-foreground" onClick={onBack} whileTap={{ scale: 0.9 }}>
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold text-foreground">{ticket.subject}</h1>
          <p className="text-xs text-muted-foreground">{ticket.ticket_id} · {ticket.category}</p>
        </div>
        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${statusColors[ticket.status] || statusColors.open}`}>
          {statusLabel[ticket.status] || ticket.status}
        </span>
      </motion.div>

      {/* Resolution banner */}
      {ticket.status === 'resolved' && ticket.resolved_content && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <GlassCard className="p-4 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Resolved</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">{ticket.resolved_content}</p>
                {ticket.resolved_by && <p className="text-[10px] text-muted-foreground mt-1">By: {ticket.resolved_by}</p>}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Messages */}
      <GlassCard className="p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Conversation</h3>
          <motion.button onClick={fetchMessages} className="p-1.5 rounded-lg hover:bg-muted/20" whileTap={{ scale: 0.9 }}>
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
          </motion.button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-sky-500" /></div>
        ) : (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
            {messages.map((msg) => {
              const isUser = msg.sender_type === 'user';
              const isSystem = msg.sender_type === 'system';
              let attachments: string[] = [];
              try { attachments = JSON.parse(msg.attachments || '[]'); } catch {}

              return (
                <motion.div
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                    isUser
                      ? 'bg-sky-500/20 text-foreground rounded-br-sm'
                      : isSystem
                      ? 'bg-amber-500/10 text-foreground rounded-bl-sm border border-amber-200/30 dark:border-amber-800/30'
                      : 'bg-muted/30 text-foreground rounded-bl-sm'
                  }`}>
                    {!isUser && (
                      <p className="text-[10px] font-bold text-sky-500 mb-1">
                        {msg.sender_name || (isSystem ? 'System' : 'Support')}
                        {msg.source === 'telegram' && ' (via Telegram)'}
                        {msg.source === 'admin' && ' (Admin)'}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    {attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {attachments.map((att, i) => (
                          <a
                            key={i}
                            href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dakkho-admin-api.dakkho-admin.workers.dev'}/api/support/attachment-url?key=${encodeURIComponent(att)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-sky-500 hover:text-sky-400"
                          >
                            <Paperclip className="w-3 h-3" />
                            <span className="truncate">{att.split('/').pop()?.replace(/^\d+-/, '') || `Attachment ${i + 1}`}</span>
                          </a>
                        ))}
                      </div>
                    )}
                    <p className="text-[9px] text-muted-foreground mt-1 text-right">
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Reply box */}
      {ticket.status !== 'closed' && (
        <GlassCard className="p-4">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-white/30 dark:border-white/10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-none"
            placeholder="Type your reply..."
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer p-2 rounded-lg hover:bg-muted/20 text-muted-foreground hover:text-sky-500 transition-colors">
                <Paperclip className="w-4 h-4" />
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setReplyFiles(prev => [...prev, ...files].slice(0, 5));
                    e.target.value = '';
                  }}
                />
              </label>
              {replyFiles.length > 0 && (
                <span className="text-[10px] text-muted-foreground">{replyFiles.length} file(s)</span>
              )}
            </div>
            <GradientButton onClick={handleReply} loading={sending} size="sm">
              <Send className="w-3.5 h-3.5" /> Reply
            </GradientButton>
          </div>
          {replyFiles.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {replyFiles.map((f, i) => (
                <span key={i} className="text-[10px] bg-muted/30 px-2 py-1 rounded-lg flex items-center gap-1 text-muted-foreground">
                  {f.name.substring(0, 20)}
                  <button onClick={() => setReplyFiles(prev => prev.filter((_, idx) => idx !== i))}>
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}

// ─── Main Contact Support Page ───
export function ContactSupportPage() {
  const { goBack, navigate } = useNavigationStore();
  const { user } = useAuthStore();

  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('normal');
  const [category, setCategory] = useState('General');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Tickets list state
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const categories = ['General', 'Technical Issue', 'Billing', 'Course Content', 'Account', 'Feature Request'];
  const priorities = [
    { label: 'Low', value: 'low', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
    { label: 'Normal', value: 'normal', color: 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800' },
    { label: 'High', value: 'high', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800' },
    { label: 'Urgent', value: 'urgent', color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800' },
  ];

  const statusColors: Record<string, string> = {
    open: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    in_progress: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    resolved: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    closed: 'bg-slate-50 dark:bg-slate-900/20 text-slate-600 dark:text-slate-400',
  };
  const statusLabel: Record<string, string> = {
    open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed',
  };

  // Fetch user's tickets
  const fetchTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const params: { email?: string; userId?: string } = {};
      if (user?.id) {
        params.userId = user.id;
      } else if (email) {
        params.email = email;
      }
      if (params.email || params.userId) {
        const data = await supportApi.listTickets(params);
        setTickets(data.tickets);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoadingTickets(false);
    }
  }, [user?.id, email]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // Update email when user changes
  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!subject.trim()) newErrors.subject = 'Subject is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    else if (description.trim().length < 20) newErrors.description = 'Please provide at least 20 characters';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const result = await supportApi.createTicket({
        subject, category, priority, description, email,
        name: user?.name || undefined,
      }, files.length > 0 ? files : undefined);
      setSubmittedTicketId(result.ticketId);
      setSubmitted(true);
      // Refresh tickets
      await fetchTickets();
    } catch (error: any) {
      setErrors({ submit: error?.message || 'Failed to submit ticket' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Ticket Detail View ───
  if (selectedTicket) {
    return <TicketDetail ticket={selectedTicket} onBack={() => setSelectedTicket(null)} />;
  }

  // ─── Success View ───
  if (submitted) {
    return (
      <div className="pb-20 lg:pb-0">
        <motion.div className="flex items-center gap-3 mb-6" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <motion.button className="w-9 h-9 rounded-xl bg-muted/30 flex items-center justify-center text-foreground" onClick={goBack} whileTap={{ scale: 0.9 }}>
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          <h1 className="text-xl font-extrabold text-foreground">Contact Support</h1>
        </motion.div>
        <GlassCard className="p-8 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
          </motion.div>
          <h2 className="text-lg font-extrabold text-foreground mb-2">Ticket Submitted!</h2>
          <p className="text-sm text-muted-foreground mb-1">Your support ticket has been created.</p>
          <p className="text-sm text-muted-foreground mb-4">Ticket ID: <span className="font-bold text-sky-500">{submittedTicketId}</span></p>
          <p className="text-xs text-muted-foreground mb-6">Our team will respond within 24-48 hours.</p>
          <div className="flex gap-2 justify-center">
            <GradientButton onClick={() => { setSubmitted(false); setSubject(''); setDescription(''); setFiles([]); }} size="sm">New Ticket</GradientButton>
            <GradientButton onClick={goBack} size="sm" variant="secondary">Back to Help</GradientButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0">
      {/* Header */}
      <motion.div className="flex items-center gap-3 mb-6" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <motion.button className="w-9 h-9 rounded-xl bg-muted/30 flex items-center justify-center text-foreground" onClick={goBack} whileTap={{ scale: 0.9 }}>
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
        <div>
          <h1 className="text-xl font-extrabold text-foreground">Contact Support</h1>
          <p className="text-xs text-muted-foreground">We are here to help you</p>
        </div>
      </motion.div>

      {/* Previous Tickets */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <GlassCard className="p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-500" /> Your Tickets
            </h3>
            <motion.button onClick={fetchTickets} className="p-1.5 rounded-lg hover:bg-muted/20" whileTap={{ scale: 0.9 }}>
              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
            </motion.button>
          </div>

          {loadingTickets ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-sky-500" /></div>
          ) : tickets.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No tickets yet. Create one below!</p>
          ) : (
            <div className="space-y-2">
              {tickets.slice(0, 5).map((ticket, i) => (
                <motion.div
                  key={ticket.ticket_id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-sky-500">{ticket.ticket_id}</p>
                    <p className="text-xs font-semibold text-foreground truncate">{ticket.subject}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(ticket.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${statusColors[ticket.status] || ''}`}>
                      {statusLabel[ticket.status] || ticket.status}
                    </span>
                    <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Contact Form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <GlassCard className="p-5">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-sky-500" /> New Ticket
          </h3>

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors({ ...errors, email: '' }); }}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/30 border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${
                    errors.email ? 'border-red-500' : 'border-white/30 dark:border-white/10'
                  }`}
                  placeholder="your.email@example.com"
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
            </div>

            {/* Subject */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Subject <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => { setSubject(e.target.value); setErrors({ ...errors, subject: '' }); }}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/30 border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${
                    errors.subject ? 'border-red-500' : 'border-white/30 dark:border-white/10'
                  }`}
                  placeholder="Brief description of your issue"
                />
              </div>
              {errors.subject && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.subject}</p>}
            </div>

            {/* Category & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-white/30 dark:border-white/10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/50 appearance-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Priority</label>
                <div className="flex gap-1 flex-wrap">
                  {priorities.map((p) => (
                    <motion.button
                      key={p.value}
                      className={`px-2 py-1.5 rounded-lg text-xs font-bold border ${priority === p.value ? p.color : 'bg-muted/30 text-muted-foreground border-transparent'}`}
                      onClick={() => setPriority(p.value)}
                      whileTap={{ scale: 0.95 }}
                    >
                      {p.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => { setDescription(e.target.value); setErrors({ ...errors, description: '' }); }}
                rows={5}
                className={`w-full px-4 py-3 rounded-xl bg-muted/30 border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-none ${
                  errors.description ? 'border-red-500' : 'border-white/30 dark:border-white/10'
                }`}
                placeholder="Describe your issue in detail. Include any error messages, steps to reproduce, and relevant screenshots..."
              />
              <div className="flex items-center justify-between mt-1">
                {errors.description ? (
                  <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.description}</p>
                ) : <span />}
                <span className="text-xs text-muted-foreground">{description.length}/1000</span>
              </div>
            </div>

            {/* Attachments */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Attachments</label>
              <label className="w-full p-3 rounded-xl border-2 border-dashed border-muted/50 text-muted-foreground flex items-center justify-center gap-2 hover:border-sky-500/50 hover:text-sky-500 transition-colors cursor-pointer">
                <Paperclip className="w-4 h-4" />
                <span className="text-xs font-semibold">Add files ({files.length}/5)</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={(e) => {
                    const newFiles = Array.from(e.target.files || []);
                    setFiles(prev => [...prev, ...newFiles].slice(0, 5));
                    e.target.value = '';
                  }}
                />
              </label>
              <AnimatePresence>
                {files.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {files.map((file, i) => (
                      <motion.div
                        key={file.name + i}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/20"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip className="w-3 h-3 text-sky-500 flex-shrink-0" />
                          <span className="text-xs font-medium text-foreground truncate">{file.name}</span>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">({(file.size / 1024).toFixed(0)} KB)</span>
                        </div>
                        <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}>
                          <X className="w-3 h-3 text-muted-foreground hover:text-red-500" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.submit}</p>
            )}

            {/* Submit */}
            <GradientButton onClick={handleSubmit} loading={isSubmitting} className="w-full" size="sm">
              <Send className="w-4 h-4" /> Submit Ticket
            </GradientButton>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
