'use client';

import { motion } from 'framer-motion';
import {
  Info, Target, Users, Mail, Phone, MapPin,
  ChevronDown, Heart, Globe, GraduationCap, BookOpen, Sparkles,
  Loader2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { GlassCard } from '../shared/GlassCard';
import { api } from '@/lib/api-client';

// ─── Icon map ───
const ICON_MAP: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string }>> = {
  'book-open': BookOpen,
  'graduation-cap': GraduationCap,
  'globe': Globe,
  'sparkles': Sparkles,
  'heart': Heart,
  'users': Users,
  'info': Info,
  'target': Target,
};

// ─── Fallback data (used if API fails) ───
const FALLBACK_CONTENT = {
  aboutText: "DAKKHO is Bangladesh's premier online learning platform built exclusively for polytechnic students. We provide high-quality video courses aligned with the BTEB curriculum, covering all major technologies from Web Development and Electronics to Civil Engineering and Architecture. Our platform connects students with expert instructors from across the country, making quality technical education accessible regardless of location or financial background.",
  missionText: "To democratize technical education in Bangladesh by providing world-class learning experiences to every polytechnic student. We believe that geographical boundaries or financial constraints should never be barriers to quality education. Through technology, community, and dedicated instructors, we are building the future skilled workforce of Bangladesh.",
  contactEmail: 'support@dakkho.com.bd',
  contactPhone1: '+8809638113227',
  contactPhone2: '+8801632373707',
  contactAddress: 'Radhaballav Road near DPHE, Rangpur',
  missionValues: ['Accessible Education', 'Quality Content', 'Student First', 'Innovation'],
};

const FALLBACK_STATS = [
  { label: 'Courses', value: '50+', icon: 'book-open' },
  { label: 'Students', value: '10K+', icon: 'graduation-cap' },
  { label: 'Instructors', value: '50+', icon: 'users' },
  { label: 'Institutes', value: '58', icon: 'users' },
];

const FALLBACK_TEAM = [
  { name: 'Engr. Aminul Islam', role: 'Founder & CEO', icon: 'graduation-cap' },
  { name: 'Dr. Nadia Rahman', role: 'Chief Academic Officer', icon: 'book-open' },
  { name: 'Fahim Shahriar', role: 'Lead Developer', icon: 'globe' },
  { name: 'Sumaiya Khan', role: 'Head of Content', icon: 'sparkles' },
];

const FALLBACK_FAQ = [
  { question: 'What is DAKKHO?', answer: 'DAKKHO is a comprehensive online learning platform designed specifically for polytechnic students in Bangladesh. We offer video courses, live sessions, assignments, and certifications aligned with the BTEB curriculum.' },
  { question: 'Is DAKKHO free to use?', answer: 'Many courses on DAKKHO are completely free. Premium courses are available at affordable prices with financial aid options for deserving students. We believe quality education should be accessible to everyone.' },
  { question: 'How do I earn certificates?', answer: 'Complete a course and pass all assignments with the required grade to earn a certificate. Certificates are digital and can be downloaded or shared directly from your profile.' },
  { question: 'Can I access courses offline?', answer: 'Yes! You can download courses for offline viewing through our Downloads feature. Downloaded content is available without an internet connection for up to 30 days.' },
  { question: 'Who are the instructors?', answer: 'Our instructors are experienced educators and industry professionals from polytechnic institutes across Bangladesh. They are vetted and trained to deliver high-quality, engaging content.' },
  { question: 'How do I get help if I am stuck?', answer: 'Use the Discussion section to ask questions, join live Q&A sessions with instructors, or reach out to our support team via email or phone. We are here to help you succeed.' },
];

// ─── Mission value icons ───
const VALUE_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string }>> = {
  'Accessible Education': Globe,
  'Quality Content': BookOpen,
  'Student First': Heart,
  'Innovation': Sparkles,
};

function getValueIcon(label: string) {
  return VALUE_ICONS[label] || Sparkles;
}

