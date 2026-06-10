'use client';

import { useState, useEffect } from 'react';
import { useNavigationStore, useAuthStore } from '@/lib/store';
import { supportApi } from '@/lib/api-client';
import { 
  MessageSquare, Plus, Clock, ChevronRight, Loader2, 
  AlertCircle, Search
} from 'lucide-react';

export default function SupportChatPage() {
  const navigate = useNavigationStore(s => s.navigate);
  const { user } = useAuthStore();
  
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      if (user) {
        const result = await supportApi.getMyTickets();
        if (result.success) {
          setTickets(result.tickets);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    open: 'bg-blue-500',
    in_progress: 'bg-amber-500',
    resolved: 'bg-green-500',
    closed: 'bg-gray-500',
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Support Chat</h1>
          <p className="text-sm text-muted-foreground">Your conversations with support</p>
        </div>
        <button
          onClick={() => navigate('support-wizard')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Conversation
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
        </div>
      ) : !user ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Login Required</h3>
          <p className="text-sm text-muted-foreground mb-4">Please login to view your support conversations</p>
          <button onClick={() => navigate('login')} className="px-6 py-2 rounded-xl bg-sky-500 text-white text-sm hover:bg-sky-600">
            Login
          </button>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No Conversations Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Start a new conversation with our support team</p>
          <button onClick={() => navigate('support-wizard')} className="px-6 py-2 rounded-xl bg-sky-500 text-white text-sm hover:bg-sky-600">
            Start a Conversation
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket: any) => (
            <button
              key={ticket.ticket_id}
              onClick={() => navigate('ticket-detail', { ticketId: ticket.ticket_id })}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-sky-500/30 hover:bg-sky-500/5 transition-all text-left"
            >
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${statusColors[ticket.status] || 'bg-gray-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{ticket.subject}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span className="font-mono">{ticket.ticket_id}</span>
                  <span>•</span>
                  <span className="capitalize">{ticket.status.replace('_', ' ')}</span>
                  <span>•</span>
                  <Clock className="h-3 w-3" />
                  <span>{new Date(ticket.updated_at || ticket.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
