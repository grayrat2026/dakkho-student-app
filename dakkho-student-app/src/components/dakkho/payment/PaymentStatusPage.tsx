'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { useNavigationStore } from '@/lib/store';
import { paymentApi } from '@/lib/api-client';
import { GlassCard } from '../shared/GlassCard';
import { GradientButton } from '../shared/GradientButton';

const PENDING_ORDER_KEY = 'dakkho_pending_order_id';

interface PaymentStatusPageProps {
  type: 'success' | 'failed' | 'cancel';
}

export function PaymentStatusPage({ type }: PaymentStatusPageProps) {
  const navigate = useNavigationStore((s) => s.navigate);
  const pageParams = useNavigationStore((s) => s.pageParams);
  const [status, setStatus] = useState<'verifying' | 'completed' | 'failed' | 'pending' | 'cancelled'>(
    type === 'success' ? 'verifying' : type === 'failed' ? 'failed' : 'cancelled'
  );
  const [pollCount, setPollCount] = useState(0);
  const [orderId, setOrderId] = useState<string>('');

  useEffect(() => {
    // Extract order_id from multiple sources:
    // 1. pageParams (if navigated programmatically)
    // 2. localStorage (stored before redirecting to Piprapay)
    // 3. URL search params (pathname-based routing: /payment/success?order_id=xxx)
    // 4. Hash-based URL params (fallback: /#/payment/success?order_id=xxx)
    const fromPageParams = pageParams?.order_id as string || '';
    const fromLocalStorage = typeof window !== 'undefined' ? localStorage.getItem(PENDING_ORDER_KEY) || '' : '';
    const fromSearchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('order_id') || '' : '';
    const fromHashParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.hash.split('?')[1] || '').get('order_id') || '' : '';

    const oid = fromPageParams || fromLocalStorage || fromSearchParams || fromHashParams;
    if (oid) {
      queueMicrotask(() => setOrderId(oid));
    }
  }, [pageParams]);

  useEffect(() => {
    if (type !== 'success' || !orderId) return;
    if (status !== 'verifying' && status !== 'pending') return;

    const poll = async () => {
      try {
        const res = await paymentApi.getStatus(orderId);
        if (res.status === 'completed' && res.enrolled) {
          setStatus('completed');
          // Clean up localStorage
          localStorage.removeItem(PENDING_ORDER_KEY);
          return;
        }
        if (res.status === 'failed') {
          setStatus('failed');
          localStorage.removeItem(PENDING_ORDER_KEY);
          return;
        }
        // Still pending
        setStatus('pending');
        setPollCount((c) => c + 1);
      } catch {
        setPollCount((c) => c + 1);
      }
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [type, orderId, status]);

  const maxPolls = 20; // 60 seconds
  const isTimedOut = pollCount >= maxPolls && status === 'pending';

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8 text-center space-y-6">
          {/* Status Icon */}
          {status === 'verifying' && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <RefreshCw className="w-8 h-8 text-sky-500" />
                </motion.div>
              </div>
              <h2 className="text-xl font-bold">Verifying Payment...</h2>
              <p className="text-sm text-muted-foreground">
                Please wait while we confirm your payment. This may take a few seconds.
              </p>
              {orderId && <p className="text-xs text-muted-foreground">Order: {orderId.slice(0, 8)}...</p>}
            </div>
          )}

          {status === 'pending' && !isTimedOut && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold">Payment Processing</h2>
              <p className="text-sm text-muted-foreground">
                Your payment is being processed. You will be notified once it is confirmed.
              </p>
              {orderId && <p className="text-xs text-muted-foreground">Order: {orderId.slice(0, 8)}...</p>}
            </div>
          )}

          {status === 'pending' && isTimedOut && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold">Still Processing</h2>
              <p className="text-sm text-muted-foreground">
                Your payment is taking longer than expected. Don&apos;t worry — your enrollment will be confirmed automatically once the payment is verified.
              </p>
              <GradientButton onClick={() => navigate('home')} className="mt-2">
                Go to Home
              </GradientButton>
            </div>
          )}

          {status === 'completed' && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold">Payment Successful!</h2>
              <p className="text-sm text-muted-foreground">
                Your enrollment has been confirmed. You can now start learning!
              </p>
              <GradientButton onClick={() => navigate('my-courses')} className="mt-2">
                Go to My Courses
              </GradientButton>
            </div>
          )}

          {(status === 'failed' || status === 'cancelled') && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold">
                {status === 'cancelled' ? 'Payment Cancelled' : 'Payment Failed'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {status === 'cancelled'
                  ? 'You cancelled the payment. You can try again whenever you are ready.'
                  : 'Your payment could not be processed. Please try again or contact support.'}
              </p>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => navigate('home')}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  Go Home
                </button>
                <GradientButton onClick={() => window.history.back()}>
                  Try Again
                </GradientButton>
              </div>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}
