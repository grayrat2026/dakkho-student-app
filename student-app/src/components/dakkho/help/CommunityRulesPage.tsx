'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, ChevronLeft, Heart, Users, AlertTriangle,
  Ban, CheckCircle, BookOpen, Globe, Loader2, Scale, Lock, MessageCircle,
} from 'lucide-react';
import { useNavigationStore } from '@/lib/store';
import { GlassCard } from '../shared/GlassCard';
import { termsApi, type TermsContent } from '@/lib/api-client';

// ─── Markdown → HTML renderer (matches TermsOfServicePage / PrivacyPolicyPage) ───
function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hulo])/gm, '<p>')
    .replace(/(?<![>])$/gm, '</p>');
}

// ─── Fallback rules displayed when the API is unreachable ───
const FALLBACK_RULES = [
  {
    icon: Heart,
    title: 'Be Respectful',
    titleBn: 'সম্মানজনক আচরণ করুন',
    color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20',
    description:
      'Treat every member with dignity and kindness. Harassment, bullying, hate speech, or discriminatory language of any kind will not be tolerated. We are all here to learn together.',
    descriptionBn:
      'প্রতিটি সদস্যের প্রতি সম্মান ও সদয় আচরণ করুন। হয়রানি, বুলিং, ঘৃণামূলক বক্তব্য বা বৈষম্যমূলক ভাষা কোনোভাবেই সহ্য করা হবে না। আমরা সবাই একসাথে শিখতে এসেছি।',
  },
  {
    icon: BookOpen,
    title: 'Academic Integrity',
    titleBn: 'শিক্ষাগত সততা',
    color: 'text-sky-500 bg-sky-50 dark:bg-sky-900/20',
    description:
      'Do not share exam answers, plagiarize content, or help others cheat. Academic dishonesty undermines the value of education for everyone and may result in immediate account termination.',
    descriptionBn:
      'পরীক্ষার উত্তর শেয়ার করবেন না, কন্টেন্ট চুরি করবেন না, বা অন্যদের প্রতারণা করতে সাহায্য করবেন না। শিক্ষাগত অসততা সবার জন্য শিক্ষার মূল্য কমিয়ে দেয় এবং অ্যাকাউন্ট বাতিলের কারণ হতে পারে।',
  },
  {
    icon: Lock,
    title: 'Content Protection',
    titleBn: 'কন্টেন্ট সুরক্ষা',
    color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
    description:
      'Do not record, screenshot, download, or redistribute course content in any form. Our content protection measures are in place to protect the hard work of our instructors. Violations will result in immediate account termination and may lead to legal action.',
    descriptionBn:
      'কোনো রূপে কোর্সের কন্টেন্ট রেকর্ড, স্ক্রিনশট, ডাউনলোড বা পুনরায় বিতরণ করবেন না। আমাদের ইনস্ট্রাক্টরদের কঠোর পরিশ্রম রক্ষার জন্য কন্টেন্ট সুরক্ষা ব্যবস্থা আছে। লঙ্ঘন করলে অ্যাকাউন্ট তৎক্ষণাৎ বাতিল হবে এবং আইনি ব্যবস্থা নেওয়া হতে পারে।',
  },
  {
    icon: Users,
    title: 'Collaborate Constructively',
    titleBn: 'গঠনমূলক সহযোগিতা',
    color: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20',
    description:
      'Share knowledge, ask thoughtful questions, and help fellow learners succeed. Keep discussions relevant, constructive, and on-topic. Constructive feedback is always welcome; personal attacks are not.',
    descriptionBn:
      'জ্ঞান শেয়ার করুন, চিন্তাশীল প্রশ্ন করুন, এবং সহপাঠীদের সফল হতে সাহায্য করুন। আলোচনা প্রাসঙ্গিক, গঠনমূলক এবং বিষয়বস্তুর সাথে সম্পর্কিত রাখুন। গঠনমূলক মতামত সবসময় স্বাগত; ব্যক্তিগত আক্রমণ নয়।',
  },
  {
    icon: AlertTriangle,
    title: 'No Spam or Self-Promotion',
    titleBn: 'স্প্যাম বা স্ব-প্রচার নয়',
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
    description:
      'Do not post promotional content, spam, unauthorized advertisements, or off-topic self-promotional material. Repeated violations will result in account suspension.',
    descriptionBn:
      'প্রচারমূলক কন্টেন্ট, স্প্যাম, অননুমোদিত বিজ্ঞাপন বা বিষয়বহির্ভূত স্ব-প্রচারমূলক উপাদান পোস্ট করবেন না। বারবার লঙ্ঘন করলে অ্যাকাউন্ট স্থগিত করা হবে।',
  },
  {
    icon: Ban,
    title: 'No Inappropriate Content',
    titleBn: 'অনুপযুক্ত কন্টেন্ট নয়',
    color: 'text-red-500 bg-red-50 dark:bg-red-900/20',
    description:
      'Do not share content that is violent, explicit, illegal, or otherwise inappropriate for an educational platform. This includes links to such content. Violations will be acted upon swiftly.',
    descriptionBn:
      'সহিংস, অশ্লীল, অবৈধ বা শিক্ষামূলক প্ল্যাটফর্মের জন্য অনুপযুক্ত কন্টেন্ট শেয়ার করবেন না। এর মধ্যে এমন কন্টেন্টের লিংকও অন্তর্ভুক্ত। লঙ্ঘনের ক্ষেত্রে দ্রুত ব্যবস্থা নেওয়া হবে।',
  },
  {
    icon: CheckCircle,
    title: 'Follow Instructor Guidelines',
    titleBn: 'ইনস্ট্রাক্টরের নির্দেশিকা অনুসরণ করুন',
    color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20',
    description:
      'Respect the rules set by individual instructors for their courses and discussion forums. Each course may have specific participation and submission guidelines that you must follow.',
    descriptionBn:
      'তাদের কোর্স এবং আলোচনা ফোরামের জন্য ইনস্ট্রাক্টরদের নির্ধারিত নিয়ম মেনে চলুন। প্রতিটি কোর্সের নির্দিষ্ট অংশগ্রহণ এবং জমার নির্দেশিকা থাকতে পারে যা আপনাকে অনুসরণ করতে হবে।',
  },
  {
    icon: Shield,
    title: 'Account Security',
    titleBn: 'অ্যাকাউন্ট নিরাপত্তা',
    color: 'text-sky-500 bg-sky-50 dark:bg-sky-900/20',
    description:
      'Do not share your account credentials with anyone. You are solely responsible for all activity on your account. If you suspect unauthorized access, report it immediately to security@dakkho.pro.bd.',
    descriptionBn:
      'আপনার অ্যাকাউন্টের তথ্য কারও সাথে শেয়ার করবেন না। আপনার অ্যাকাউন্টের সমস্ত কার্যকলাপের জন্য আপনি একাই দায়ী। অননুমোদিত অ্যাক্সেস সন্দেহ হলে তাৎক্ষণিক security@dakkho.pro.bd-এ রিপোর্ট করুন।',
  },
];

