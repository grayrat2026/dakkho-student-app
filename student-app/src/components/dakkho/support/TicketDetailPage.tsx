'use client';

import { useState, useEffect } from 'react';
import { useNavigationStore } from '@/lib/store';
import { supportApi } from '@/lib/api-client';
import { 
  ChevronLeft, Send, Clock, User, MessageSquare, 
  CheckCircle2, AlertCircle, Loader2, Tag, Calendar
} from 'lucide-react';

export default function TicketDetailPage() {
  const navigate = useNavigationStore(s => s.navigate);
  const pageParams = useNavigationStore(s => s.pageParams);
  const ticketId = pageParams?.ticketId || pageParams?.id || '';
  
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ticketId) fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const result = await supportApi.getTicket(ticketId);
      if (result.success) {
        setTicket(result.ticket);
        setMessages(result.messages || []);
      } else {
        setError(result.error || 'Failed to load ticket');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      setSending(true);
      const result = await supportApi.addMessage(ticketId, {
        message: replyText,
        sender_type: 'user',
      });
      if (result.success) {
        setReplyText('');
        fetchTicket();
      }
    } catch (err) {
      console.error('Reply failed:', err);
    } finally {
      setSending(false);
    }
  };

  const statusColors: Record<string, string> = {
    open: 'bg-blue-500/10 text-blue-500',
    in_progress: 'bg-amber-500/10 text-amber-500',
    resolved: 'bg-green-500/10 text-green-500',
    closed: 'bg-gray-500/10 text-gray-500',
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-sky-500" /></div>;
  if (error) return <div className="text-center py-12"><AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" /><p className="text-red-500">{error}</p></div>;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('help')} className="p-2 rounded-lg hover:bg-muted">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">{ticket?.subject || 'Ticket Details'}</h1>
          <p className="text-sm text-muted-foreground">{ticket?.ticket_id}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[ticket?.status] || ''}`}>
          {ticket?.status?.replace('_', ' ')}
        </span>
      </div>

      {/* Ticket Info */}
      {ticket && (
        <div className="p-4 rounded-xl bg-card border border-border mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Category:</span>
              <span className="font-medium capitalize">{ticket.category}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created:</span>
              <span className="font-medium">{new Date(ticket.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">From:</span>
              <span className="font-medium">{ticket.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Priority:</span>
              <span className="font-medium capitalize">{ticket.priority}</span>
            </div>
          </div>
          {ticket.description && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="space-y-4 mb-6">
        {messages.map((msg: any) => (
          <div key={msg.id} className={`flex gap-3 ${msg.sender_type === 'admin' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
              msg.sender_type === 'admin' ? 'bg-sky-500' : 'bg-emerald-500'
            }`}>
              {msg.sender_type === 'admin' ? 'S' : 'U'}
            </div>
            <div className={`max-w-[75%] p-3 rounded-xl text-sm ${
              msg.sender_type === 'admin' 
                ? 'bg-sky-500/10 border border-sky-500/20' 
                : 'bg-card border border-border'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-xs">
                  {msg.sender_name || (msg.sender_type === 'admin' ? 'Dakkho Support' : 'You')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(msg.created_at).toLocaleString()}
                </span>
              </div>
              <p className="whitespace-pre-wrap">{msg.message}</p>
            </div>
          </div>
        ))}
        
        {messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No messages yet</p>
          </div>
        )}
      </div>

      {/* Reply Input */}
      {ticket?.status !== 'closed' && ticket?.status !== 'resolved' && (
        <div className="sticky bottom-0 bg-background border-t border-border pt-4 pb-2">
          <div className="flex gap-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply..."
              rows={2}
              className="flex-1 p-3 rounded-xl border border-border bg-card text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); }
              }}
            />
            <button
              onClick={handleReply}
              disabled={sending || !replyText.trim()}
              className="p-3 rounded-xl bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-50 transition-colors self-end"
            >
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
