'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigationStore, useAuthStore, useNotificationStore, useServerConfigStore, urlToPage } from '@/lib/student-store';
import { ContentProtection } from '../student/ContentProtection';
import { AppShell } from '../student/AppShell';

// Auth pages
import { LoginPage } from '../student/auth/LoginPage';
import { SignupPage } from '../student/auth/SignupPage';
import { ForgotPasswordPage } from '../student/auth/ForgotPasswordPage';

// Main pages
import { HomePage } from '../student/home/HomePage';
import { ExplorePage } from '../student/explore/ExplorePage';
import { CourseDetailPage } from '../student/course/CourseDetailPage';
import { VideoPlayerPage } from '../student/video/VideoPlayerPage';
import { InstructorsPage } from '../student/instructor/InstructorsPage';
import { InstructorProfilePage } from '../student/instructor/InstructorProfilePage';
import { NotificationsPage } from '../student/notifications/NotificationsPage';
import { ProfilePage } from '../student/profile/ProfilePage';
import { MyCoursesPage } from '../student/courses/MyCoursesPage';
import { BookmarksPage } from '../student/bookmarks/BookmarksPage';
import { SearchPage } from '../student/search/SearchPage';
import { SettingsPage } from '../student/settings/SettingsPage';
import { HelpPage } from '../student/settings/HelpPage';
import { Error404Page } from '../student/error/Error404Page';
import { Error500Page } from '../student/error/Error500Page';
import { CategoryPage } from '../student/category/CategoryPage';
import { WatchHistoryPage } from '../student/history/WatchHistoryPage';
import { DownloadsPage } from '../student/downloads/DownloadsPage';
import { CertificatesPage } from '../student/certificates/CertificatesPage';
import { LiveSessionsPage } from '../student/live/LiveSessionsPage';
import { AchievementsPage } from '../student/achievements/AchievementsPage';
import { AssignmentPage } from '../student/assignment/AssignmentPage';
import { DiscussionPage } from '../student/discussion/DiscussionPage';
import { AboutPage } from '../student/about/AboutPage';

// Department pages
import { CSEPage } from '../student/department/CSEPage';
import { ETEPage } from '../student/department/ETEPage';
import { EEEPage } from '../student/department/EEEPage';
import { MEPage } from '../student/department/MEPage';
import { CEPage } from '../student/department/CEPage';
import { ArchitecturePage } from '../student/department/ArchitecturePage';
import { TextilePage } from '../student/department/TextilePage';
import { ChemicalPage } from '../student/department/ChemicalPage';
import { AutomobilePage } from '../student/department/AutomobilePage';
import { RACPage } from '../student/department/RACPage';
import { GlassCeramicPage } from '../student/department/GlassCeramicPage';
import { PrintingPage } from '../student/department/PrintingPage';
import { SurveyingPage } from '../student/department/SurveyingPage';
import { MechatronicsPage } from '../student/department/MechatronicsPage';
import { MiningPage } from '../student/department/MiningPage';
import { MetallurgicalPage } from '../student/department/MetallurgicalPage';
import { PowerPage } from '../student/department/PowerPage';
import { InstrumentationPage } from '../student/department/InstrumentationPage';
import { FoodPage } from '../student/department/FoodPage';
import { LeatherPage } from '../student/department/LeatherPage';

// Semester pages
import { Semester1Page } from '../student/semester/Semester1Page';
import { Semester2Page } from '../student/semester/Semester2Page';
import { Semester3Page } from '../student/semester/Semester3Page';
import { Semester4Page } from '../student/semester/Semester4Page';
import { Semester5Page } from '../student/semester/Semester5Page';
import { Semester6Page } from '../student/semester/Semester6Page';
import { Semester7Page } from '../student/semester/Semester7Page';
import { Semester8Page } from '../student/semester/Semester8Page';

// Course sub-pages
import { CourseCurriculumPage } from '../student/course/CourseCurriculumPage';
import { CourseReviewsPage } from '../student/course/CourseReviewsPage';
import { CourseQAPage } from '../student/course/CourseQAPage';
import { CourseAnnouncementsPage } from '../student/course/CourseAnnouncementsPage';
import { CourseResourcesPage } from '../student/course/CourseResourcesPage';
import { CourseNotesPage } from '../student/course/CourseNotesPage';
import { CourseQuizzesPage } from '../student/course/CourseQuizzesPage';
import { CourseProgressPage } from '../student/course/CourseProgressPage';

// Instructor sub-pages
import { InstructorCoursesPage } from '../student/instructor/InstructorCoursesPage';
import { InstructorReviewsPage } from '../student/instructor/InstructorReviewsPage';
import { InstructorSchedulePage } from '../student/instructor/InstructorSchedulePage';
import { InstructorContactPage } from '../student/instructor/InstructorContactPage';

