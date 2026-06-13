'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Users, Clock, BookOpen, Play, ChevronLeft, Heart, Share2, Award, CheckCircle, ChevronDown, User, X, Package, CreditCard, Loader2, Shield, Tag, ArrowRight, AlertCircle, Wallet } from 'lucide-react';
import { useNavigationStore, useBookmarkStore, useAuthStore } from '@/lib/store';
import { useCourse, useCategories, useCourseVideos, useCourses } from '@/lib/data-hooks';
import { formatDuration, getLevelColor } from '@/lib/mock-data';
import { packageApi, paymentApi, couponApi, userLookupApi } from '@/lib/api-client';
import type { CoursePackage, PaymentConfig } from '@/lib/api-client';
import { GlassCard } from '../shared/GlassCard';
import { GradientButton } from '../shared/GradientButton';
import { ProgressBar } from '../shared/ProgressBar';
import { CourseCardGrid } from '../shared/CourseCardGrid';

// Package type visual config
function getPackageTypeInfo(type: string): { label: string; labelBn: string; icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string; borderColor: string; description: string } {
  switch (type) {
    case 'single':
      return { label: 'Single', labelBn: 'সিঙ্গেল', icon: User, color: 'text-sky-600 dark:text-sky-400', bgColor: 'bg-sky-50 dark:bg-sky-900/30', borderColor: 'border-sky-300 dark:border-sky-700', description: '1 জন ইউজারের জন্য' };
    case 'dual':
      return { label: 'Duo', labelBn: 'ডুও', icon: Users, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-900/30', borderColor: 'border-emerald-300 dark:border-emerald-700', description: '2 জন ইউজারের জন্য — বন্ধুকে শেয়ার করুন!' };
    case 'friend':
      return { label: 'Friend Pack', labelBn: 'ফ্রেন্ড প্যাক', icon: Users, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-900/30', borderColor: 'border-emerald-300 dark:border-emerald-700', description: '2 জন ইউজারের জন্য — বন্ধুকে শেয়ার করুন!' };
    case 'custom':
      return { label: 'Custom', labelBn: 'কাস্টম', icon: Package, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/30', borderColor: 'border-purple-300 dark:border-purple-700', description: '5 জন পর্যন্ত ইউজার — গ্রুপে শেখা!' };
    case 'basic':
      return { label: 'Basic', labelBn: 'বেসিক', icon: Package, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-900/30', borderColor: 'border-emerald-300 dark:border-emerald-700', description: 'বেসিক প্যাকেজ' };
    case 'standard':
      return { label: 'Standard', labelBn: 'স্ট্যান্ডার্ড', icon: Package, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/30', borderColor: 'border-blue-300 dark:border-blue-700', description: 'স্ট্যান্ডার্ড প্যাকেজ' };
    case 'premium':
      return { label: 'Premium', labelBn: 'প্রিমিয়াম', icon: Package, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/30', borderColor: 'border-purple-300 dark:border-purple-700', description: 'প্রিমিয়াম প্যাকেজ' };
    default:
      return { label: type, labelBn: type, icon: Package, color: 'text-muted-foreground', bgColor: 'bg-muted/30', borderColor: 'border-muted', description: '' };
  }
}

export function CourseDetailPage() {
  const { pageParams, navigate, goBack } = useNavigationStore();
  const { isBookmarked, toggleBookmark } = useBookmarkStore();
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'reviews' | 'instructor'>('overview');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ 'section-1': true });

  // Package selection modal state
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [coursePackages, setCoursePackages] = useState<CoursePackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<CoursePackage | null>(null);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [paymentConfigs, setPaymentConfigs] = useState<PaymentConfig[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

  // Coupon state
  const [coupon, setCoupon] = useState({
    code: '', valid: null as boolean | null, coupon: null as any, error: null as string | null, isValidating: false,
  });

  // Manual payment form
  const [trxId, setTrxId] = useState('');
  const [phone, setPhone] = useState('');

  // Duo member email state
  const [duoMemberEmail, setDuoMemberEmail] = useState('');
  const [duoUser, setDuoUser] = useState<{ id: string; name: string; email: string; technology: string | null; instituteName: string | null; avatarUrl: string | null } | null>(null);
  const [duoLookupLoading, setDuoLookupLoading] = useState(false);
  const [duoLookupError, setDuoLookupError] = useState('');
  const [enrollmentStep, setEnrollmentStep] = useState<'package' | 'details' | 'payment'>('package');

  const courseId = pageParams.courseId as string;
  const { data: course, instructors: courseInstructors, loading: courseLoading, error: courseError } = useCourse(courseId);
  const { data: categories } = useCategories();
  const { data: videos = [] } = useCourseVideos(courseId);
  const { data: allCourses = [] } = useCourses();
  const bookmarked = course ? isBookmarked(course.id) : false;

  // Category from categories list
  const category = course ? categories.find((c) => c.id === course.categoryId) : undefined;

  // Related courses - same category, different course
  const relatedCourses = course
    ? allCourses.filter((c) => c.categoryId === course.categoryId && c.id !== course.id).slice(0, 4)
    : [];

  // What You'll Learn items — only use real data from the API
  const learnings: string[] = course?.learningItems ?? [];

  // Group videos into sections
  const sections = videos.length > 0
    ? Array.from(
        { length: Math.ceil(videos.length / 8) },
        (_, i) => ({
          id: `section-${i + 1}`,
          title: `Section ${i + 1}`,
          videos: videos.slice(i * 8, (i + 1) * 8),
        })
      )
    : [];

  // Fetch packages when modal opens
  const fetchPackages = useCallback(async () => {
    if (!courseId) return;
    setIsLoadingPackages(true);
    try {
      const res = await packageApi.list(courseId);
      setCoursePackages((res.packages || []).filter((p: CoursePackage) => p.is_active === 1));
    } catch {
      setCoursePackages([]);
    } finally {
      setIsLoadingPackages(false);
    }
  }, [courseId]);

  // Fetch payment configs
  const fetchPaymentConfigs = useCallback(async () => {
    try {
      const res = await paymentApi.config();
      setPaymentConfigs(res.paymentConfig || []);
    } catch {
      setPaymentConfigs([]);
    }
  }, []);

  // Open package modal
  const handleEnrollClick = () => {
    if (!isAuthenticated) {
      navigate('login');
      return;
    }
    setShowPackageModal(true);
    setSelectedPackage(null);
    setSubmitResult(null);
    setCoupon({ code: '', valid: null, coupon: null, error: null, isValidating: false });
    setTrxId('');
    setPhone('');
    setDuoMemberEmail('');
    setDuoUser(null);
    setDuoLookupError('');
    setEnrollmentStep('package');
    fetchPackages();
    fetchPaymentConfigs();
  };

  // Coupon validation
  const handleValidateCoupon = async () => {
    if (!coupon.code.trim() || !selectedPackage) return;
    setCoupon((prev) => ({ ...prev, isValidating: true, valid: null, error: null, coupon: null }));
    try {
      const res = await couponApi.validate(coupon.code.trim());
      if (res.valid) {
        setCoupon((prev) => ({ ...prev, valid: true, coupon: res.coupon, error: null, isValidating: false }));
      } else {
        setCoupon((prev) => ({ ...prev, valid: false, coupon: null, error: res.error || 'Invalid coupon code', isValidating: false }));
      }
    } catch (err: any) {
      setCoupon((prev) => ({ ...prev, valid: false, coupon: null, error: err.message || 'Failed to validate coupon', isValidating: false }));
    }
  };

  const getDiscountedPrice = (): number => {
    if (!selectedPackage || !coupon.valid || !coupon.coupon) return Math.round(selectedPackage?.price || 0);
    if (coupon.coupon.discount_type === 'percentage') {
      return Math.round(Math.max(0, selectedPackage.price - (selectedPackage.price * coupon.coupon.discount_value / 100)));
    }
    if (coupon.coupon.discount_type === 'flat') {
      return Math.round(Math.max(0, selectedPackage.price - coupon.coupon.discount_value));
    }
    return Math.round(selectedPackage?.price || 0);
  };

  // Lookup duo member by email
  const handleDuoEmailLookup = async () => {
    if (!duoMemberEmail.trim()) return;
    setDuoLookupLoading(true);
    setDuoLookupError('');
    setDuoUser(null);
    try {
      const res = await userLookupApi.lookup(duoMemberEmail.trim());
      if (res.found && res.user) {
        setDuoUser(res.user);
      } else {
        setDuoUser(null);
        setDuoLookupError('No account found with this email. They can still be added after payment.');
      }
    } catch {
      setDuoUser(null);
      setDuoLookupError('Lookup failed. You can still proceed.');
    } finally {
      setDuoLookupLoading(false);
    }
  };

  // PipraPay payment
  const handlePipraPay = async () => {
    if (!selectedPackage) return;
    setIsSubmitting(true);
    setSubmitResult(null);
    try {
      const res = await paymentApi.create({
        packageId: selectedPackage.id,
        couponCode: coupon.valid && coupon.code ? coupon.code : undefined,
        duoMemberEmail: selectedPackage.package_type === 'dual' && duoMemberEmail.trim() ? duoMemberEmail.trim() : undefined,
      });
      if (res.pp_url) {
        window.location.href = res.pp_url;
      } else {
        setSubmitResult({ success: false, message: 'Payment gateway did not return a URL.' });
      }
    } catch (err: any) {
      setSubmitResult({ success: false, message: err.message || 'Payment creation failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manual payment
  const handleManualPayment = async () => {
    if (!selectedPackage || !trxId.trim()) return;
    setIsSubmitting(true);
    setSubmitResult(null);
    try {
      const data: { package_id: number; trx_id: string; phone?: string; duoMemberEmail?: string } = {
        package_id: selectedPackage.id,
        trx_id: trxId.trim(),
      };
      if (phone.trim()) data.phone = phone.trim();
      if (selectedPackage.package_type === 'dual' && duoMemberEmail.trim()) data.duoMemberEmail = duoMemberEmail.trim();
      const res = await paymentApi.submit(data);
      if (res.success) {
        setSubmitResult({ success: true, message: 'Payment submitted! Admin will verify shortly.' });
      } else {
        setSubmitResult({ success: false, message: res.message || 'Payment submission failed.' });
      }
    } catch (err: any) {
      setSubmitResult({ success: false, message: err.message || 'Something went wrong.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (courseLoading) {
    return (
      <div className="text-center py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted/30 rounded-lg w-1/2 mx-auto"></div>
          <div className="h-4 bg-muted/30 rounded w-3/4 mx-auto"></div>
          <div className="h-64 bg-muted/20 rounded-xl mx-auto max-w-4xl"></div>
        </div>
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-bold">Course not found</p>
        <GradientButton onClick={goBack} className="mt-4">Go Back</GradientButton>
      </div>
    );
  }

  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'curriculum' as const, label: 'Curriculum' },
    { key: 'reviews' as const, label: 'Reviews' },
    { key: 'instructor' as const, label: 'Instructor' },
  ];

  const thumbnailColors = [
    'from-sky-400 to-blue-600',
    'from-emerald-400 to-teal-600',
    'from-purple-400 to-indigo-600',
    'from-amber-400 to-orange-600',
  ];
  const colorClass = thumbnailColors[course.id.charCodeAt(1) % thumbnailColors.length];

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const hasPipraPay = paymentConfigs.some(c => c.gateway === 'piprapay');
  const hasManual = paymentConfigs.some(c => c.gateway === 'manual');

  return (
    <div className="pb-20 lg:pb-0">
      {/* Breadcrumb */}
      <motion.div
        className="flex items-center gap-2 text-sm text-muted-foreground mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <button onClick={() => navigate('home')} className="hover:text-sky-500 transition-colors">Home</button>
        <span>/</span>
        <button onClick={() => navigate('explore')} className="hover:text-sky-500 transition-colors">Courses</button>
        <span>/</span>
        <span className="text-foreground font-semibold line-clamp-1">{course.title}</span>
      </motion.div>

      {/* Course header */}
      <GlassCard className="overflow-hidden mb-6">
        <div className={`relative aspect-video md:aspect-[21/9] bg-gradient-to-br ${colorClass}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-20 h-20 text-white/20" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            {category && (
              <span className="text-xs font-bold uppercase tracking-wider text-white/70 mb-2 block">{category.name}</span>
            )}
            <h1 className="text-xl md:text-2xl font-extrabold mb-2">{course.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {courseInstructors.length > 0 && (
                <span>by {courseInstructors.map(inst => inst.name).join(', ')}</span>
              )}
              <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-400 fill-amber-400" />{course.rating}</span>
              <span className="flex items-center gap-1"><Users className="w-4 h-4" />{course.totalStudents} students</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatDuration(course.duration)}</span>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-muted/30 rounded-xl p-1">
            {tabs.map((tab) => (
              <motion.button
                key={tab.key}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-white dark:bg-slate-800 shadow-sm text-sky-600 dark:text-sky-400'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab(tab.key)}
                whileTap={{ scale: 0.97 }}
              >
                {tab.label}
              </motion.button>
            ))}
          </div>

          {/* Tab content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* About This Course */}
                <GlassCard className="p-6 space-y-4">
                  <h2 className="text-lg font-bold">About This Course</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{course.description}</p>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="w-4 h-4 text-sky-500" />
                      <span className="text-muted-foreground">Level: <span className="font-semibold text-foreground">{course.level}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-sky-500" />
                      <span className="text-muted-foreground">Duration: <span className="font-semibold text-foreground">{formatDuration(course.duration)}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="w-4 h-4 text-sky-500" />
                      <span className="text-muted-foreground">Videos: <span className="font-semibold text-foreground">{course.totalVideos}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-sky-500" />
                      <span className="text-muted-foreground">Students: <span className="font-semibold text-foreground">{course.totalStudents}</span></span>
                    </div>
                  </div>
                  {course.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {course.tags.map((tag) => (
                        <span key={tag} className="px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 text-xs font-semibold">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </GlassCard>

                {/* What You'll Learn — only show if we have real data from the API */}
                {learnings.length > 0 && (
                  <GlassCard className="p-6">
                    <h2 className="text-lg font-bold mb-4">What You&apos;ll Learn</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {learnings.map((item, i) => (
                        <motion.div
                          key={i}
                          className="flex items-start gap-3"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground">{item}</span>
                        </motion.div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {/* Instructor Card(s) */}
                {courseInstructors.length > 0 && (
                  <GlassCard className="p-6">
                    <h2 className="text-lg font-bold mb-4">{courseInstructors.length === 1 ? 'Your Instructor' : 'Your Instructors'}</h2>
                    <div className="space-y-4">
                      {courseInstructors.map((inst) => (
                        <div key={inst.id} className="flex items-start gap-4">
                          <motion.div
                            className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden"
                            whileHover={{ scale: 1.1 }}
                          >
                            {inst.avatarUrl ? (
                              <img src={inst.avatarUrl} alt={inst.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-lg font-extrabold">
                                {inst.name.charAt(0)}
                              </div>
                            )}
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-foreground">{inst.name}</h3>
                            <p className="text-sm text-sky-500 font-semibold">{inst.specialization}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                {inst.rating} Rating
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {inst.totalStudents.toLocaleString()} Students
                              </span>
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {inst.totalCourses} Courses
                              </span>
                            </div>
                            <motion.button
                              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 text-xs font-semibold"
                              onClick={() => navigate('instructor-profile', { instructorId: inst.id })}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <User className="w-3 h-3" />
                              View Full Profile
                            </motion.button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}
              </div>
            )}

            {activeTab === 'curriculum' && (
              <div className="space-y-3">
                {/* Overview stats */}
                <GlassCard className="p-4 flex items-center gap-6 text-sm">
                  <span className="text-muted-foreground">{sections.length} sections</span>
                  <span className="text-muted-foreground">{videos.length} lectures</span>
                  <span className="text-muted-foreground">{formatDuration(course.duration)} total</span>
                </GlassCard>

                {/* Expandable sections */}
                {sections.length > 0 ? sections.map((section, si) => {
                  const isExpanded = expandedSections[section.id] ?? false;
                  return (
                    <motion.div
                      key={section.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: si * 0.05 }}
                    >
                      <GlassCard className="overflow-hidden">
                        {/* Section header */}
                        <button
                          className="w-full p-4 flex items-center justify-between text-left"
                          onClick={() => toggleSection(section.id)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center text-sky-500 text-xs font-bold">
                              {si + 1}
                            </span>
                            <div>
                              <h3 className="text-sm font-bold text-foreground">{section.title}</h3>
                              <p className="text-xs text-muted-foreground">{section.videos.length} lectures &middot; {formatDuration(section.videos.reduce((a, v) => a + v.duration, 0))}</p>
                            </div>
                          </div>
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          </motion.div>
                        </button>

                        {/* Section videos */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-white/20 dark:border-white/5">
                                {section.videos.map((video, vi) => (
                                  <motion.div
                                    key={video.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: vi * 0.03 }}
                                    className="flex items-center gap-4 px-4 py-3 hover:bg-white/30 dark:hover:bg-slate-800/30 transition-colors cursor-pointer border-b border-white/10 dark:border-white/5 last:border-b-0"
                                    onClick={() => navigate('video-player', { videoId: video.id, courseId: course.id })}
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground font-medium text-xs flex-shrink-0">
                                      {vi + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-sm font-medium text-foreground line-clamp-1">{video.title}</h4>
                                      <p className="text-xs text-muted-foreground mt-0.5">{formatDuration(video.duration)}{video.isPreview ? ' \u00B7 Preview' : ''}</p>
                                    </div>
                                    <Play className="w-4 h-4 text-sky-500 flex-shrink-0" />
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </GlassCard>
                    </motion.div>
                  );
                }) : (
                  <GlassCard className="p-8 text-center">
                    <p className="text-sm text-muted-foreground">No curriculum available yet</p>
                  </GlassCard>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <GlassCard className="p-6">
                <h2 className="text-lg font-bold mb-4">Reviews</h2>
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                  <p className="text-2xl font-extrabold text-foreground">{course.rating}</p>
                  <p className="text-sm text-muted-foreground">{course.totalReviews} reviews</p>
                </div>
                <div className="text-center py-8 border-t border-white/20 dark:border-white/5">
                  <Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-muted-foreground">No reviews yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Be the first to review this course!</p>
                </div>
              </GlassCard>
            )}

            {activeTab === 'instructor' && courseInstructors.length > 0 && (
              <div className="space-y-4">
                {courseInstructors.map((inst) => (
                  <GlassCard key={inst.id} className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <motion.div
                        className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0"
                        whileHover={{ scale: 1.1 }}
                      >
                        {inst.avatarUrl ? (
                          <img src={inst.avatarUrl} alt={inst.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-xl font-extrabold">
                            {inst.name.charAt(0)}
                          </div>
                        )}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-foreground">{inst.name}</h3>
                        <p className="text-sm text-sky-500 font-semibold">{inst.specialization}</p>
                      </div>
                      <motion.button
                        className="px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 text-xs font-semibold"
                        onClick={() => navigate('instructor-profile', { instructorId: inst.id })}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <User className="w-3 h-3 inline -mt-0.5" />
                        Profile
                      </motion.button>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{inst.bio}</p>
                    <div className="flex gap-6 text-sm">
                      <div><span className="font-bold text-foreground">{inst.totalStudents.toLocaleString()}</span> <span className="text-muted-foreground">students</span></div>
                      <div><span className="font-bold text-foreground">{inst.totalCourses}</span> <span className="text-muted-foreground">courses</span></div>
                      <div><span className="font-bold text-foreground">{inst.rating}</span> <span className="text-muted-foreground">rating</span></div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar */}
        <div>
          <GlassCard className="p-6 sticky top-20 space-y-4">
            <div className="flex items-center justify-between">
              {course.price > 0 ? (
                <span className="text-2xl font-extrabold text-foreground">&#2547;{course.price}</span>
              ) : (
                <span className="text-2xl font-extrabold text-emerald-500">Free</span>
              )}
              <div className="flex gap-2">
                <motion.button
                  className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center"
                  onClick={() => toggleBookmark(course.id)}
                  whileTap={{ scale: 0.9 }}
                >
                  <Heart className={`w-5 h-5 ${bookmarked ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
                </motion.button>
                <motion.button
                  className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center"
                  whileTap={{ scale: 0.9 }}
                >
                  <Share2 className="w-5 h-5 text-muted-foreground" />
                </motion.button>
              </div>
            </div>

            <GradientButton className="w-full" size="lg" onClick={() => {
              if (course.price > 0) {
                handleEnrollClick();
              } else {
                navigate('video-player', { videoId: videos[0]?.id, courseId: course.id });
              }
            }}>
              <Play className="w-4 h-4" />
              {course.price > 0 ? `Enroll Now — ৳${course.price}` : 'Start Learning'}
            </GradientButton>

            <div className="space-y-3 text-sm pt-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Level</span>
                <span className="font-semibold">{course.level.charAt(0).toUpperCase() + course.level.slice(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-semibold">{formatDuration(course.duration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Videos</span>
                <span className="font-semibold">{course.totalVideos}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Language</span>
                <span className="font-semibold">{course.language}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Students</span>
                <span className="font-semibold">{course.totalStudents.toLocaleString()}</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Related Courses */}
      {relatedCourses.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-extrabold text-foreground mb-4">Related Courses</h2>
          <CourseCardGrid courses={relatedCourses} />
        </div>
      )}

      {/* Sticky enroll/continue button on mobile */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-white/50 dark:border-white/10 lg:hidden z-40">
        <GradientButton
          className="w-full"
          size="lg"
          onClick={() => {
            if (course.price > 0) {
              handleEnrollClick();
            } else {
              navigate('video-player', { videoId: videos[0]?.id, courseId: course.id });
            }
          }}
        >
          <Play className="w-4 h-4" />
          {course.price > 0 ? `Enroll Now — ৳${course.price}` : 'Continue Learning'}
        </GradientButton>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* PACKAGE SELECTION MODAL */}
      {/* ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showPackageModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowPackageModal(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Modal Content */}
            <motion.div
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-2xl shadow-2xl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Handle bar (mobile) */}
              <div className="flex justify-center pt-3 md:hidden">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-extrabold text-foreground">Complete Your Enrollment</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Select a package and proceed to payment</p>
                </div>
                <button
                  onClick={() => setShowPackageModal(false)}
                  className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Course Info */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-sky-50/50 dark:bg-sky-900/20 border border-sky-200/50 dark:border-sky-700/30">
                  <BookOpen className="w-5 h-5 text-sky-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate">{course.title}</span>
                </div>

                {/* Loading packages */}
                {isLoadingPackages && (
                  <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Loading packages...</span>
                  </div>
                )}

                {/* No packages */}
                {!isLoadingPackages && coursePackages.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-muted-foreground">No packages available yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Please contact admin or try again later</p>
                  </div>
                )}

                {/* Package selection cards */}
                {!isLoadingPackages && coursePackages.length > 0 && !selectedPackage && (
                  <div className="space-y-3">
                    {coursePackages.map((pkg, i) => {
                      const typeInfo = getPackageTypeInfo(pkg.package_type);
                      const TypeIcon = typeInfo.icon;
                      return (
                        <motion.button
                          key={pkg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                          onClick={() => setSelectedPackage(pkg)}
                          className="w-full text-left p-4 rounded-xl border-2 border-white/30 dark:border-white/10 bg-white/30 dark:bg-slate-800/30 hover:border-sky-300 dark:hover:border-sky-700/50 hover:bg-sky-50/30 dark:hover:bg-sky-900/10 transition-all group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {/* Package type badge */}
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${typeInfo.bgColor} ${typeInfo.color}`}>
                                  <TypeIcon className="w-3.5 h-3.5" />
                                  {typeInfo.label}
                                </span>
                                {pkg.max_users > 1 && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                                    Best Value
                                  </span>
                                )}
                              </div>

                              {/* Description */}
                              <p className="text-sm text-muted-foreground">{typeInfo.description}</p>

                              {/* Details */}
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  Up to {pkg.max_users} user{pkg.max_users > 1 ? 's' : ''}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {pkg.duration_months} months
                                </span>
                              </div>
                            </div>

                            {/* Price */}
                            <div className="text-right ml-4 flex-shrink-0">
                              <p className="text-2xl font-extrabold text-foreground">&#2547;{Math.round(pkg.price)}</p>
                              <p className="text-[10px] text-muted-foreground">per package</p>
                            </div>
                          </div>

                          {/* Hover CTA */}
                          <div className="mt-3 pt-3 border-t border-white/10 dark:border-white/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">Select this plan</span>
                            <ArrowRight className="w-4 h-4 text-sky-500" />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {/* ─── SELECTED PACKAGE → PAYMENT ─── */}
                {selectedPackage && (
                  <div className="space-y-4">
                    {/* Back button */}
                    <button
                      onClick={() => {
                        setSelectedPackage(null);
                        setSubmitResult(null);
                        setCoupon({ code: '', valid: null, coupon: null, error: null, isValidating: false });
                        setTrxId('');
                        setPhone('');
                        setDuoMemberEmail('');
                        setDuoUser(null);
                        setDuoLookupError('');
                        setEnrollmentStep('package');
                      }}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-sky-500 transition-colors"
                    >
                      <ChevronDown className="w-3 h-3 rotate-90" />
                      Back to packages
                    </button>

                    {/* Duo member email section */}
                    {selectedPackage.package_type === 'dual' && (
                      <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-700/30">
                        <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mb-2">
                          <Users className="w-3.5 h-3.5" />
                          Duo Member Email
                        </label>
                        <p className="text-[11px] text-muted-foreground mb-2">Enter your partner&apos;s email. If they have a DAKKHO account, their profile will be shown.</p>
                        <div className="flex gap-2">
                          <input
                            type="email"
                            value={duoMemberEmail}
                            onChange={(e) => { setDuoMemberEmail(e.target.value); setDuoUser(null); setDuoLookupError(''); }}
                            placeholder="partner@email.com"
                            className="flex-1 h-9 px-3 rounded-lg border border-emerald-200 dark:border-emerald-700/50 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          />
                          <button
                            onClick={handleDuoEmailLookup}
                            disabled={duoLookupLoading || !duoMemberEmail.trim()}
                            className="px-3 h-9 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1"
                          >
                            {duoLookupLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                            Find
                          </button>
                        </div>
                        {/* Found user profile */}
                        {duoUser && (
                          <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700/50">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {duoUser.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">{duoUser.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{duoUser.technology || duoUser.instituteName || duoUser.email}</p>
                            </div>
                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          </div>
                        )}
                        {duoLookupError && !duoUser && (
                          <p className="mt-1.5 text-[10px] text-amber-600 dark:text-amber-400">{duoLookupError}</p>
                        )}
                      </div>
                    )}

                    {/* Order Summary */}
                    <div className="p-3 rounded-xl bg-sky-50/50 dark:bg-sky-900/20 border border-sky-200/50 dark:border-sky-700/30">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const typeInfo = getPackageTypeInfo(selectedPackage.package_type);
                          const TypeIcon = typeInfo.icon;
                          return (
                            <div className={`w-10 h-10 rounded-lg ${typeInfo.bgColor} flex items-center justify-center flex-shrink-0`}>
                              <TypeIcon className={`w-5 h-5 ${typeInfo.color}`} />
                            </div>
                          );
                        })()}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            {getPackageTypeInfo(selectedPackage.package_type).label} Package
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {selectedPackage.duration_months} months &middot; Up to {selectedPackage.max_users} user{selectedPackage.max_users > 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {coupon.valid && coupon.coupon ? (
                            <>
                              <p className="text-xs text-muted-foreground line-through">&#2547;{Math.round(selectedPackage.price)}</p>
                              <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">&#2547;{getDiscountedPrice()}</p>
                            </>
                          ) : (
                            <p className="text-lg font-extrabold text-foreground">&#2547;{Math.round(selectedPackage.price)}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Coupon Code */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-sky-500" />
                        <span className="text-xs font-semibold text-foreground">Have a coupon?</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Enter coupon code"
                          value={coupon.code}
                          onChange={(e) => setCoupon((prev) => ({
                            ...prev,
                            code: e.target.value.toUpperCase(),
                            valid: null,
                            error: null,
                          }))}
                          className="flex-1 px-3 py-2 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-white/30 dark:border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all uppercase tracking-wider font-mono"
                        />
                        <GradientButton
                          size="sm"
                          onClick={handleValidateCoupon}
                          disabled={!coupon.code.trim() || coupon.isValidating}
                          loading={coupon.isValidating}
                        >
                          Apply
                        </GradientButton>
                      </div>
                      {coupon.valid === true && coupon.coupon && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Coupon applied! You save &#2547;{(selectedPackage.price - getDiscountedPrice()).toFixed(0)}</span>
                        </motion.div>
                      )}
                      {coupon.valid === false && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5 text-xs text-red-500">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{coupon.error || 'Invalid coupon code'}</span>
                        </motion.div>
                      )}
                    </div>

                    {/* Error/Success result */}
                    {submitResult && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-start gap-2 p-3 rounded-xl ${
                          submitResult.success
                            ? 'bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-700/30'
                            : 'bg-red-50/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-700/30'
                        }`}
                      >
                        {submitResult.success ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        )}
                        <p className={`text-xs ${submitResult.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {submitResult.message}
                        </p>
                      </motion.div>
                    )}

                    {/* ─── PipraPay Payment ─── */}
                    {hasPipraPay && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-sky-500" />
                          <span className="text-sm font-bold text-foreground">Auto Payment</span>
                          <span className="text-[10px] text-muted-foreground">(bKash / Nagad / Rocket)</span>
                        </div>
                        <GradientButton
                          className="w-full"
                          size="lg"
                          onClick={handlePipraPay}
                          disabled={isSubmitting}
                          loading={isSubmitting}
                        >
                          <Wallet className="w-4 h-4" />
                          Pay &#2547;{coupon.valid && coupon.coupon ? getDiscountedPrice() : Math.round(selectedPackage.price)} Now
                        </GradientButton>
                        <div className="flex items-center gap-1 text-[10px] text-sky-500 justify-center">
                          <Shield className="w-3 h-3" />
                          Secure payment powered by PipraPay
                        </div>
                      </div>
                    )}

                    {/* ─── Divider ─── */}
                    {hasPipraPay && hasManual && (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-white/10 dark:bg-white/5" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">or pay manually</span>
                        <div className="flex-1 h-px bg-white/10 dark:bg-white/5" />
                      </div>
                    )}

                    {/* ─── Manual Payment ─── */}
                    {hasManual && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-sky-500" />
                          <span className="text-sm font-bold text-foreground">Manual Payment</span>
                        </div>
                        {paymentConfigs.find(c => c.gateway === 'manual')?.instructions && (
                          <div className="p-3 rounded-xl bg-white/30 dark:bg-slate-800/30 border border-white/20 dark:border-white/5 text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                            {paymentConfigs.find(c => c.gateway === 'manual')?.instructions}
                          </div>
                        )}
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Transaction ID (e.g. BKASH123ABC)"
                            value={trxId}
                            onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                            className="w-full px-3 py-2.5 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-white/30 dark:border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all font-mono uppercase tracking-wider"
                          />
                          <input
                            type="tel"
                            placeholder="Phone number (optional)"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-white/30 dark:border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all"
                          />
                          <GradientButton
                            className="w-full"
                            onClick={handleManualPayment}
                            disabled={isSubmitting || !trxId.trim()}
                            loading={isSubmitting}
                          >
                            Submit Payment
                          </GradientButton>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
