'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Users, Clock, BookOpen, Play, ChevronLeft, Heart, Share2, Award, CheckCircle, ChevronDown, User, Layers, Puzzle, Sparkles, FileText, HelpCircle, StickyNote, MoreHorizontal, Lock, Eye } from 'lucide-react';
import { useNavigationStore, useBookmarkStore, useAuthStore } from '@/lib/store';
import { type Course, type Instructor, type Video, type Chapter, type Lesson, type LearningPoint, courseApi, categoryApi, enrollmentApi, paymentApi, packageApi } from '@/lib/api-client';
import { formatDuration, getLevelColor } from '@/lib/utils';
import { GlassCard } from '../shared/GlassCard';
import { GradientButton } from '../shared/GradientButton';
import { ProgressBar } from '../shared/ProgressBar';
import { CourseCardGrid } from '../shared/CourseCardGrid';
import { LoadingSkeleton } from '../shared/LoadingSkeleton';

// Lesson type badge config
const LESSON_TYPE_CONFIG: Record<string, { icon: typeof BookOpen; label: string; color: string; bg: string; darkBg: string }> = {
  lecture: { icon: BookOpen, label: 'Lecture', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50', darkBg: 'dark:bg-blue-900/20' },
  unit: { icon: Layers, label: 'Unit', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50', darkBg: 'dark:bg-purple-900/20' },
  part: { icon: Puzzle, label: 'Part', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50', darkBg: 'dark:bg-amber-900/20' },
  extra_class: { icon: Sparkles, label: 'Extra Class', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-900/20' },
  assignment: { icon: FileText, label: 'Assignment', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50', darkBg: 'dark:bg-orange-900/20' },
  quiz: { icon: HelpCircle, label: 'Quiz', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50', darkBg: 'dark:bg-red-900/20' },
  note: { icon: StickyNote, label: 'Note', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50', darkBg: 'dark:bg-teal-900/20' },
  other: { icon: MoreHorizontal, label: 'Other', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50', darkBg: 'dark:bg-gray-900/20' },
};

function LessonTypeBadge({ type }: { type: string }) {
  const config = LESSON_TYPE_CONFIG[type] || LESSON_TYPE_CONFIG.other;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${config.color} ${config.bg} ${config.darkBg}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

export function CourseDetailPage() {
  const { pageParams, navigate, goBack } = useNavigationStore();
  const { isBookmarked, toggleBookmark } = useBookmarkStore();

  // Initialize activeTab from URL params
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'reviews' | 'instructor'>(() => {
    const tabParam = pageParams.tab as string;
    if (tabParam && ['overview', 'curriculum', 'reviews', 'instructor'].includes(tabParam)) {
      return tabParam as 'overview' | 'curriculum' | 'reviews' | 'instructor';
    }
    return 'overview';
  });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ 'section-1': true });

  const courseId = pageParams.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [learningPoints, setLearningPoints] = useState<LearningPoint[]>([]);
  const [relatedCourses, setRelatedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Enrollment state
  const { user, isAuthenticated } = useAuthStore();
  const [enrollmentStatus, setEnrollmentStatus] = useState<{
    enrolled: boolean;
    paymentStatus: string;
  }>({ enrolled: false, paymentStatus: 'none' });
  const [packages, setPackages] = useState<any[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Handle tab changes — update URL
  const handleTabChange = (tab: 'overview' | 'curriculum' | 'reviews' | 'instructor') => {
    setActiveTab(tab);
    if (courseId) {
      navigate('course-detail', { courseId, tab });
    }
  };

  useEffect(() => {
    if (!courseId) { setLoading(false); return; }

    setLoading(true);
    // Fetch course details
    courseApi.get(courseId)
      .then((res) => {
        const c = res.course;
        setCourse(c);

        // Set instructors from API (multiple instructors support)
        setInstructors(res.instructors);

        // Check enrollment status
        if (isAuthenticated) {
          enrollmentApi.check(courseId)
            .then((res) => setEnrollmentStatus({ enrolled: res.enrolled, paymentStatus: res.paymentStatus }))
            .catch(() => {});
        }
        // Fetch packages
        packageApi.list(courseId)
          .then((res) => setPackages(res.packages))
          .catch(() => {});

        // Fetch curriculum data (chapters, lessons, videos, learning points)
        courseApi.curriculum(courseId)
          .then((currRes) => {
            setChapters(currRes.chapters);
            setLessons(currRes.lessons);
            setVideos(currRes.videos);
            setLearningPoints(currRes.learningPoints);
          })
          .catch(() => {
            // Fallback: fetch videos only if curriculum endpoint fails
            courseApi.videos(courseId)
              .then((vidRes) => setVideos(vidRes.videos))
              .catch(() => {});
          });

        // Fetch related courses (same technology/category)
        if (c.categoryId) {
          courseApi.list({ technology: c.categoryId, limit: 5 })
            .then((courseRes) => {
              setRelatedCourses(courseRes.courses.filter((rc) => rc.id !== c.id).slice(0, 4));
            })
            .catch(() => {});
        }
      })
      .catch(() => setCourse(null))
      .finally(() => setLoading(false));
  }, [courseId]);

  // Sync activeTab from URL params when they change externally (e.g., back/forward)
  useEffect(() => {
    const tabParam = pageParams.tab as string;
    const validTabs = ['overview', 'curriculum', 'reviews', 'instructor'];
    if (tabParam && validTabs.includes(tabParam)) {
      // Use microtask to avoid synchronous setState in effect body
      queueMicrotask(() => setActiveTab(tabParam as 'overview' | 'curriculum' | 'reviews' | 'instructor'));
    }
  }, [pageParams.tab]);

  const bookmarked = course ? isBookmarked(course.id) : false;

  // What You'll Learn items — use learningPoints from API if available, else fallback to tag-based generation
  const learnings = useMemo(() => {
    if (learningPoints.length > 0) {
      return learningPoints
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((lp) => lp.pointText);
    }
    // Fallback: generate from tags
    if (!course) return [];
    return [
      `Master the fundamentals of ${course.tags[0] || course.title.split(' ').slice(0, 2).join(' ')}`,
      `Build real-world projects with hands-on practice`,
      `Understand core concepts and industry best practices`,
      `Prepare effectively for BTEB examinations`,
      `Gain practical skills for professional development`,
      ...(course.tags.length > 1 ? [`Work with ${course.tags.slice(1).join(', ')} technologies`] : []),
    ];
  }, [learningPoints, course]);

  // Determine if the course has chapters (new curriculum structure)
  const hasChapters = chapters.length > 0;

  // Build the structured curriculum for the new hierarchy
  const structuredCurriculum = useMemo(() => {
    if (!hasChapters) return null;

    // Group chapters, sort by sortOrder
    const sortedChapters = [...chapters]
      .filter((ch) => ch.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return sortedChapters.map((chapter) => {
      // Get lessons for this chapter
      const chapterLessons = lessons
        .filter((l) => l.chapterId === chapter.id && l.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      // Group lessons by type
      const lessonsWithType = chapterLessons.map((lesson) => {
        const lessonVideos = videos
          .filter((v) => v.lessonId === lesson.id)
          .sort((a, b) => a.order - b.order);
        return { ...lesson, videos: lessonVideos };
      });

      // Total duration for this chapter
      const totalDuration = lessonsWithType.reduce(
        (sum, l) => sum + l.videos.reduce((vSum, v) => vSum + v.duration, 0) + l.duration,
        0
      );

      const totalVideos = lessonsWithType.reduce((sum, l) => sum + l.videos.length, 0);

      return {
        ...chapter,
        lessons: lessonsWithType,
        totalDuration,
        totalVideos,
      };
    });
  }, [hasChapters, chapters, lessons, videos]);

  // Legacy section grouping (flat video list)
  const sections = useMemo(() => {
    if (hasChapters) return [];
    return videos.length > 0
      ? Array.from(
          { length: Math.ceil(videos.length / 8) },
          (_, i) => ({
            id: `section-${i + 1}`,
            title: `Section ${i + 1}: ${i === 0 ? 'Fundamentals' : i === 1 ? 'Core Concepts' : i === 2 ? 'Advanced Topics' : 'Projects & Practice'}`,
            videos: videos.slice(i * 8, (i + 1) * 8),
          })
        )
      : [];
  }, [hasChapters, videos]);

  // Curriculum stats
  const curriculumStats = useMemo(() => {
    if (hasChapters && structuredCurriculum) {
      const totalChapters = structuredCurriculum.length;
      const totalLessons = structuredCurriculum.reduce((sum, ch) => sum + ch.lessons.length, 0);
      const totalVids = structuredCurriculum.reduce((sum, ch) => sum + ch.totalVideos, 0);
      const totalDur = structuredCurriculum.reduce((sum, ch) => sum + ch.totalDuration, 0);
      return { chapters: totalChapters, lessons: totalLessons, videos: totalVids, duration: totalDur };
    }
    return { chapters: 0, lessons: 0, videos: videos.length, duration: course?.duration ?? 0 };
  }, [hasChapters, structuredCurriculum, videos.length, course?.duration]);

  // Cheapest package for display
  const cheapestPackage = useMemo(() => {
    if (packages.length === 0) return null;
    return packages.reduce((a: any, b: any) => a.price < b.price ? a : b);
  }, [packages]);

  if (loading) {
    return (
      <div className="pb-20 lg:pb-0">
        <LoadingSkeleton type="video" className="mb-6" />
        <LoadingSkeleton type="line" count={3} className="mb-4" />
        <LoadingSkeleton type="card" count={2} />
      </div>
    );
  }

  if (!course) {
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
        <div className={`relative aspect-video md:aspect-[21/9] ${course.thumbnailUrl ? '' : 'bg-gradient-to-br ' + colorClass}`}>
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                if (target.parentElement) {
                  target.parentElement.classList.add('bg-gradient-to-br', colorClass);
                }
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-20 h-20 text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h1 className="text-xl md:text-2xl font-extrabold mb-2">{course.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {instructors.length > 0 && <span>by {instructors.map(i => i.name).join(', ')}</span>}
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
                onClick={() => handleTabChange(tab.key)}
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
                    {course.semester != null && (
                      <div className="flex items-center gap-2 text-sm">
                        <Layers className="w-4 h-4 text-sky-500" />
                        <span className="text-muted-foreground">Semester: <span className="font-semibold text-foreground">{course.semester}</span></span>
                      </div>
                    )}
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

                {/* What You'll Learn */}
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

                {/* Instructors Card */}
                {instructors.length > 0 && (
                  <GlassCard className="p-6">
                    <h2 className="text-lg font-bold mb-4">{instructors.length === 1 ? 'Your Instructor' : 'Your Instructors'}</h2>
                    <div className="space-y-4">
                      {instructors.map((inst) => (
                        <div key={inst.id} className="flex items-start gap-4">
                          <motion.div
                            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-extrabold flex-shrink-0 overflow-hidden"
                            whileHover={{ scale: 1.1 }}
                          >
                            {inst.avatarUrl ? (
                              <img src={inst.avatarUrl} alt={inst.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
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
                  {hasChapters && (
                    <>
                      <span className="text-muted-foreground">{curriculumStats.chapters} chapters</span>
                      <span className="text-muted-foreground">{curriculumStats.lessons} lessons</span>
                    </>
                  )}
                  {!hasChapters && (
                    <span className="text-muted-foreground">{sections.length} sections</span>
                  )}
                  <span className="text-muted-foreground">{curriculumStats.videos} lectures</span>
                  <span className="text-muted-foreground">{formatDuration(curriculumStats.duration)} total</span>
                </GlassCard>

                {/* New curriculum: Subject → Chapter → Lesson → Video */}
                {hasChapters && structuredCurriculum ? structuredCurriculum.map((chapter, ci) => {
                  const isExpanded = expandedSections[chapter.id] ?? ci === 0;
                  return (
                    <motion.div
                      key={chapter.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: ci * 0.05 }}
                    >
                      <GlassCard className="overflow-hidden">
                        {/* Chapter header */}
                        <button
                          className="w-full p-4 flex items-center justify-between text-left"
                          onClick={() => toggleSection(chapter.id)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center text-sky-500 text-xs font-bold">
                              {ci + 1}
                            </span>
                            <div>
                              <h3 className="text-sm font-bold text-foreground">{chapter.title}</h3>
                              <p className="text-xs text-muted-foreground">
                                {chapter.lessons.length} lesson{chapter.lessons.length !== 1 ? 's' : ''} &middot; {chapter.totalVideos} video{chapter.totalVideos !== 1 ? 's' : ''} &middot; {formatDuration(chapter.totalDuration)}
                              </p>
                            </div>
                          </div>
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          </motion.div>
                        </button>

                        {/* Lessons and videos */}
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
                                {chapter.lessons.map((lesson, li) => (
                                  <div key={lesson.id}>
                                    {/* Lesson header */}
                                    <div className="px-4 py-2.5 bg-muted/20 flex items-center gap-2">
                                      <LessonTypeBadge type={lesson.lessonType} />
                                      <span className="text-sm font-semibold text-foreground line-clamp-1">{lesson.title}</span>
                                                      {lesson.isPreview && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20">
                                  <Eye className="w-2.5 h-2.5" />
                                  Preview
                                </span>
                              )}
                                      <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">{formatDuration(lesson.duration || lesson.videos.reduce((s, v) => s + v.duration, 0))}</span>
                                    </div>
                                    {/* Videos within lesson */}
                                    {lesson.videos.map((video, vi) => (
                                      <motion.div
                                        key={video.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: vi * 0.03 }}
                                        className="flex items-center gap-4 px-6 py-3 hover:bg-white/30 dark:hover:bg-slate-800/30 transition-colors cursor-pointer border-b border-white/10 dark:border-white/5 last:border-b-0"
                                        onClick={() => navigate('video-player', { videoId: video.id, courseId: course.id })}
                                      >
                                        <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground font-medium text-[10px] flex-shrink-0">
                                          {vi + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h4 className="text-sm font-medium text-foreground line-clamp-1">{video.title}</h4>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-muted-foreground">{formatDuration(video.duration)}</span>
                                            {video.isPreview && (
                                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                <Eye className="w-2.5 h-2.5" />
                                                Preview
                                              </span>
                                            )}
                                            {video.lessonType && !video.isPreview && (
                                              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                                <Lock className="w-2.5 h-2.5" />
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <Play className="w-4 h-4 text-sky-500 flex-shrink-0" />
                                      </motion.div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </GlassCard>
                    </motion.div>
                  );
                }) : !hasChapters && sections.length > 0 ? sections.map((section, si) => {
                  // Legacy flat section grouping
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
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-muted-foreground">{formatDuration(video.duration)}</span>
                                        {video.isPreview && (
                                          <span className="text-xs text-emerald-500 font-medium">Preview</span>
                                        )}
                                      </div>
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
                {[1, 2, 3].map((r) => (
                  <div key={r} className="border-t border-white/20 dark:border-white/5 pt-4 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                        {String.fromCharCode(64 + r)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Student {r}</p>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map((s) => (
                            <Star key={s} className={`w-3 h-3 ${s <= 4 ? 'text-amber-400 fill-amber-400' : 'text-muted'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Great course! Very well explained and easy to follow.</p>
                  </div>
                ))}
              </GlassCard>
            )}

            {activeTab === 'instructor' && instructors.length > 0 && (
              <div className="space-y-4">
                {instructors.map((inst) => (
                  <GlassCard key={inst.id} className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <motion.div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-extrabold overflow-hidden"
                        whileHover={{ scale: 1.1 }}
                      >
                        {inst.avatarUrl ? (
                          <img src={inst.avatarUrl} alt={inst.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
                            {inst.name.charAt(0)}
                          </div>
                        )}
                      </motion.div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{inst.name}</h3>
                        <p className="text-sm text-sky-500 font-semibold">{inst.specialization}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{inst.bio}</p>
                    <div className="flex gap-6 text-sm">
                      <div><span className="font-bold text-foreground">{inst.totalStudents.toLocaleString()}</span> <span className="text-muted-foreground">students</span></div>
                      <div><span className="font-bold text-foreground">{inst.totalCourses}</span> <span className="text-muted-foreground">courses</span></div>
                      <div><span className="font-bold text-foreground">{inst.rating}</span> <span className="text-muted-foreground">rating</span></div>
                    </div>
                    <motion.button
                      className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 text-xs font-semibold"
                      onClick={() => navigate('instructor-profile', { instructorId: inst.id })}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <User className="w-3 h-3" />
                      View Full Profile
                    </motion.button>
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

            {/* Enrollment button logic */}
            {enrollmentStatus.enrolled ? (
              <GradientButton className="w-full" size="lg" onClick={() => navigate('video-player', { videoId: videos[0]?.id, courseId: course.id })}>
                <Play className="w-4 h-4" />
                Start Learning
              </GradientButton>
            ) : enrollmentStatus.paymentStatus === 'pending' ? (
              <GradientButton className="w-full opacity-70" size="lg" disabled>
                <Clock className="w-4 h-4" />
                Payment Processing...
              </GradientButton>
            ) : course.price <= 0 || (packages.length > 0 && packages.some((p: any) => p.price === 0)) ? (
              <GradientButton className="w-full" size="lg" disabled={isEnrolling} onClick={async () => {
                setIsEnrolling(true);
                try {
                  const freePkg = packages.find((p: any) => p.price === 0);
                  await enrollmentApi.enrollFree({ course_id: course.id, package_id: freePkg?.id });
                  setEnrollmentStatus({ enrolled: true, paymentStatus: 'completed' });
                } catch (err: any) {
                  console.error('Free enrollment failed:', err);
                } finally {
                  setIsEnrolling(false);
                }
              }}>
                <Play className="w-4 h-4" />
                {isEnrolling ? 'Enrolling...' : 'Enroll for Free'}
              </GradientButton>
            ) : (
              <GradientButton className="w-full" size="lg" onClick={() => {
                setSelectedPackage(cheapestPackage);
                setShowCheckout(true);
              }}>
                <Play className="w-4 h-4" />
                Enroll Now{cheapestPackage ? ` - ৳${cheapestPackage.price}` : course.price > 0 ? ` - ৳${course.price}` : ''}
              </GradientButton>
            )}

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
              {course.semester != null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Semester</span>
                  <span className="font-semibold">{course.semester}</span>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <GlassCard className="w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold">Complete Your Enrollment</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Course</span>
                <span className="font-medium line-clamp-1 ml-4">{course.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Package</span>
                <span className="font-medium">{selectedPackage.package_type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">{selectedPackage.duration_months ? `${selectedPackage.duration_months} months` : 'Lifetime'}</span>
              </div>
              <div className="border-t border-white/10 dark:border-white/5 pt-3 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-extrabold text-sky-500">৳{selectedPackage.price}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCheckout(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <GradientButton
                className="flex-1"
                onClick={async () => {
                  try {
                    const res = await paymentApi.create({
                      course_id: course.id,
                      package_id: selectedPackage.id,
                    });
                    if (res.pp_url) {
                      // Store order_id in localStorage so PaymentStatusPage can poll status
                      if (res.order_id) {
                        localStorage.setItem('dakkho_pending_order_id', res.order_id);
                      }
                      window.location.href = res.pp_url;
                    }
                  } catch (err: any) {
                    console.error('Payment creation failed:', err);
                  }
                }}
              >
                Pay with bKash/Nagad/Card
              </GradientButton>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Related Courses */}
      {relatedCourses.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-extrabold text-foreground mb-4">Related Courses</h2>
          <CourseCardGrid courses={relatedCourses} />
        </div>
      )}

      {/* Sticky enroll/continue button on mobile */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-white/50 dark:border-white/10 lg:hidden z-40">
        {enrollmentStatus.enrolled ? (
          <GradientButton
            className="w-full"
            size="lg"
            onClick={() => navigate('video-player', { videoId: videos[0]?.id, courseId: course.id })}
          >
            <Play className="w-4 h-4" />
            Start Learning
          </GradientButton>
        ) : enrollmentStatus.paymentStatus === 'pending' ? (
          <GradientButton className="w-full opacity-70" size="lg" disabled>
            <Clock className="w-4 h-4" />
            Payment Processing...
          </GradientButton>
        ) : course.price <= 0 || (packages.length > 0 && packages.some((p: any) => p.price === 0)) ? (
          <GradientButton
            className="w-full"
            size="lg"
            disabled={isEnrolling}
            onClick={async () => {
              setIsEnrolling(true);
              try {
                const freePkg = packages.find((p: any) => p.price === 0);
                await enrollmentApi.enrollFree({ course_id: course.id, package_id: freePkg?.id });
                setEnrollmentStatus({ enrolled: true, paymentStatus: 'completed' });
              } catch (err: any) {
                console.error('Free enrollment failed:', err);
              } finally {
                setIsEnrolling(false);
              }
            }}
          >
            <Play className="w-4 h-4" />
            {isEnrolling ? 'Enrolling...' : 'Enroll for Free'}
          </GradientButton>
        ) : (
          <GradientButton
            className="w-full"
            size="lg"
            onClick={() => {
              setSelectedPackage(cheapestPackage);
              setShowCheckout(true);
            }}
          >
            <Play className="w-4 h-4" />
            Enroll Now{cheapestPackage ? ` - ৳${cheapestPackage.price}` : course.price > 0 ? ` - ৳${course.price}` : ''}
          </GradientButton>
        )}
      </div>
    </div>
  );
}
