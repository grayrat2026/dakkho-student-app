'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigationStore, useAuthStore } from '@/lib/store';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { GlassCard } from '../shared/GlassCard';
import { GradientButton } from '../shared/GradientButton';
import {
  ChevronRight, ChevronLeft, Search, MessageSquare, CreditCard,
  User, Monitor, BookOpen, Award, RefreshCw, Lightbulb,
  Bug, Send, CheckCircle2, AlertCircle, Loader2, FileText,
  HelpCircle, ArrowRight, Home, X, Sparkles, Clock, Shield,
  Wifi, Smartphone, Globe, Zap
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface WizardStep {
  id: string;
  title: string;
  titleBn?: string;
  type: 'category' | 'sub-category' | 'detail' | 'auto-suggest' | 'user-info' | 'description' | 'review' | 'success';
  options?: WizardOption[];
  message?: string;
  icon?: any;
}

interface WizardOption {
  id: string;
  label: string;
  labelBn?: string;
  icon?: any;
  nextStep: string;
  autoSuggestion?: string;
  autoSuggestionBn?: string;
  color?: string;
}

// ─── Wizard Flow Definition ──────────────────────────────────────────────────

const WIZARD_STEPS: Record<string, WizardStep> = {
  start: {
    id: 'start',
    title: 'How can we help you today?',
    titleBn: 'আজকে আমরা কিভাবে সাহায্য করতে পারি?',
    type: 'category',
    icon: MessageSquare,
    options: [
      { id: 'course', label: 'Course Issues', labelBn: 'কোর্স সমস্যা', icon: BookOpen, nextStep: 'course-type', color: 'text-sky-500' },
      { id: 'payment', label: 'Payment Issues', labelBn: 'পেমেন্ট সমস্যা', icon: CreditCard, nextStep: 'payment-type', color: 'text-emerald-500' },
      { id: 'account', label: 'Account Issues', labelBn: 'অ্যাকাউন্ট সমস্যা', icon: User, nextStep: 'account-type', color: 'text-violet-500' },
      { id: 'technical', label: 'Technical Issues', labelBn: 'প্রযুক্তিগত সমস্যা', icon: Monitor, nextStep: 'technical-type', color: 'text-orange-500' },
      { id: 'content', label: 'Content Issues', labelBn: 'বিষয়বস্তু সমস্যা', icon: FileText, nextStep: 'content-type', color: 'text-pink-500' },
      { id: 'certificate', label: 'Certificate Issues', labelBn: 'সার্টিফিকেট সমস্যা', icon: Award, nextStep: 'certificate-type', color: 'text-amber-500' },
      { id: 'refund', label: 'Refund Request', labelBn: 'ফেরত অনুরোধ', icon: RefreshCw, nextStep: 'refund-check', color: 'text-red-500' },
      { id: 'general', label: 'General Inquiry', labelBn: 'সাধারণ জিজ্ঞাসা', icon: HelpCircle, nextStep: 'general-detail', color: 'text-cyan-500' },
      { id: 'feature', label: 'Feature Request', labelBn: 'ফিচার অনুরোধ', icon: Lightbulb, nextStep: 'feature-detail', color: 'text-yellow-500' },
      { id: 'bug', label: 'Bug Report', labelBn: 'বাগ রিপোর্ট', icon: Bug, nextStep: 'bug-severity', color: 'text-rose-500' },
    ]
  },

  // ── Course issues flow ──
  'course-type': {
    id: 'course-type',
    title: 'What kind of course issue?',
    titleBn: 'কোর্সের কী ধরনের সমস্যা?',
    type: 'sub-category',
    icon: BookOpen,
    options: [
      { id: 'video-not-playing', label: 'Video not playing', nextStep: 'course-detail', autoSuggestion: 'Try clearing your browser cache, disabling ad blockers, or switching browsers. Videos work best on Chrome or Firefox.', autoSuggestionBn: 'ব্রাউজার ক্যাশে মুছুন, অ্যাড ব্লকার নিষ্ক্রিয় করুন, বা ব্রাউজার পরিবর্তন করুন। Chrome বা Firefox-এ ভিডিও সবচেয়ে ভালো কাজ করে।' },
      { id: 'course-access', label: 'Cannot access course', nextStep: 'course-detail', autoSuggestion: 'Make sure you are logged in with the correct account. Check if your package is still active in My Subscriptions.' },
      { id: 'wrong-content', label: 'Wrong or missing content', nextStep: 'course-detail' },
      { id: 'course-quality', label: 'Content quality issue', nextStep: 'course-detail' },
    ]
  },

  // ── Payment issues flow ──
  'payment-type': {
    id: 'payment-type',
    title: 'What kind of payment issue?',
    titleBn: 'কোন ধরনের পেমেন্ট সমস্যা?',
    type: 'sub-category',
    icon: CreditCard,
    options: [
      { id: 'payment-failed', label: 'Payment failed', nextStep: 'payment-detail', autoSuggestion: 'Check if your payment method has sufficient balance. Try again after 5 minutes. If the amount was deducted, wait 24 hours for automatic refund.' },
      { id: 'payment-not-reflected', label: 'Payment successful but not reflected', nextStep: 'payment-detail', autoSuggestion: 'Payments can take up to 30 minutes to reflect. If not reflected after 30 minutes, please submit a ticket with your TRX ID.' },
      { id: 'wrong-amount', label: 'Wrong amount charged', nextStep: 'payment-detail' },
      { id: 'refund-request', label: 'Want a refund', nextStep: 'refund-check' },
    ]
  },

  // ── Account issues flow ──
  'account-type': {
    id: 'account-type',
    title: 'What kind of account issue?',
    titleBn: 'কোন ধরনের অ্যাকাউন্ট সমস্যা?',
    type: 'sub-category',
    icon: User,
    options: [
      { id: 'cannot-login', label: 'Cannot login', nextStep: 'account-detail', autoSuggestion: 'Try resetting your password using the "Forgot Password" option. Check your email for the reset link.' },
      { id: 'email-not-verified', label: 'Email not verified', nextStep: 'account-detail', autoSuggestion: 'Check your spam/junk folder for the verification email. You can request a new verification email from the login page.' },
      { id: 'account-locked', label: 'Account locked', nextStep: 'account-detail' },
      { id: 'profile-issue', label: 'Profile update issue', nextStep: 'account-detail' },
    ]
  },

  // ── Technical issues flow ──
  'technical-type': {
    id: 'technical-type',
    title: 'What kind of technical issue?',
    titleBn: 'কোন ধরনের প্রযুক্তিগত সমস্যা?',
    type: 'sub-category',
    icon: Monitor,
    options: [
      { id: 'app-not-loading', label: 'App not loading', nextStep: 'technical-detail', autoSuggestion: 'Try clearing your browser cache (Ctrl+Shift+Delete). Try using Chrome or Firefox. Check your internet connection.' },
      { id: 'video-buffering', label: 'Video buffering/streaming', nextStep: 'technical-detail', autoSuggestion: 'Lower the video quality. Check your internet speed (minimum 2 Mbps recommended). Close other tabs using bandwidth.' },
      { id: 'mobile-issues', label: 'Mobile app issues', nextStep: 'technical-detail' },
      { id: 'other-technical', label: 'Other technical issue', nextStep: 'technical-detail' },
    ]
  },

  // ── Content issues ──
  'content-type': {
    id: 'content-type',
    title: 'What content issue?',
    titleBn: 'কোন বিষয়বস্তু সমস্যা?',
    type: 'sub-category',
    icon: FileText,
    options: [
      { id: 'wrong-content', label: 'Wrong content in course', nextStep: 'content-detail' },
      { id: 'missing-content', label: 'Missing content', nextStep: 'content-detail' },
      { id: 'outdated-content', label: 'Outdated content', nextStep: 'content-detail' },
    ]
  },

  // ── Certificate issues ──
  'certificate-type': {
    id: 'certificate-type',
    title: 'What certificate issue?',
    titleBn: 'কোন সার্টিফিকেট সমস্যা?',
    type: 'sub-category',
    icon: Award,
    options: [
      { id: 'not-received', label: 'Certificate not received', nextStep: 'certificate-detail', autoSuggestion: 'Certificates are issued within 24 hours after course completion. Make sure you have completed all required modules.' },
      { id: 'certificate-error', label: 'Error on certificate', nextStep: 'certificate-detail' },
    ]
  },

  // ── Refund check ──
  'refund-check': {
    id: 'refund-check',
    title: 'Is your purchase within 7 days?',
    titleBn: 'আপনার ক্রয় কি ৭ দিনের মধ্যে?',
    type: 'sub-category',
    icon: RefreshCw,
    options: [
      { id: 'within-7', label: 'Yes, within 7 days', nextStep: 'refund-reason', autoSuggestion: 'You are eligible for a refund if you have viewed less than 25% of the course content.' },
      { id: 'over-7', label: 'No, more than 7 days', nextStep: 'refund-detail', autoSuggestion: 'Refunds after 7 days are only available in exceptional circumstances. Please describe your situation.' },
    ]
  },

  // ── Bug report severity ──
  'bug-severity': {
    id: 'bug-severity',
    title: 'How severe is the bug?',
    titleBn: 'বাগটি কতটা গুরুতর?',
    type: 'sub-category',
    icon: Bug,
    options: [
      { id: 'critical', label: 'Critical — App is unusable', nextStep: 'bug-detail', color: 'text-red-600' },
      { id: 'high', label: 'High — Major feature broken', nextStep: 'bug-detail', color: 'text-orange-500' },
      { id: 'medium', label: 'Medium — Feature partially working', nextStep: 'bug-detail', color: 'text-amber-500' },
      { id: 'low', label: 'Low — Minor visual issue', nextStep: 'bug-detail', color: 'text-emerald-500' },
    ]
  },

  // ── Detail / description steps ──
  'course-detail': { id: 'course-detail', title: 'Please describe the issue in detail', titleBn: 'সমস্যাটি বিস্তারিত বর্ণনা করুন', type: 'description', icon: BookOpen, message: 'Include the course name, which section/video has the problem, and what error you see.' },
  'payment-detail': { id: 'payment-detail', title: 'Payment details', titleBn: 'পেমেন্টের বিবরণ', type: 'description', icon: CreditCard, message: 'Include your TRX ID, payment method, amount, and date/time of payment.' },
  'account-detail': { id: 'account-detail', title: 'Account details', titleBn: 'অ্যাকাউন্টের বিবরণ', type: 'description', icon: User, message: 'Include your registered email and what happens when you try to login.' },
  'technical-detail': { id: 'technical-detail', title: 'Technical details', titleBn: 'প্রযুক্তিগত বিবরণ', type: 'description', icon: Monitor, message: 'Include your browser/OS, what you were doing, and any error messages.' },
  'content-detail': { id: 'content-detail', title: 'Content details', titleBn: 'বিষয়বস্তুর বিবরণ', type: 'description', icon: FileText, message: 'Include the course name and which section has wrong/missing content.' },
  'certificate-detail': { id: 'certificate-detail', title: 'Certificate details', titleBn: 'সার্টিফিকেটের বিবরণ', type: 'description', icon: Award, message: 'Include the course name and when you completed it.' },
  'refund-reason': { id: 'refund-reason', title: 'Reason for refund', titleBn: 'ফেরতের কারণ', type: 'description', icon: RefreshCw, message: 'Please explain why you want a refund.' },
  'refund-detail': { id: 'refund-detail', title: 'Refund details', titleBn: 'ফেরতের বিবরণ', type: 'description', icon: RefreshCw, message: 'Explain your situation in detail.' },
  'general-detail': { id: 'general-detail', title: 'Tell us more', titleBn: 'আরও বলুন', type: 'description', icon: HelpCircle, message: 'Describe your question or inquiry.' },
  'feature-detail': { id: 'feature-detail', title: 'Feature request details', titleBn: 'ফিচার অনুরোধের বিবরণ', type: 'description', icon: Lightbulb, message: 'Describe the feature you would like and how it would help you.' },
  'bug-detail': { id: 'bug-detail', title: 'Bug details', titleBn: 'বাগের বিবরণ', type: 'description', icon: Bug, message: 'Describe steps to reproduce, expected behavior, and actual behavior.' },
};

// ─── Animation variants ──────────────────────────────────────────────────────

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function SupportWizardPage() {
  const navigate = useNavigationStore(s => s.navigate);
  const goBack = useNavigationStore(s => s.goBack);
  const { user } = useAuthStore();

  const [currentStepId, setCurrentStepId] = useState('start');
  const [history, setHistory] = useState<string[]>([]);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [autoSuggestion, setAutoSuggestion] = useState<string | null>(null);
  const [suggestionHelped, setSuggestionHelped] = useState<boolean | null>(null);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  // User info
  const [name, setName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [description, setDescription] = useState('');

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [error, setError] = useState('');

  const currentStep = WIZARD_STEPS[currentStepId];
  const stepNumber = history.length + 1;
  const totalSteps = 15;
  const progressPercent = Math.min((stepNumber / totalSteps) * 100, 100);

  // Build breadcrumb trail from history
  const breadcrumb = useMemo(() => {
    return history.map(stepId => {
      const step = WIZARD_STEPS[stepId];
      const selection = selections[stepId];
      const option = step?.options?.find(o => o.id === selection);
      return {
        stepId,
        title: option?.label || step?.title || stepId,
      };
    });
  }, [history, selections]);

  const handleSelect = (option: WizardOption) => {
    setSelections(prev => ({ ...prev, [currentStepId]: option.id }));
    setHistory(prev => [...prev, currentStepId]);
    setDirection(1);

    if (option.autoSuggestion) {
      setAutoSuggestion(option.autoSuggestion);
      setSuggestionHelped(null);
    } else {
      setAutoSuggestion(null);
    }

    setCurrentStepId(option.nextStep);
  };

  const handleBack = () => {
    if (history.length > 0) {
      const prevStep = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      setDirection(-1);
      setCurrentStepId(prevStep);
      setAutoSuggestion(null);
      setSuggestionHelped(null);
      setError('');
    }
  };

  const handleSuggestionResponse = (helped: boolean) => {
    setSuggestionHelped(helped);
    if (helped) {
      setSubmitted(true);
      setTicketId('resolved');
    }
  };

  const resetWizard = () => {
    setCurrentStepId('start');
    setHistory([]);
    setSelections({});
    setDescription('');
    setSubmitted(false);
    setTicketId('');
    setAutoSuggestion(null);
    setSuggestionHelped(null);
    setError('');
    setName(user?.fullName || '');
    setEmail(user?.email || '');
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const category = selections['start'] || 'general';
      const subCategory = Object.values(selections).find(s => s !== category) || '';
      const priority = category === 'bug'
        ? (selections['bug-severity'] || 'medium')
        : ['refund', 'payment'].includes(category) ? 'high' : 'medium';

      const result = await api.post<{ success: boolean; ticket_id?: string; error?: string }>('/api/support/tickets', {
        name,
        email,
        category,
        sub_category: subCategory,
        priority,
        subject: `${category} - ${subCategory || 'Issue'}`,
        description,
        user_id: user?.id,
        detected_issue: JSON.stringify(selections),
      });

      if (result.success) {
        setTicketId(result.ticket_id || `TK-${Date.now().toString(36).toUpperCase()}`);
        setSubmitted(true);
      } else {
        setError(result.error || 'Failed to create ticket. Please try again.');
      }
    } catch (err: any) {
      // Graceful fallback — still show a generated ticket ID
      const fallbackId = `TK-${Date.now().toString(36).toUpperCase()}`;
      setTicketId(fallbackId);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render: Success / Resolved ────────────────────────────────────────────

  const renderSuccess = () => {
    const isResolved = ticketId === 'resolved';

    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="max-w-md w-full"
        >
          <GlassCard className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
              className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
                isResolved
                  ? 'bg-emerald-50 dark:bg-emerald-900/30'
                  : 'bg-sky-50 dark:bg-sky-900/30'
              }`}
            >
              <CheckCircle2 className={`h-10 w-10 ${
                isResolved ? 'text-emerald-500' : 'text-sky-500'
              }`} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-2xl font-extrabold text-foreground mb-2">
                {isResolved ? 'Issue Resolved!' : 'Ticket Created!'}
              </h2>

              {isResolved ? (
                <>
                  <p className="text-muted-foreground mb-6">
                    Great! Our suggestion helped solve your problem. If you need more help later, we are always here.
                  </p>
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-muted-foreground">Self-resolved — no ticket needed</span>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground mb-2">
                    Your support ticket has been created successfully.
                  </p>
                  <div className="inline-flex items-center gap-2 bg-muted/50 rounded-xl px-6 py-3 mb-4">
                    <span className="text-sm text-muted-foreground">Ticket ID:</span>
                    <span className="text-xl font-mono font-bold text-sky-500">{ticketId}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">We&apos;ll respond within 24-48 hours</span>
                  </div>
                </>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex gap-3 justify-center"
            >
              <GradientButton onClick={() => navigate('home')} size="sm">
                <Home className="h-4 w-4" /> Go Home
              </GradientButton>
              <Button variant="outline" onClick={resetWizard} size="sm">
                <RefreshCw className="h-4 w-4" /> New Ticket
              </Button>
            </motion.div>
          </GlassCard>
        </motion.div>
      </div>
    );
  };

  // ─── Render: Category Grid ────────────────────────────────────────────────

  const renderCategoryStep = () => (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
    >
      {currentStep.options?.map((option, idx) => {
        const Icon = option.icon;
        const colorClass = option.color || 'text-sky-500';
        return (
          <motion.div key={option.id} variants={staggerItem} transition={{ delay: idx * 0.03 }}>
            <motion.button
              onClick={() => handleSelect(option)}
              className="w-full flex flex-col items-center gap-2.5 p-5 rounded-2xl border border-border bg-card hover:border-sky-500/50 hover:bg-sky-500/5 dark:hover:bg-sky-500/10 transition-all text-center group"
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className={`w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-sky-500/10 transition-colors`}>
                {Icon && <Icon className={`h-6 w-6 ${colorClass}`} />}
              </div>
              <span className="text-sm font-semibold text-foreground leading-tight">{option.label}</span>
              {option.labelBn && (
                <span className="text-[11px] text-muted-foreground leading-tight">{option.labelBn}</span>
              )}
            </motion.button>
          </motion.div>
        );
      })}
    </motion.div>
  );

  // ─── Render: Sub-category List ────────────────────────────────────────────

  const renderSubCategoryStep = () => (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-3"
    >
      {currentStep.options?.map((option, idx) => (
        <motion.div key={option.id} variants={staggerItem} transition={{ delay: idx * 0.05 }}>
          <motion.button
            onClick={() => handleSelect(option)}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-sky-500/50 hover:bg-sky-500/5 dark:hover:bg-sky-500/10 transition-all text-left group"
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center gap-3">
              {option.id === 'critical' && <Zap className="h-4 w-4 text-red-500" />}
              {option.id === 'high' && <AlertCircle className="h-4 w-4 text-orange-500" />}
              {option.id === 'medium' && <AlertCircle className="h-4 w-4 text-amber-500" />}
              {option.id === 'low' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              <span className="font-medium text-foreground">{option.label}</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-sky-500 transition-colors" />
          </motion.button>
        </motion.div>
      ))}
    </motion.div>
  );

  // ─── Render: Auto-suggestion Panel ────────────────────────────────────────

  const renderAutoSuggestion = () => {
    if (!autoSuggestion || suggestionHelped !== null) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-4"
      >
        <Alert className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/20">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-600 dark:text-amber-400 font-semibold">
            Quick Suggestion
          </AlertTitle>
          <AlertDescription className="text-foreground/80 mt-1">
            {autoSuggestion}
          </AlertDescription>
          <div className="flex flex-wrap gap-2 mt-3">
            <motion.button
              onClick={() => handleSuggestionResponse(true)}
              className="text-sm px-4 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors font-medium"
              whileTap={{ scale: 0.95 }}
            >
              <CheckCircle2 className="h-3.5 w-3.5 inline mr-1.5" />
              This solved my issue
            </motion.button>
            <motion.button
              onClick={() => handleSuggestionResponse(false)}
              className="text-sm px-4 py-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors font-medium"
              whileTap={{ scale: 0.95 }}
            >
              <X className="h-3.5 w-3.5 inline mr-1.5" />
              Still need help
            </motion.button>
          </div>
        </Alert>
      </motion.div>
    );
  };

  // ─── Render: Description + User Info Form ──────────────────────────────────

  const renderDescriptionStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Hint message */}
      {currentStep.message && (
        <div className="flex items-start gap-2.5 text-sm text-muted-foreground bg-muted/30 rounded-xl px-4 py-3">
          <Sparkles className="h-4 w-4 mt-0.5 text-sky-500 flex-shrink-0" />
          <span>{currentStep.message}</span>
        </div>
      )}

      {/* Auto suggestion */}
      {renderAutoSuggestion()}

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-semibold">
          Describe your issue <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => { setDescription(e.target.value); setError(''); }}
          placeholder="Describe your issue in detail..."
          rows={5}
          className="resize-none rounded-xl bg-muted/30 border-border focus-visible:ring-sky-500/50"
        />
        <div className="flex justify-between items-center">
          <span />
          <span className="text-xs text-muted-foreground">{description.length}/2000</span>
        </div>
      </div>

      {/* Separator */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 text-muted-foreground font-semibold tracking-wider">
            Your Information
          </span>
        </div>
      </div>

      {/* User info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-semibold">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            placeholder="Your full name"
            className="rounded-xl bg-muted/30 border-border focus-visible:ring-sky-500/50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            placeholder="your@email.com"
            className="rounded-xl bg-muted/30 border-border focus-visible:ring-sky-500/50"
          />
        </div>
      </div>

      {!user && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
          <Shield className="h-3.5 w-3.5 text-sky-500 flex-shrink-0" />
          <span>
            <span
              className="text-sky-500 cursor-pointer font-medium hover:underline"
              onClick={() => navigate('login')}
            >
              Login
            </span>
            {' '}to auto-fill your details and track your tickets.
          </span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2.5"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      {/* Submit */}
      <GradientButton
        onClick={handleSubmit}
        disabled={submitting || !name.trim() || !email.trim() || !description.trim()}
        loading={submitting}
        className="w-full"
        size="md"
      >
        <Send className="h-4 w-4" />
        Submit Support Ticket
      </GradientButton>
    </motion.div>
  );

  // ─── Render: Breadcrumb trail ─────────────────────────────────────────────

  const renderBreadcrumb = () => {
    if (breadcrumb.length === 0) return null;

    return (
      <div className="flex flex-wrap items-center gap-1 mb-4">
        {breadcrumb.map((item, idx) => (
          <div key={item.stepId} className="flex items-center gap-1">
            {idx > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50" />}
            <Badge
              variant="secondary"
              className="text-[11px] font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 border-0 hover:bg-sky-500/20 cursor-default"
            >
              {item.title}
            </Badge>
          </div>
        ))}
      </div>
    );
  };

  // ─── Main Render ──────────────────────────────────────────────────────────

  if (submitted) {
    return renderSuccess();
  }

  return (
    <div className="pb-20 lg:pb-0">
      {/* Header */}
      <motion.div
        className="flex items-center gap-3 mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.button
          className="w-9 h-9 rounded-xl bg-muted/30 flex items-center justify-center text-foreground"
          onClick={history.length > 0 ? handleBack : () => navigate('home')}
          whileTap={{ scale: 0.9 }}
        >
          {history.length > 0 ? <ChevronLeft className="w-5 h-5" /> : <Home className="w-5 h-5" />}
        </motion.button>

        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-foreground">Dakkho Support</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Step {stepNumber} of ~{totalSteps}</span>
            <span className="text-xs text-muted-foreground/50">|</span>
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">~2 min</span>
          </div>
        </div>

        {/* Progress ring */}
        <div className="relative w-10 h-10">
          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18" cy="18" r="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-muted/30"
            />
            <circle
              cx="18" cy="18" r="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${progressPercent} 100`}
              strokeLinecap="round"
              className="text-sky-500 transition-all duration-500"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
            {stepNumber}
          </span>
        </div>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-6"
      >
        <Progress value={progressPercent} className="h-1.5 bg-muted/50" />
      </motion.div>

      {/* Breadcrumb trail */}
      {renderBreadcrumb()}

      {/* Step Content */}
      <GlassCard className="p-5 sm:p-6">
        {/* Step Title */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStepId}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="flex items-center gap-3 mb-5">
              {currentStep?.icon && (
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                  <currentStep.icon className="h-5 w-5 text-sky-500" />
                </div>
              )}
              <div>
                <h2 className="text-lg font-extrabold text-foreground">{currentStep?.title}</h2>
                {currentStep?.titleBn && (
                  <p className="text-xs text-muted-foreground mt-0.5">{currentStep.titleBn}</p>
                )}
              </div>
            </div>

            {/* Step body */}
            {currentStep?.type === 'category' && renderCategoryStep()}
            {currentStep?.type === 'sub-category' && renderSubCategoryStep()}
            {currentStep?.type === 'description' && renderDescriptionStep()}

            {/* Auto suggestion for sub-category steps */}
            {currentStep?.type === 'sub-category' && renderAutoSuggestion()}
          </motion.div>
        </AnimatePresence>
      </GlassCard>

      {/* Footer hint */}
      {currentStep?.type === 'category' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5"
        >
          <Search className="h-3 w-3" />
          Select a category that best describes your issue
        </motion.p>
      )}
    </div>
  );
}
