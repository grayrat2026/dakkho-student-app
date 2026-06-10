'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Compass, BookOpen, Bell, User, Menu, Search,
  ChevronRight, X, Sparkles, Rocket,
} from 'lucide-react';

const TOUR_STORAGE_KEY = 'dakkho-tour-completed';

interface TourStep {
  target: string;
  title: string;
  description: string;
  icon: React.ElementType;
  position: 'center' | 'bottom' | 'top';
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'home',
    title: 'Welcome to DAKKHO!',
    description: 'Your learning journey starts here. Let us show you around the app so you can get the most out of it.',
    icon: Rocket,
    position: 'center',
  },
  {
    target: 'bottom-nav',
    title: 'Quick Navigation',
    description: 'Use the bottom navigation to switch between Home, Explore, Courses, History, and Profile — anytime, anywhere.',
    icon: Compass,
    position: 'bottom',
  },
  {
    target: 'search',
    title: 'Find Anything',
    description: 'Search for courses, instructors, topics, and more from the top search bar.',
    icon: Search,
    position: 'top',
  },
  {
    target: 'sidebar',
    title: 'Explore More',
    description: 'Tap the menu icon to access Departments, Semesters, Exams, Community, and all app features.',
    icon: Menu,
    position: 'top',
  },
  {
    target: 'notifications',
    title: 'Stay Updated',
    description: 'Get notified about new courses, announcements, and progress updates. Never miss an important update!',
    icon: Bell,
    position: 'top',
  },
  {
    target: 'profile',
    title: 'Your Space',
    description: 'Customize your profile, track learning stats, manage bookmarks, and configure app settings.',
    icon: User,
    position: 'bottom',
  },
];

export function AppTour() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Check if tour should be shown (new users only)
  useEffect(() => {
    try {
      const completed = localStorage.getItem(TOUR_STORAGE_KEY);
      const authSession = localStorage.getItem('dakkho-auth-session');
      if (!completed && authSession) {
        const parsed = JSON.parse(authSession);
        if (parsed.user?.isNewUser) {
          const timer = setTimeout(() => setIsVisible(true), 1500);
          return () => clearTimeout(timer);
        }
      }
    } catch {}
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleClose();
    }
  }, [currentStep, handleClose]);

  const handleSkip = useCallback(() => {
    handleClose();
  }, [handleClose]);

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const isFirstStep = currentStep === 0;
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  const positionClass = step.position === 'bottom'
    ? 'bottom-24 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[420px]'
    : step.position === 'top'
      ? 'top-20 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[420px]'
      : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[440px]';

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleSkip}
      />

      {/* Tour Card */}
      <motion.div
        key={currentStep}
        className={`fixed z-[101] ${positionClass}`}
        initial={{ opacity: 0, y: step.position === 'bottom' ? 30 : step.position === 'top' ? -30 : 0, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: step.position === 'bottom' ? 30 : -30, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-muted/30">
            <motion.div
              className="h-full bg-gradient-to-r from-sky-500 to-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          <div className="p-6">
            {/* Skip button */}
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {currentStep + 1} of {TOUR_STEPS.length}
              </span>
              <motion.button
                className="text-xs text-muted-foreground hover:text-foreground font-semibold px-2 py-1 rounded-lg hover:bg-muted/30 transition-colors"
                onClick={handleSkip}
                whileTap={{ scale: 0.9 }}
              >
                Skip
              </motion.button>
            </div>

            {/* Icon with micro-animation */}
            <motion.div
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30 mb-4"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
            >
              <step.icon className="w-7 h-7 text-white" />
            </motion.div>

            {/* Title */}
            <motion.h2
              className="text-xl font-extrabold text-foreground mb-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              {step.title}
            </motion.h2>

            {/* Description */}
            <motion.p
              className="text-sm text-muted-foreground leading-relaxed mb-6"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {step.description}
            </motion.p>

            {/* Step dots + Action buttons */}
            <div className="flex items-center justify-between">
              {/* Step indicator dots */}
              <div className="flex gap-1.5">
                {TOUR_STEPS.map((_, i) => (
                  <motion.div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentStep
                        ? 'w-6 bg-gradient-to-r from-sky-500 to-blue-600'
                        : i < currentStep
                          ? 'w-1.5 bg-sky-400'
                          : 'w-1.5 bg-muted/50'
                    }`}
                    initial={i === currentStep ? { scale: 0.8 } : {}}
                    animate={i === currentStep ? { scale: 1 } : {}}
                  />
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                {!isFirstStep && (
                  <motion.button
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                    onClick={() => setCurrentStep((s) => s - 1)}
                    whileTap={{ scale: 0.95 }}
                  >
                    Back
                  </motion.button>
                )}
                <motion.button
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-bold shadow-lg shadow-sky-500/25"
                  onClick={handleNext}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isLastStep ? (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Get Started
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
