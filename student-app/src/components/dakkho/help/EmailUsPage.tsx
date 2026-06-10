'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, ChevronLeft, Send, User, AlertCircle,
  CheckCircle2, Loader2, MessageSquare,
} from 'lucide-react';
import { useNavigationStore } from '@/lib/store';
import { useAuthStore } from '@/lib/store';
import { supportApi } from '@/lib/api-client';
import { GlassCard } from '../shared/GlassCard';
import { GradientButton } from '../shared/GradientButton';

export function EmailUsPage() {
  const { goBack } = useNavigationStore();
  const { user } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-fill name and email from auth store when logged in
  useEffect(() => {
    if (user) {
      setName(user.fullName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
    if (!subject.trim()) newErrors.subject = 'Subject is required';
    if (!message.trim()) newErrors.message = 'Message is required';
    else if (message.trim().length < 10) newErrors.message = 'Please provide at least 10 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setError('');

    try {
      const result = await supportApi.sendEmail({
        name,
        email,
        subject,
        message,
      });

      if (result.success) {
        setSubmitted(true);
      } else {
        setError('Failed to send email. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred while sending your email');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="pb-20 lg:pb-0">
        <motion.div className="flex items-center gap-3 mb-6" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <motion.button className="w-9 h-9 rounded-xl bg-muted/30 flex items-center justify-center text-foreground" onClick={goBack} whileTap={{ scale: 0.9 }}>
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          <h1 className="text-xl font-extrabold text-foreground">Email Us</h1>
        </motion.div>
        <GlassCard className="p-8 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          </motion.div>
          <h3 className="text-xl font-bold mb-2">Email Sent!</h3>
          <p className="text-muted-foreground mb-1">Your message has been sent successfully.</p>
          <p className="text-sm text-muted-foreground mt-4">
            We&apos;ll respond to <span className="font-semibold text-foreground">{email}</span> within 24-48 hours.
          </p>
          <div className="mt-6">
            <GradientButton onClick={goBack} size="sm">Back to Help</GradientButton>
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
          <h1 className="text-xl font-extrabold text-foreground">Email Us</h1>
          <p className="text-xs text-muted-foreground">Send us an email and we&apos;ll get back to you</p>
        </div>
      </motion.div>

      {/* Info Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <GlassCard className="p-4 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">support@dakkho.pro.bd</p>
            <p className="text-xs text-muted-foreground">Typical response time: 24-48 hours</p>
          </div>
        </GlassCard>
      </motion.div>

      {/* Error banner */}
      {error && (
        <motion.div
          className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Email Form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <GlassCard className="p-5">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-emerald-500" /> Compose Email
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Name */}
              {!user && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setErrors({ ...errors, name: '' }); }}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/30 border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                        errors.name ? 'border-red-500' : 'border-white/30 dark:border-white/10'
                      }`}
                      placeholder="Your full name"
                    />
                  </div>
                  {errors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
                </div>
              )}

              {/* Email */}
              {!user && (
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
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/30 border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                        errors.email ? 'border-red-500' : 'border-white/30 dark:border-white/10'
                      }`}
                      placeholder="your.email@example.com"
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => { setSubject(e.target.value); setErrors({ ...errors, subject: '' }); }}
                  className={`w-full px-4 py-2.5 rounded-xl bg-muted/30 border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                    errors.subject ? 'border-red-500' : 'border-white/30 dark:border-white/10'
                  }`}
                  placeholder="What is your email about?"
                />
                {errors.subject && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.subject}</p>}
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); setErrors({ ...errors, message: '' }); }}
                  rows={6}
                  className={`w-full px-4 py-3 rounded-xl bg-muted/30 border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none ${
                    errors.message ? 'border-red-500' : 'border-white/30 dark:border-white/10'
                  }`}
                  placeholder="Write your message here..."
                />
                <div className="flex items-center justify-between mt-1">
                  {errors.message ? (
                    <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.message}</p>
                  ) : <span />}
                  <span className="text-xs text-muted-foreground">{message.length}/2000</span>
                </div>
              </div>

              {/* Submit */}
              <GradientButton onClick={handleSubmit as any} loading={isSubmitting} className="w-full" size="sm">
                <Send className="w-4 h-4" /> Send Email
              </GradientButton>
            </div>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}
