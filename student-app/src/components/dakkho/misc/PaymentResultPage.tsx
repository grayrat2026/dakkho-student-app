'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, ArrowLeft, Loader2, RefreshCw, BookOpen, ArrowRight, AlertTriangle } from 'lucide-react';
import { paymentApi } from '../../../lib/api-client';
import { useNavigationStore } from '../../../lib/store';
import { GlassCard } from '../shared/GlassCard';
import { GradientButton } from '../shared/GradientButton';
import { AnimatedPage } from '../shared/AnimatedPage';

type PaymentStatus = 'loading' | 'completed' | 'pending' | 'failed' | 'error';

interface PaymentInfo {
  status: string;
  amount: number;
  gateway: string;
  transaction_id: string;
  enrolled_course_id?: string;
  message?: string;
}

export function PaymentResultPage() {
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [verifying, setVerifying] = useState(false);
  const navigate = useNavigationStore((s) => s.navigate);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ppId = params.get('pp_id');

    if (!ppId) {
      setStatus('error');
      return;
    }

    verifyPayment(ppId);
  }, []);

  const verifyPayment = async (ppId: string) => {
    setVerifying(true);
    try {
      const result = await paymentApi.verify({ pp_id: ppId });
      const mappedStatus = mapStatus(result.status);
      setStatus(mappedStatus);
      setPaymentInfo(result);
    } catch {
      setStatus('error');
    } finally {
      setVerifying(false);
    }
  };

  const mapStatus = (apiStatus: string): PaymentStatus => {
    switch (apiStatus?.toLowerCase()) {
      case 'completed':
      case 'success':
      case 'paid':
      case 'completed':
        return 'completed';
      case 'pending':
      case 'processing':
        return 'pending';
      case 'failed':
      case 'cancelled':
      case 'rejected':
        return 'failed';
      default:
        return 'error';
    }
  };

  const handleRetry = () => {
    const params = new URLSearchParams(window.location.search);
    const ppId = params.get('pp_id');
    if (ppId) {
      setStatus('loading');
      verifyPayment(ppId);
    }
  };

  return (
    <AnimatedPage keyProp="payment-result">
      <div className="pb-20 lg:pb-0">
        {/* Breadcrumb */}
        <motion.div
          className="flex items-center gap-2 text-sm text-muted-foreground mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <button onClick={() => navigate('home')} className="hover:text-sky-500 transition-colors">Home</button>
          <span>/</span>
          <span className="text-foreground font-semibold">Payment Result</span>
        </motion.div>

        <div className="flex items-center justify-center min-h-[60vh]">
          <AnimatePresence mode="wait">
            {status === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md mx-auto"
              >
                <GlassCard className="p-8 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 mx-auto mb-6"
                  >
                    <Loader2 className="w-16 h-16 text-sky-500" />
                  </motion.div>
                  <h2 className="text-xl font-extrabold text-foreground mb-2">Verifying Payment</h2>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we verify your payment status...
                  </p>
                  {verifying && (
                    <motion.div
                      className="mt-4 flex justify-center gap-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-sky-500"
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </motion.div>
                  )}
                </GlassCard>
              </motion.div>
            )}

            {status === 'completed' && (
              <motion.div
                key="completed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-full max-w-md mx-auto"
              >
                <GlassCard className="p-8 text-center">
                  {/* Confetti-like animated checkmark */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
                    className="relative mx-auto mb-6"
                  >
                    <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mx-auto relative">
                      <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                      {/* Confetti dots */}
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'][i],
                          }}
                          initial={{ scale: 0, x: 0, y: 0 }}
                          animate={{
                            scale: [0, 1.2, 0],
                            x: Math.cos((i * Math.PI) / 4) * 50,
                            y: Math.sin((i * Math.PI) / 4) * 50,
                          }}
                          transition={{ duration: 0.8, delay: 0.5 + i * 0.05 }}
                        />
                      ))}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h2 className="text-2xl font-extrabold text-foreground mb-2">Payment Successful!</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                      Your payment has been verified and your course is now accessible.
                    </p>
                  </motion.div>

                  {/* Payment details */}
                  {paymentInfo && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-700/30 mb-6 text-left"
                    >
                      <div className="space-y-2">
                        {paymentInfo.amount > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Amount</span>
                            <span className="text-sm font-bold text-foreground">&#2547;{paymentInfo.amount}</span>
                          </div>
                        )}
                        {paymentInfo.gateway && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Gateway</span>
                            <span className="text-sm font-semibold text-foreground capitalize">{paymentInfo.gateway}</span>
                          </div>
                        )}
                        {paymentInfo.transaction_id && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Transaction ID</span>
                            <span className="text-xs font-mono text-foreground">{paymentInfo.transaction_id}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col gap-3"
                  >
                    <GradientButton
                      variant="success"
                      className="w-full"
                      onClick={() => navigate('my-courses')}
                    >
                      <BookOpen className="w-4 h-4" />
                      Go to My Courses
                    </GradientButton>
                    <GradientButton
                      className="w-full"
                      onClick={() => navigate('home')}
                    >
                      Back to Home
                    </GradientButton>
                  </motion.div>
                </GlassCard>
              </motion.div>
            )}

            {status === 'pending' && (
              <motion.div
                key="pending"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md mx-auto"
              >
                <GlassCard className="p-8 text-center">
                  {/* Animated clock */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="mx-auto mb-6"
                  >
                    <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mx-auto relative">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                      >
                        <Clock className="w-12 h-12 text-amber-500" />
                      </motion.div>
                      {/* Pulse ring */}
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-amber-400/50"
                        animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h2 className="text-2xl font-extrabold text-foreground mb-2">Payment Processing</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                      Your payment is being processed. This usually takes a few minutes. You can check back shortly.
                    </p>
                  </motion.div>

                  {paymentInfo && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/30 mb-6 text-left"
                    >
                      <div className="space-y-2">
                        {paymentInfo.amount > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Amount</span>
                            <span className="text-sm font-bold text-foreground">&#2547;{paymentInfo.amount}</span>
                          </div>
                        )}
                        {paymentInfo.transaction_id && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Transaction ID</span>
                            <span className="text-xs font-mono text-foreground">{paymentInfo.transaction_id}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col gap-3"
                  >
                    <GradientButton
                      className="w-full"
                      onClick={handleRetry}
                      disabled={verifying}
                      loading={verifying}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Check Again
                    </GradientButton>
                    <GradientButton
                      className="w-full"
                      onClick={() => navigate('home')}
                    >
                      Back to Home
                    </GradientButton>
                  </motion.div>
                </GlassCard>
              </motion.div>
            )}

            {status === 'failed' && (
              <motion.div
                key="failed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md mx-auto"
              >
                <GlassCard className="p-8 text-center">
                  {/* Animated X mark */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
                    className="mx-auto mb-6"
                  >
                    <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center mx-auto">
                      <motion.div
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', delay: 0.4, stiffness: 200 }}
                      >
                        <XCircle className="w-12 h-12 text-red-500" />
                      </motion.div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h2 className="text-2xl font-extrabold text-foreground mb-2">Payment Failed</h2>
                    <p className="text-sm text-muted-foreground mb-2">
                      Your payment could not be completed. This may be due to insufficient funds or a payment gateway error.
                    </p>
                    {paymentInfo?.message && (
                      <p className="text-xs text-red-500 dark:text-red-400 mb-4">
                        {paymentInfo.message}
                      </p>
                    )}
                  </motion.div>

                  {paymentInfo && paymentInfo.amount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="p-4 rounded-xl bg-red-50/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-700/30 mb-6 text-left"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Amount</span>
                          <span className="text-sm font-bold text-foreground">&#2547;{paymentInfo.amount}</span>
                        </div>
                        {paymentInfo.transaction_id && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Transaction ID</span>
                            <span className="text-xs font-mono text-foreground">{paymentInfo.transaction_id}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col gap-3"
                  >
                    <GradientButton
                      variant="primary"
                      className="w-full"
                      onClick={() => navigate('subscription')}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Try Again
                    </GradientButton>
                    <GradientButton
                      className="w-full"
                      onClick={() => navigate('home')}
                    >
                      Back to Home
                    </GradientButton>
                  </motion.div>
                </GlassCard>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md mx-auto"
              >
                <GlassCard className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="mx-auto mb-6"
                  >
                    <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center mx-auto">
                      <AlertTriangle className="w-12 h-12 text-red-500" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h2 className="text-2xl font-extrabold text-foreground mb-2">Verification Error</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                      We couldn&apos;t verify your payment status. This may be because the payment reference is missing or invalid.
                      If you completed payment, please contact support.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col gap-3"
                  >
                    <GradientButton
                      className="w-full"
                      onClick={handleRetry}
                      disabled={verifying}
                      loading={verifying}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry Verification
                    </GradientButton>
                    <GradientButton
                      className="w-full"
                      onClick={() => navigate('subscription')}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Subscription
                    </GradientButton>
                    <GradientButton
                      className="w-full"
                      onClick={() => navigate('home')}
                    >
                      Back to Home
                    </GradientButton>
                  </motion.div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AnimatedPage>
  );
}