export default function CommunityRulesPage() {
  const { goBack } = useNavigationStore();
  const [apiContent, setApiContent] = useState<TermsContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBn, setShowBn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchContent() {
      try {
        const result = await termsApi.getActive('community_rules');
        if (!cancelled && result.success && result.terms && result.terms.length > 0) {
          setApiContent(result.terms[0]);
        }
      } catch (error) {
        console.error('Failed to fetch community rules:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchContent();
    return () => { cancelled = true; };
  }, []);

  // Whether we have Bengali content available (from API or fallback)
  const hasBengali = apiContent?.content_bn
    ? true
    : FALLBACK_RULES.some((r) => r.titleBn);

  // Determine what title & body to display
  const displayTitle = showBn && apiContent?.title_bn ? apiContent.title_bn : apiContent?.title || 'Community Rules';
  const displayContent = showBn && apiContent?.content_bn ? apiContent.content_bn : apiContent?.content;

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
          onClick={goBack}
          whileTap={{ scale: 0.9 }}
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-sky-500 flex-shrink-0" />
            <span className="truncate">{showBn ? 'কমিউনিটি নিয়মাবলী' : displayTitle}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {showBn
              ? 'একটি নিরাপদ ও সমৃদ্ধ শিক্ষা পরিবেশ বজায় রাখতে এই নিয়মগুলো অনুসরণ করুন'
              : 'Rules that keep our learning community safe and productive'}
          </p>
        </div>

        {/* Language toggle */}
        {hasBengali && (
          <motion.button
            onClick={() => setShowBn((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-border hover:bg-muted transition-colors flex-shrink-0"
            whileTap={{ scale: 0.95 }}
            aria-label={showBn ? 'Switch to English' : 'বাংলায় দেখুন'}
          >
            <Globe className="w-3.5 h-3.5" />
            {showBn ? 'English' : 'বাংলা'}
          </motion.button>
        )}
      </motion.div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center h-56 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          <p className="text-sm text-muted-foreground">
            {showBn ? 'নিয়মাবলী লোড হচ্ছে…' : 'Loading community rules…'}
          </p>
        </div>
      )}

      {/* API-driven content */}
      {!loading && apiContent && displayContent && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          {/* Summary banner */}
          <GlassCard className="p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-foreground mb-1">{displayTitle}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {showBn
                    ? 'এই নিয়মগুলো আমাদের সকলের জন্য একটি নিরাপদ ও কার্যকর শিক্ষা পরিবেশ বজায় রাখতে সাহায্য করে।'
                    : 'These rules help us maintain a safe and productive learning environment for everyone.'}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: markdownToHtml(displayContent) }} />
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Fallback: static card-based layout (when API didn't return content) */}
      {!loading && !apiContent && (
        <>
          {/* Summary banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <GlassCard className="p-5 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-foreground mb-1">
                    {showBn ? 'কমিউনিটি নিয়মাবলী' : 'DAKKHO Community Guidelines'}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {showBn
                      ? 'এই নিয়মগুলো আমাদের সকলের জন্য একটি নিরাপদ ও কার্যকর শিক্ষা পরিবেশ বজায় রাখতে সাহায্য করে।'
                      : 'These rules help us maintain a safe and productive learning environment for everyone.'}
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Rule cards */}
          <div className="space-y-3">
            {FALLBACK_RULES.map((rule, idx) => (
              <motion.div
                key={rule.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.04 }}
              >
                <GlassCard className="p-4">
                  <div className="flex gap-4">
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-lg ${rule.color} flex items-center justify-center`}
                    >
                      <rule.icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold mb-1">
                        {showBn && rule.titleBn ? rule.titleBn : rule.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {showBn && rule.descriptionBn ? rule.descriptionBn : rule.description}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Consequences & reporting */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <GlassCard className="p-5 mt-5 border-amber-200/30 dark:border-amber-800/20">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                  <Scale className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-1">
                    {showBn ? 'লঙ্ঘনের পরিণতি' : 'Consequences of Violations'}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {showBn
                      ? 'নিয়ম লঙ্ঘনের ফলে সতর্কতা, সাময়িক স্থগিতাদেশ বা স্থায়ী অ্যাকাউন্ট বাতিল হতে পারে, লঙ্ঘনের তীব্রতার উপর নির্ভর করে। কোনো লঙ্ঘন দেখলে অনুগ্রহ করে রিপোর্ট করুন।'
                      : 'Violations of these rules may result in warnings, temporary suspension, or permanent account termination depending on severity. If you see a violation, please report it through the support system.'}
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <GlassCard className="p-5 mt-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-sky-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-1">
                    {showBn ? 'প্রশ্ন আছে?' : 'Questions?'}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {showBn
                      ? 'এই নিয়ম সম্পর্কে প্রশ্ন থাকলে যোগাযোগ করুন:'
                      : 'For questions about these community rules, contact us at:'}
                    {' '}
                    <span className="text-sky-500 font-semibold">support@dakkho.pro.bd</span>
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </div>
  );
}