// Profile sub-pages
import { EditProfilePage } from '../student/profile/EditProfilePage';
import { ChangePasswordPage } from '../student/profile/ChangePasswordPage';
import { LearningStatsPage } from '../student/profile/LearningStatsPage';
import { SubscriptionPage } from '../student/profile/SubscriptionPage';
import { ReferralPage } from '../student/profile/ReferralPage';
import { DeleteAccountPage } from '../student/profile/DeleteAccountPage';

// Settings sub-pages
import { AccountSettingsPage } from '../student/settings/AccountSettingsPage';
import { NotificationSettingsPage } from '../student/settings/NotificationSettingsPage';
import { PrivacySettingsPage } from '../student/settings/PrivacySettingsPage';
import { LanguageSettingsPage } from '../student/settings/LanguageSettingsPage';
import { ThemeSettingsPage } from '../student/settings/ThemeSettingsPage';
import { DownloadSettingsPage } from '../student/settings/DownloadSettingsPage';
import { VideoQualityPage } from '../student/settings/VideoQualityPage';
import { NetworkDataPage } from '../student/settings/NetworkDataPage';
import { ContentProtectionSettingsPage } from '../student/settings/ContentProtectionSettingsPage';
import { ActiveSessionsPage } from '../student/settings/ActiveSessionsPage';

// Help sub-pages
import { FAQPage } from '../student/help/FAQPage';
import { ContactSupportPage } from '../student/help/ContactSupportPage';
import { ReportIssuePage } from '../student/help/ReportIssuePage';
import { TermsOfServicePage } from '../student/help/TermsOfServicePage';
import { PrivacyPolicyPage } from '../student/help/PrivacyPolicyPage';
import { RefundPolicyPage } from '../student/help/RefundPolicyPage';

// Exam pages
import { ExamPrepPage } from '../student/exam/ExamPrepPage';
import { ExamSchedulePage } from '../student/exam/ExamSchedulePage';
import { ExamResultsPage } from '../student/exam/ExamResultsPage';
import { ExamPracticePage } from '../student/exam/ExamPracticePage';
import { ExamTipsPage } from '../student/exam/ExamTipsPage';

// Social/Community pages
import { LeaderboardPage } from '../student/social/LeaderboardPage';
import { StudyGroupsPage } from '../student/social/StudyGroupsPage';
import { PeerConnectionsPage } from '../student/social/PeerConnectionsPage';
import { CommunityPage } from '../student/social/CommunityPage';
import { FeedbackPage } from '../student/social/FeedbackPage';
import { RoadmapPage } from '../student/social/RoadmapPage';

// Misc pages
import { PricingPage } from '../student/misc/PricingPage';
import { ChangelogPage } from '../student/misc/ChangelogPage';
import { MaintenancePage } from '../student/misc/MaintenancePage';
import { TermsPage } from '../student/misc/TermsPage';
import { PrivacyPage } from '../student/misc/PrivacyPage';