export function AboutPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [content, setContent] = useState(FALLBACK_CONTENT);
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [team, setTeam] = useState(FALLBACK_TEAM);
  const [faq, setFaq] = useState(FALLBACK_FAQ);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.get<{
          content: typeof FALLBACK_CONTENT;
          stats: Array<{ label: string; value: string; icon: string; id?: number; sort_order?: number; is_active?: number }>;
          team: Array<{ name: string; role: string; icon: string; id?: number; sort_order?: number; is_active?: number }>;
          faq: Array<{ question: string; answer: string; id?: number; sort_order?: number; is_active?: number }>;
        }>('/api/about');

        if (!mounted) return;
        if (data.content) setContent({ ...FALLBACK_CONTENT, ...data.content });
        if (data.stats && data.stats.length > 0) setStats(data.stats);
        if (data.team && data.team.length > 0) setTeam(data.team);
        if (data.faq && data.faq.length > 0) setFaq(data.faq);
      } catch {
        // Use fallback data on error — already set
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // Build contact items
  const contactItems = [
    { icon: Mail, label: 'Email', value: content.contactEmail },
    { icon: Phone, label: 'Phone', value: content.contactPhone1 },
  ];
  if (content.contactPhone2) {
    contactItems.push({ icon: Phone, label: 'Phone (Alt)', value: content.contactPhone2 });
  }
  contactItems.push({ icon: MapPin, label: 'Address', value: content.contactAddress });

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
          <Info className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold gradient-text">About DAKKHO</h1>
          <p className="text-sm text-muted-foreground">Learn more about our platform</p>
        </div>
      </motion.div>

      {/* About Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlassCard className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold gradient-text mb-2">About DAKKHO</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {content.aboutText}
              </p>
              <div className="flex items-center gap-4 mt-4 flex-wrap">
                {stats.map((stat, i) => {
                  const StatIcon = ICON_MAP[stat.icon] || BookOpen;
                  return (
                    <div key={i} className="text-center">
                      <p className="text-2xl font-bold gradient-text">{stat.value}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
                        <StatIcon className="w-3 h-3" />
                        {stat.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Mission Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <GlassCard className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mb-2">Our Mission</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {content.missionText}
              </p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {content.missionValues.map((value, vi) => {
                  const ValueIcon = getValueIcon(value);
                  return (
                    <motion.div
                      key={value}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + vi * 0.05 }}
                    >
                      <ValueIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-xs font-semibold">{value}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Team Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-amber-600 dark:text-amber-400">Our Team</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {team.map((member, i) => {
              const MemberIcon = ICON_MAP[member.icon] || Users;
              return (
                <motion.div
                  key={member.name}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <MemberIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </GlassCard>
      </motion.div>

      {/* Contact Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold gradient-text">Contact Us</h2>
          </div>
          <div className="space-y-3">
            {contactItems.map((contact, ci) => (
              <motion.div
                key={contact.label}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + ci * 0.05 }}
              >
                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                  <contact.icon className="w-4 h-4 text-sky-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{contact.label}</p>
                  <p className="text-sm font-semibold">{contact.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Info className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold gradient-text">FAQ</h2>
          </div>
          <div className="space-y-2">
            {faq.map((item, i) => (
              <motion.div
                key={i}
                className="rounded-xl overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
              >
                <button
                  className="w-full flex items-center justify-between p-3 text-left bg-muted/30 hover:bg-muted/50 rounded-xl transition-colors"
                  onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                >
                  <span className="text-sm font-semibold pr-4">{item.question}</span>
                  <motion.div
                    animate={{ rotate: openFAQ === i ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </motion.div>
                </button>
                <motion.div
                  initial={false}
                  animate={{
                    height: openFAQ === i ? 'auto' : 0,
                    opacity: openFAQ === i ? 1 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="text-sm text-muted-foreground px-3 pb-3 pt-1 leading-relaxed">
                    {item.answer}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
