// /worker/src/lib/achievements.ts

interface AchievementDefinition {
  id: number;
  slug: string;
  name: string;
  name_bn: string | null;
  description: string;
  description_bn: string | null;
  category: string;
  icon: string;
  xp_reward: number;
  condition_type: string;
  condition_value: string;
  is_active: number;
}

interface UnlockedAchievement {
  id: number;
  slug: string;
  name: string;
  name_bn: string | null;
  description: string;
  description_bn: string | null;
  category: string;
  icon: string;
  xp_reward: number;
  unlocked_at: string;
  isNewlyUnlocked: boolean;
}

// Check and unlock achievements for a user after an activity
export async function checkAndUnlockAchievements(
  db: D1Database,
  userId: string,
  activityType: string
): Promise<UnlockedAchievement[]> {
  const newlyUnlocked: UnlockedAchievement[] = [];
  
  // Get all active achievement definitions
  const definitions = await db.prepare(
    'SELECT * FROM achievement_definitions WHERE is_active = 1'
  ).all();
  
  // Get user's existing achievements
  const existing = await db.prepare(
    'SELECT achievement_id FROM student_achievements WHERE user_id = ?'
  ).bind(userId).all();
  
  const unlockedIds = new Set((existing.results as any[]).map(r => r.achievement_id));
  
  for (const def of (definitions.results as AchievementDefinition[])) {
    // Skip already unlocked
    if (unlockedIds.has(def.id)) continue;
    
    // Check if this activity type is relevant to this achievement
    if (!isActivityRelevant(activityType, def.condition_type)) continue;
    
    // Check condition
    const conditionMet = await checkCondition(db, userId, def.condition_type, def.condition_value);
    
    if (conditionMet) {
      // Unlock achievement
      await db.prepare(
        'INSERT INTO student_achievements (user_id, achievement_id) VALUES (?, ?)'
      ).bind(userId, def.id).run();
      
      // Log activity
      await db.prepare(
        "INSERT INTO student_activity (user_id, activity_type, resource_type, title, description) VALUES (?, 'achievement_unlocked', 'achievement', ?, ?)"
      ).bind(userId, def.name, def.description).run();
      
      newlyUnlocked.push({
        id: def.id,
        slug: def.slug,
        name: def.name,
        name_bn: def.name_bn,
        description: def.description,
        description_bn: def.description_bn,
        category: def.category,
        icon: def.icon,
        xp_reward: def.xp_reward,
        unlocked_at: new Date().toISOString(),
        isNewlyUnlocked: true,
      });
    }
  }
  
  return newlyUnlocked;
}

// Check if activity type is relevant to achievement condition
function isActivityRelevant(activityType: string, conditionType: string): boolean {
  const mapping: Record<string, string[]> = {
    enrollment_count: ['enroll', 'course_completed'],
    streak_days: ['watch', 'login', 'activity'],
    watch_hours: ['watch', 'video_completed'],
    quiz_score: ['quiz_completed', 'quiz_attempted'],
    leaderboard_rank: ['leaderboard_update', 'xp_earned'],
  };
  
  const relevantActivities = mapping[conditionType] || [];
  return relevantActivities.includes(activityType) || activityType === 'any';
}

// Check a specific condition
async function checkCondition(
  db: D1Database,
  userId: string,
  conditionType: string,
  conditionValue: string
): Promise<boolean> {
  const value = parseInt(conditionValue);
  
  switch (conditionType) {
    case 'enrollment_count': {
      const result = await db.prepare(
        'SELECT COUNT(*) as count FROM student_activity WHERE user_id = ? AND activity_type = ?'
      ).bind(userId, 'enroll').first();
      return (result?.count as number || 0) >= value;
    }
    
    case 'streak_days': {
      const result = await db.prepare(
        'SELECT current_streak FROM user_streaks WHERE user_id = ?'
      ).bind(userId).first();
      return (result?.current_streak as number || 0) >= value;
    }
    
    case 'watch_hours': {
      // Sum watch progress duration from student_activity metadata
      const result = await db.prepare(
        "SELECT SUM(CAST(json_extract(metadata, '$.duration_seconds') AS REAL)) as total_seconds FROM student_activity WHERE user_id = ? AND activity_type = 'watch'"
      ).bind(userId).first();
      const hours = ((result?.total_seconds as number) || 0) / 3600;
      return hours >= value;
    }
    
    case 'quiz_score': {
      // Count quizzes with score >= 90%
      const result = await db.prepare(
        "SELECT COUNT(*) as count FROM student_activity WHERE user_id = ? AND activity_type = 'quiz_completed' AND CAST(json_extract(metadata, '$.percentage') AS REAL) >= 90"
      ).bind(userId).first();
      return (result?.count as number || 0) >= value;
    }
    
    case 'leaderboard_rank': {
      // Check if user is in top N - requires leaderboard calculation
      // For now, check XP from activity count
      const result = await db.prepare(
        'SELECT COUNT(*) as count FROM student_activity WHERE user_id = ?'
      ).bind(userId).first();
      return (result?.count as number || 0) >= 100; // Proxy: 100+ activities = likely top 10
    }
    
    default:
      return false;
  }
}

// Get all achievements with unlock status for a user
export async function getUserAchievements(db: D1Database, userId: string): Promise<{
  achievements: Array<{
    id: number;
    slug: string;
    name: string;
    name_bn: string | null;
    description: string;
    description_bn: string | null;
    category: string;
    icon: string;
    xp_reward: number;
    unlocked: boolean;
    unlockedAt: string | null;
  }>;
  totalUnlocked: number;
  totalXp: number;
}> {
  const definitions = await db.prepare(
    'SELECT * FROM achievement_definitions WHERE is_active = 1 ORDER BY category, xp_reward'
  ).all();
  
  const unlocked = await db.prepare(
    'SELECT achievement_id, unlocked_at FROM student_achievements WHERE user_id = ?'
  ).bind(userId).all();
  
  const unlockedMap = new Map(
    (unlocked.results as any[]).map(r => [r.achievement_id, r.unlocked_at])
  );
  
  let totalUnlocked = 0;
  let totalXp = 0;
  
  const achievements = (definitions.results as AchievementDefinition[]).map(def => {
    const unlockedAt = unlockedMap.get(def.id) || null;
    const isUnlocked = !!unlockedAt;
    if (isUnlocked) {
      totalUnlocked++;
      totalXp += def.xp_reward;
    }
    return {
      id: def.id,
      slug: def.slug,
      name: def.name,
      name_bn: def.name_bn,
      description: def.description,
      description_bn: def.description_bn,
      category: def.category,
      icon: def.icon,
      xp_reward: def.xp_reward,
      unlocked: isUnlocked,
      unlockedAt,
    };
  });
  
  return { achievements, totalUnlocked, totalXp };
}
