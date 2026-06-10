// /worker/src/lib/streak.ts

interface StreakInfo {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  updatedAt: string;
}

interface StreakCalendarDay {
  date: string;
  active: boolean;
}

// Get streak info for a user
export async function getStreakInfo(db: D1Database, userId: string): Promise<StreakInfo> {
  const row = await db.prepare(
    'SELECT * FROM user_streaks WHERE user_id = ?'
  ).bind(userId).first() as any;

  if (!row) {
    return {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      updatedAt: new Date().toISOString(),
    };
  }

  // Check if streak needs to be reset (missed yesterday)
  const today = getTodayDateString();
  const yesterday = getDateStringDaysAgo(1);

  let currentStreak = row.current_streak;
  if (row.last_activity_date && row.last_activity_date !== today && row.last_activity_date !== yesterday) {
    // Streak is broken - reset to 0
    currentStreak = 0;
    await db.prepare(
      'UPDATE user_streaks SET current_streak = 0, updated_at = datetime("now") WHERE user_id = ?'
    ).bind(userId).run();
  }

  return {
    userId: row.user_id,
    currentStreak,
    longestStreak: row.longest_streak,
    lastActivityDate: row.last_activity_date,
    updatedAt: row.updated_at,
  };
}

// Update streak when user has activity (called from watch-progress, enroll, etc.)
export async function recordActivity(db: D1Database, userId: string): Promise<StreakInfo> {
  const today = getTodayDateString();

  const existing = await db.prepare(
    'SELECT * FROM user_streaks WHERE user_id = ?'
  ).bind(userId).first() as any;

  if (!existing) {
    // First ever activity
    await db.prepare(
      'INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, updated_at) VALUES (?, 1, 1, ?, datetime("now"))'
    ).bind(userId, today).run();

    return {
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: today,
      updatedAt: new Date().toISOString(),
    };
  }

  // Already recorded today
  if (existing.last_activity_date === today) {
    return {
      userId: existing.user_id,
      currentStreak: existing.current_streak,
      longestStreak: existing.longest_streak,
      lastActivityDate: existing.last_activity_date,
      updatedAt: existing.updated_at,
    };
  }

  const yesterday = getDateStringDaysAgo(1);
  let newStreak: number;

  if (existing.last_activity_date === yesterday) {
    // Continuing streak
    newStreak = existing.current_streak + 1;
  } else {
    // Streak broken, start new
    newStreak = 1;
  }

  const newLongest = Math.max(existing.longest_streak, newStreak);

  await db.prepare(
    'UPDATE user_streaks SET current_streak = ?, longest_streak = ?, last_activity_date = ?, updated_at = datetime("now") WHERE user_id = ?'
  ).bind(newStreak, newLongest, today, userId).run();

  return {
    userId,
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastActivityDate: today,
    updatedAt: new Date().toISOString(),
  };
}

// Get streak calendar for the last N days
export async function getStreakCalendar(
  db: D1Database,
  userId: string,
  days: number = 30
): Promise<StreakCalendarDay[]> {
  const calendar: StreakCalendarDay[] = [];

  // Get activity dates from student_activity table
  const startDate = getDateStringDaysAgo(days - 1);
  const activities = await db.prepare(
    "SELECT DISTINCT date(created_at) as activity_date FROM student_activity WHERE user_id = ? AND created_at >= ? ORDER BY activity_date"
  ).bind(userId, startDate).all();

  const activeDates = new Set(
    (activities.results as any[]).map(r => r.activity_date)
  );

  for (let i = days - 1; i >= 0; i--) {
    const date = getDateStringDaysAgo(i);
    calendar.push({
      date,
      active: activeDates.has(date),
    });
  }

  return calendar;
}

// Helper: Get today's date as YYYY-MM-DD in Asia/Dhaka timezone
function getTodayDateString(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
}

// Helper: Get date string for N days ago
function getDateStringDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
}
