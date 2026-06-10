'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft, CheckCircle, Clock, Loader2, MessageSquare, AlertCircle,
} from 'lucide-react';
import { useNavigationStore } from '@/lib/store';
import { supportApi, type SupportTicket, type SupportMessage } from '@/lib/api-client';
import { GlassCard } from '../shared/GlassCard';
import { GradientButton } from '../shared/GradientButton';

interface TicketDetailPageProps {
  ticketId?: string;
  resolvedContent?: string;
  timestamp?: string;
}

export function TicketDetailPage({ ticketId, resolvedContent, timestamp }: TicketDetailPageProps) {
  const { goBack, navigate } = useNavigationStore();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ticketId) {
      setError('No ticket ID provided');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await supportApi.getTicket(ticketId);
        setTicket(data.ticket);
        setMessages(data.messages);
      } catch (err: any) {
        setError(err?.message || 'Failed to load ticket');
      } finally {
        setLoading(false);
      }
    })();
  }, [ticketId]);

  if (loading) {
    return (
      <div className="pb-20 lg:pb-0 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
          <p className="text-sm text-muted-foreground">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="pb-20 lg:pb-0">
        <motion.div className="flex items-center gap-3 mb-6" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <motion.button className="w-9 h-9 rounded-xl bg-muted/30 flex items-center justify-center text-foreground" onClick={() => navigate('contact-support')} whileTap={{ scale: 0.9 }}>
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          <h1 className="text-xl font-extrabold text-foreground">Ticket Not Found</h1>
        </motion.div>
        <GlassCard className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{error || 'Ticket not found'}</p>
          <GradientButton onClick={() => navigate('contact-support')} size="sm" className="mt-4">
            Go to Support
          </GradientButton>
        </GlassCard>
      </div>
    );
  }

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
      {/* Header */}
      <motion.div className="flex items-center gap-3 mb-4" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <motion.button className="w-9 h-9 rounded-xl bg-muted/30 flex items-center justify-center text-foreground" onClick={() => navigate('contact-support')} whileTap={{ scale: 0.9 }}>
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

      {/* Resolution Banner */}
      {(ticket.status === 'resolved' || resolvedContent) && (ticket.resolved_content || resolvedContent) && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <GlassCard className="p-4 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Ticket Resolved</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">{ticket.resolved_content || resolvedContent}</p>
                {ticket.resolved_by && <p className="text-[10px] text-muted-foreground mt-1">By: {ticket.resolved_by}</p>}
                {ticket.resolved_at && <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(ticket.resolved_at).toLocaleString()}</p>}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Ticket Info */}
      <GlassCard className="p-4 mb-4">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground font-semibold">From</p>
            <p className="text-foreground">{ticket.name || ticket.email}</p>
          </div>
          <div>
            <p className="text-muted-foreground font-semibold">Created</p>
            <p className="text-foreground">{new Date(ticket.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground font-semibold">Category</p>
            <p className="text-foreground">{ticket.category}</p>
          </div>
          <div>
            <p className="text-muted-foreground font-semibold">Priority</p>
            <p className="text-foreground capitalize">{ticket.priority}</p>
          </div>
        </div>
      </GlassCard>

      {/* Conversation */}
      <GlassCard className="p-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-sky-500" /> Conversation
        </h3>
        <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
          {messages.map((msg) => {
            const isUser = msg.sender_type === 'user';
            const isSystem = msg.sender_type === 'system';
            let attachments: string[] = [];
            try { attachments = JSON.parse(msg.attachments || '[]'); } catch {}

            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
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
                          <ChevronLeft className="w-3 h-3" />
                          <span className="truncate">{att.split('/').pop()?.replace(/^\d+-/, '') || `Attachment ${i + 1}`}</span>
                        </a>
                      ))}
                    </div>
                  )}
                  <p className="text-[9px] text-muted-foreground mt-1 text-right">
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Go to Support */}
      <div className="mt-4">
        <GradientButton onClick={() => navigate('contact-support')} size="sm" className="w-full">
          Go to Support Center
        </GradientButton>
      </div>
    </div>
  );
}
