'use client';

import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigationStore } from '../../../lib/store';
import { GlassCard } from '../shared/GlassCard';
import { GradientButton } from '../shared/GradientButton';
import { AnimatedPage } from '../shared/AnimatedPage';

export function PaymentCancelPage() {
  const navigate = useNavigationStore((s) => s.navigate);

  return (
    <AnimatedPage keyProp="payment-cancel">
      <div className="pb-20 lg:pb-0">
        {/* Breadcrumb */}
        <motion.div
          className="flex items-center gap-2 text-sm text-muted-foreground mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <button onClick={() => navigate('home')} className="hover:text-sky-500 transition-colors">Home</button>
          <span>/</span>
          <span className="text-foreground font-semibold">Payment Cancelled</span>
        </motion.div>

        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-full max-w-md mx-auto">
            <GlassCard className="p-8 text-center">
              {/* Cancel icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
                className="mx-auto mb-6"
              >
                <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
                  <XCircle className="w-12 h-12 text-amber-500" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-2xl font-extrabold text-foreground mb-2">Payment Cancelled</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Your payment was cancelled and no charges have been made. You can try again whenever you&apos;re ready.
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
                  onClick={() => navigate('subscription')}
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </GradientButton>
                <GradientButton
                  className="w-full"
                  onClick={() => navigate('home')}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </GradientButton>
              </motion.div>
            </GlassCard>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
