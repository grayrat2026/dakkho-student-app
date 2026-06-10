-- Seed Achievement Definitions (16 achievements across 4 categories)
-- Uses existing column name 'xp' instead of 'xp_reward'

-- Learning category achievements
INSERT OR IGNORE INTO achievement_definitions (slug, name, name_bn, description, description_bn, icon, category, xp, condition_type, condition_value, is_active) VALUES
  ('first-step', 'First Step', 'প্রথম পদক্ষেপ', 'Complete your first lesson', 'আপনার প্রথম পাঠ সম্পন্ন করুন', '🎯', 'learning', 10, 'enrollment_count', '1', 1),
  ('bookworm', 'Bookworm', 'বইপোকা', 'Enroll in 5 courses', '৫টি কোর্সে ভর্তি হন', '📚', 'learning', 50, 'enrollment_count', '5', 1),
  ('scholar', 'Scholar', 'পণ্ডিত', 'Enroll in 10 courses', '১০টি কোর্সে ভর্তি হন', '🎓', 'learning', 100, 'enrollment_count', '10', 1),
  ('marathon-learner', 'Marathon Learner', 'ম্যারাথন শিক্ষার্থী', 'Complete 50 hours of learning', '৫০ ঘন্টা শিক্ষা সম্পন্ন করুন', '🏅', 'learning', 200, 'watch_hours', '50', 1);

-- Streak category achievements
INSERT OR IGNORE INTO achievement_definitions (slug, name, name_bn, description, description_bn, icon, category, xp, condition_type, condition_value, is_active) VALUES
  ('consistent', 'Consistent', 'ধারাবাহিক', 'Maintain a 3-day streak', '৩ দিনের স্ট্রিক বজায় রাখুন', '🔥', 'streaks', 20, 'streak_days', '3', 1),
  ('on-fire', 'On Fire', 'আগুনে জ্বলছে', 'Maintain a 7-day streak', '৭ দিনের স্ট্রিক বজায় রাখুন', '🔥', 'streaks', 50, 'streak_days', '7', 1),
  ('unstoppable', 'Unstoppable', 'অপ্রতিরোধ্য', 'Maintain a 14-day streak', '১৪ দিনের স্ট্রিক বজায় রাখুন', '💪', 'streaks', 100, 'streak_days', '14', 1),
  ('legendary', 'Legendary', 'কিংবদন্তি', 'Maintain a 30-day streak', '৩০ দিনের স্ট্রিক বজায় রাখুন', '👑', 'streaks', 300, 'streak_days', '30', 1);

-- Social category achievements
INSERT OR IGNORE INTO achievement_definitions (slug, name, name_bn, description, description_bn, icon, category, xp, condition_type, condition_value, is_active) VALUES
  ('quiz-ace', 'Quiz Ace', 'কুইজ এইস', 'Score 90%+ on 3 quizzes', '৩টি কুইজে ৯০%+ স্কোর করুন', '🧠', 'social', 30, 'quiz_score', '3', 1),
  ('quiz-master', 'Quiz Master', 'কুইজ মাস্টার', 'Score 90%+ on 10 quizzes', '১০টি কুইজে ৯০%+ স্কোর করুন', '🏆', 'social', 100, 'quiz_score', '10', 1),
  ('rising-star', 'Rising Star', 'উদীয়মান তারা', 'Reach the top 10 on leaderboard', 'লিডারবোর্ডে শীর্ষ ১০-এ পৌঁছান', '⭐', 'social', 150, 'leaderboard_rank', '10', 1),
  ('top-learner', 'Top Learner', 'শীর্ষ শিক্ষার্থী', 'Reach the top 3 on leaderboard', 'লিডারবোর্ডে শীর্ষ ৩-এ পৌঁছান', '🌟', 'social', 250, 'leaderboard_rank', '3', 1);

-- Special category achievements
INSERT OR IGNORE INTO achievement_definitions (slug, name, name_bn, description, description_bn, icon, category, xp, condition_type, condition_value, is_active) VALUES
  ('early-bird', 'Early Bird', 'প্রাতরাশী', 'Login before 7 AM', 'সকাল ৭টার আগে লগইন করুন', '🐦', 'special', 25, 'streak_days', '1', 1),
  ('night-owl', 'Night Owl', 'নৈশচর পাখি', 'Study after midnight', 'মধ্যরাতের পরে পড়াশোনা করুন', '🦉', 'special', 25, 'streak_days', '1', 1),
  ('pioneer', 'Pioneer', 'অগ্রগামী', 'Be among the first 100 users', 'প্রথম ১০০ ব্যবহারকারীর মধ্যে থাকুন', '🚀', 'special', 75, 'enrollment_count', '1', 1),
  ('completionist', 'Completionist', 'সম্পূর্ণকারী', 'Complete an entire course', 'একটি সম্পূর্ণ কোর্স শেষ করুন', '✅', 'special', 500, 'watch_hours', '100', 1);