function PageRouter() {
  const currentPage = useNavigationStore((s) => s.currentPage);
  const pageParams = useNavigationStore((s) => s.pageParams);

  const pages: Record<string, React.ReactNode> = {
    // Main pages
    home: <HomePage />,
    explore: <ExplorePage />,
    search: <SearchPage />,
    notifications: <NotificationsPage />,
    profile: <ProfilePage />,
    // Course pages
    'course-detail': <CourseDetailPage />,
    'video-player': <VideoPlayerPage />,
    'course-curriculum': <CourseCurriculumPage />,
    'course-reviews': <CourseReviewsPage />,
    'course-qa': <CourseQAPage />,
    'course-announcements': <CourseAnnouncementsPage />,
    'course-resources': <CourseResourcesPage />,
    'course-notes': <CourseNotesPage />,
    'course-quizzes': <CourseQuizzesPage />,
    'course-progress': <CourseProgressPage />,
    // Instructor pages
    instructors: <InstructorsPage />,
    'instructor-profile': <InstructorProfilePage />,
    'instructor-courses': <InstructorCoursesPage />,
    'instructor-reviews': <InstructorReviewsPage />,
    'instructor-schedule': <InstructorSchedulePage />,
    'instructor-contact': <InstructorContactPage />,
    // User pages
    'my-courses': <MyCoursesPage />,
    bookmarks: <BookmarksPage />,
    settings: <SettingsPage />,
    help: <HelpPage />,
    'watch-history': <WatchHistoryPage />,
    downloads: <DownloadsPage />,
    certificates: <CertificatesPage />,
    'live-sessions': <LiveSessionsPage />,
    achievements: <AchievementsPage />,
    assignment: <AssignmentPage />,
    discussion: <DiscussionPage />,
    about: <AboutPage />,
    // Department pages
    'dept-cse': <CSEPage />,
    'dept-ete': <ETEPage />,
    'dept-eee': <EEEPage />,
    'dept-me': <MEPage />,
    'dept-ce': <CEPage />,
    'dept-architecture': <ArchitecturePage />,
    'dept-textile': <TextilePage />,
    'dept-chemical': <ChemicalPage />,
    'dept-automobile': <AutomobilePage />,
    'dept-rac': <RACPage />,
    'dept-glass-ceramic': <GlassCeramicPage />,
    'dept-printing': <PrintingPage />,
    'dept-surveying': <SurveyingPage />,
    'dept-mechatronics': <MechatronicsPage />,
    'dept-mining': <MiningPage />,
    'dept-metallurgical': <MetallurgicalPage />,
    'dept-power': <PowerPage />,
    'dept-instrumentation': <InstrumentationPage />,
    'dept-food': <FoodPage />,
    'dept-leather': <LeatherPage />,
    // Semester pages
    'semester-1': <Semester1Page />,
    'semester-2': <Semester2Page />,
    'semester-3': <Semester3Page />,
    'semester-4': <Semester4Page />,
    'semester-5': <Semester5Page />,
    'semester-6': <Semester6Page />,
    'semester-7': <Semester7Page />,
    'semester-8': <Semester8Page />,
    // Profile sub-pages
    'edit-profile': <EditProfilePage />,
    'change-password': <ChangePasswordPage />,
    'learning-stats': <LearningStatsPage />,
    subscription: <SubscriptionPage />,
    referral: <ReferralPage />,
    'delete-account': <DeleteAccountPage />,
    // Settings sub-pages
    'settings-account': <AccountSettingsPage />,
    'settings-notifications': <NotificationSettingsPage />,
    'settings-privacy': <PrivacySettingsPage />,
    'settings-language': <LanguageSettingsPage />,
    'settings-theme': <ThemeSettingsPage />,
    'settings-downloads': <DownloadSettingsPage />,
    'settings-video-quality': <VideoQualityPage />,
    'settings-download-settings': <DownloadSettingsPage />,
    'settings-network-data': <NetworkDataPage />,
    'settings-content-protection': <ContentProtectionSettingsPage />,
    'settings-sessions': <ActiveSessionsPage />,
    // Help sub-pages
    faq: <FAQPage />,
    'contact-support': <ContactSupportPage />,
    'report-issue': <ReportIssuePage />,
    'terms-of-service': <TermsOfServicePage />,
    'privacy-policy': <PrivacyPolicyPage />,
    'refund-policy': <RefundPolicyPage />,
    // Exam pages
    'exam-prep': <ExamPrepPage />,
    'exam-schedule': <ExamSchedulePage />,
    'exam-results': <ExamResultsPage />,
    'exam-practice': <ExamPracticePage />,
    'exam-tips': <ExamTipsPage />,
    // Social/Community pages
    leaderboard: <LeaderboardPage />,
    'study-groups': <StudyGroupsPage />,
    'peer-connections': <PeerConnectionsPage />,
    community: <CommunityPage />,
    feedback: <FeedbackPage />,
    roadmap: <RoadmapPage />,
    // Category
    category: <CategoryPage />,
    // Misc pages
    pricing: <PricingPage />,
    changelog: <ChangelogPage />,
    maintenance: <MaintenancePage />,
    terms: <TermsPage />,
    privacy: <PrivacyPage />,
    // Error pages
    'error-404': <Error404Page />,
    'error-500': <Error500Page />,
  };

  const paramKey = (pageParams?.videoId || pageParams?.courseId || pageParams?.instructorId)
    ? `-${pageParams.videoId || ''}${pageParams.courseId || ''}${pageParams.instructorId || ''}`
    : '';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${currentPage}${paramKey}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        {pages[currentPage] || <Error404Page />}
      </motion.div>
    </AnimatePresence>
  );
}

export function StudentShell() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentPage = useNavigationStore((s) => s.currentPage);
  const navigate = useNavigationStore((s) => s.navigate);
  const syncFromUrl = useNavigationStore((s) => s.syncFromUrl);

  // Initialize server config on mount
  const fetchConfig = useServerConfigStore((s) => s.fetchConfig);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Sync from browser URL on initial load
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (currentPath !== '/') {
      syncFromUrl(currentPath);
    }
  }, []);

  // Listen for browser back/forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      syncFromUrl(currentPath);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [syncFromUrl]);

  // Auth pages (no shell)
  const authPageKeys = ['login', 'signup', 'forgot-password'];
  const redirectingRef = useRef(false);
  useEffect(() => {
    if (isAuthenticated && authPageKeys.includes(currentPage) && !redirectingRef.current) {
      redirectingRef.current = true;
      navigate('home');
      requestAnimationFrame(() => { redirectingRef.current = false; });
    }
  }, [isAuthenticated, currentPage, navigate]);

  // If not authenticated, let the UnifiedClientPage handle it (show UnifiedLoginPage)
  if (!isAuthenticated) {
    return null;
  }

  // If authenticated and still on an auth page, show loading while redirecting
  if (authPageKeys.includes(currentPage)) {
    return null;
  }

  // Authenticated pages (with shell)
  return (
    <ContentProtection>
      <AppShell>
        <PageRouter />
      </AppShell>
    </ContentProtection>
  );
}
