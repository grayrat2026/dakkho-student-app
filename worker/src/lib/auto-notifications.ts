// /worker/src/lib/auto-notifications.ts

export type NotificationType = 
  | 'course-update' 
  | 'announcement' 
  | 'grade' 
  | 'payment' 
  | 'schedule' 
  | 'social' 
  | 'achievement' 
  | 'streak'
  | 'info';

interface AutoNotificationPayload {
  type: NotificationType;
  title: string;
  titleBn?: string;
  message: string;
  messageBn?: string;
  actionUrl?: string;
  targetUserId?: string;      // Single user
  targetUserIds?: string[];   // Multiple users
  targetTechnology?: string;  // All users in a technology/department
  sendPush?: boolean;
}

interface AppwriteConfig {
  endpoint: string;
  projectId: string;
  databaseId: string;
  apiKey: string;
}

// Main function: Send auto-notification
export async function sendAutoNotification(
  payload: AutoNotificationPayload,
  appwrite: AppwriteConfig,
  onesignal?: { appId: string; restApiKey: string },
  d1?: D1Database
): Promise<{ success: boolean; count: number }> {
  let count = 0;
  
  try {
    // Determine target users
    let targetUserIds: string[] = [];
    
    if (payload.targetUserId) {
      targetUserIds = [payload.targetUserId];
    } else if (payload.targetUserIds) {
      targetUserIds = payload.targetUserIds;
    } else if (payload.targetTechnology && d1) {
      // Get all users with this technology from Appwrite
      targetUserIds = await getUsersByTechnology(payload.targetTechnology, appwrite);
    }
    
    if (targetUserIds.length === 0) {
      return { success: true, count: 0 };
    }
    
    // Create in-app notifications in Appwrite
    // Batch create (max 50 at a time)
    const batchSize = 50;
    for (let i = 0; i < targetUserIds.length; i += batchSize) {
      const batch = targetUserIds.slice(i, i + batchSize);
      const promises = batch.map(userId => 
        createAppwriteNotification(appwrite, {
          userId,
          title: payload.title,
          message: payload.message,
          type: payload.type,
          actionUrl: payload.actionUrl || '',
        })
      );
      await Promise.allSettled(promises);
      count += batch.length;
    }
    
    // Send push notification via OneSignal if enabled
    if (payload.sendPush && onesignal && d1 && targetUserIds.length > 0) {
      // Get push tokens for target users
      const tokens = await d1.prepare(
        `SELECT push_token FROM user_push_tokens WHERE user_id IN (${targetUserIds.map(() => '?').join(',')}) AND is_active = 1`
      ).bind(...targetUserIds).all();
      
      const playerIds = (tokens.results as any[]).map(t => t.push_token);
      
      if (playerIds.length > 0) {
        await sendOneSignalPush(onesignal, {
          title: payload.titleBn || payload.title,
          message: payload.messageBn || payload.message,
          playerIds,
          data: { type: payload.type, actionUrl: payload.actionUrl },
        });
      }
    }
    
    // Log to D1 notification_logs
    if (d1) {
      await d1.prepare(
        "INSERT INTO notification_logs (type, category, title, message, target_type, target_id, sent_count, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(
        'auto',
        payload.type,
        payload.title,
        payload.message,
        payload.targetUserId ? 'user' : payload.targetTechnology ? 'technology' : 'broadcast',
        payload.targetUserId || payload.targetTechnology || 'all',
        count,
        JSON.stringify({ actionUrl: payload.actionUrl, pushSent: !!payload.sendPush })
      ).run();
    }
    
    return { success: true, count };
  } catch (error) {
    console.error('Auto-notification error:', error);
    return { success: false, count };
  }
}

// Create a single in-app notification in Appwrite
async function createAppwriteNotification(
  appwrite: AppwriteConfig,
  data: { userId: string; title: string; message: string; type: string; actionUrl: string }
): Promise<void> {
  await fetch(`${appwrite.endpoint}/databases/${appwrite.databaseId}/collections/notifications/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Appwrite-Project': appwrite.projectId,
      'X-Appwrite-Key': appwrite.apiKey,
    },
    body: JSON.stringify({
      documentId: 'unique()',
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        actionUrl: data.actionUrl,
        isRead: false,
      },
    }),
  });
}

// Get users by technology from Appwrite
async function getUsersByTechnology(
  technology: string,
  appwrite: AppwriteConfig
): Promise<string[]> {
  try {
    const response = await fetch(
      `${appwrite.endpoint}/databases/${appwrite.databaseId}/collections/users/documents?queries[]=${encodeURIComponent(JSON.stringify({"method":"QUERY_TYPE_LIST","queries":[{"method":"QUERY_TYPE_EQUAL","attribute":"technology","values":[technology]}]}))}`,
      {
        headers: {
          'X-Appwrite-Project': appwrite.projectId,
          'X-Appwrite-Key': appwrite.apiKey,
        },
      }
    );
    
    const result = await response.json() as any;
    return (result.documents || []).map((doc: any) => doc.$id);
  } catch (error) {
    console.error('Failed to get users by technology:', error);
    return [];
  }
}

// Send push via OneSignal REST API
async function sendOneSignalPush(
  onesignal: { appId: string; restApiKey: string },
  data: { title: string; message: string; playerIds: string[]; data?: any }
): Promise<void> {
  await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${onesignal.restApiKey}`,
    },
    body: JSON.stringify({
      app_id: onesignal.appId,
      include_player_ids: data.playerIds,
      headings: { en: data.title },
      contents: { en: data.message },
      data: data.data || {},
    }),
  });
}

// ============ PRE-BUILT NOTIFICATION HELPERS ============

export async function notifyNewCourse(
  courseTitle: string,
  technology: string,
  appwrite: AppwriteConfig,
  onesignal?: { appId: string; restApiKey: string },
  d1?: D1Database
) {
  return sendAutoNotification({
    type: 'course-update',
    title: 'New Course Available!',
    titleBn: 'নতুন কোর্স এসেছে!',
    message: `A new course "${courseTitle}" is now available for your department.`,
    messageBn: `আপনার বিভাগের জন্য "${courseTitle}" নামে নতুন কোর্স এসেছে।`,
    targetTechnology: technology,
    sendPush: true,
    actionUrl: `/courses`,
  }, appwrite, onesignal, d1);
}

export async function notifyAchievementUnlocked(
  userId: string,
  achievementName: string,
  appwrite: AppwriteConfig,
  onesignal?: { appId: string; restApiKey: string },
  d1?: D1Database
) {
  return sendAutoNotification({
    type: 'achievement',
    title: 'Achievement Unlocked!',
    titleBn: 'অর্জন আনলক হয়েছে!',
    message: `You earned "${achievementName}"! Keep going!`,
    messageBn: `আপনি "${achievementName}" অর্জন করেছেন! চালিয়ে যান!`,
    targetUserId: userId,
    sendPush: true,
    actionUrl: '/achievements',
  }, appwrite, onesignal, d1);
}

export async function notifyStreakMilestone(
  userId: string,
  streakDays: number,
  appwrite: AppwriteConfig,
  onesignal?: { appId: string; restApiKey: string },
  d1?: D1Database
) {
  return sendAutoNotification({
    type: 'streak',
    title: `${streakDays}-Day Streak!`,
    titleBn: `${streakDays}-দিনের স্ট্রিক!`,
    message: `Amazing! You've maintained a ${streakDays}-day learning streak!`,
    messageBn: `অসাধারণ! আপনি ${streakDays} দিনের লার্নিং স্ট্রিক ধরে রেখেছেন!`,
    targetUserId: userId,
    sendPush: true,
    actionUrl: '/profile',
  }, appwrite, onesignal, d1);
}

export async function notifyPaymentStatus(
  userId: string,
  status: 'verified' | 'rejected',
  packageName: string,
  appwrite: AppwriteConfig,
  onesignal?: { appId: string; restApiKey: string },
  d1?: D1Database
) {
  const isVerified = status === 'verified';
  return sendAutoNotification({
    type: 'payment',
    title: isVerified ? 'Payment Verified' : 'Payment Rejected',
    titleBn: isVerified ? 'পেমেন্ট ভেরিফাইড' : 'পেমেন্ট বাতিল',
    message: isVerified 
      ? `Your payment for "${packageName}" has been verified. Enjoy your course!`
      : `Your payment for "${packageName}" was rejected. Please contact support.`,
    messageBn: isVerified
      ? `"${packageName}" এর পেমেন্ট ভেরিফাইড হয়েছে। কোর্স উপভোগ করুন!`
      : `"${packageName}" এর পেমেন্ট বাতিল হয়েছে। সাপোর্টে যোগাযোগ করুন।`,
    targetUserId: userId,
    sendPush: true,
    actionUrl: '/my-courses',
  }, appwrite, onesignal, d1);
}

export async function notifyLiveClassScheduled(
  classTitle: string,
  scheduledAt: string,
  technology: string,
  appwrite: AppwriteConfig,
  onesignal?: { appId: string; restApiKey: string },
  d1?: D1Database
) {
  return sendAutoNotification({
    type: 'schedule',
    title: 'Live Class Scheduled',
    titleBn: 'লাইভ ক্লাস নির্ধারিত',
    message: `Live class "${classTitle}" is scheduled for ${scheduledAt}. Don't miss it!`,
    messageBn: `"${classTitle}" লাইভ ক্লাস ${scheduledAt} এ নির্ধারিত। মিস করবেন না!`,
    targetTechnology: technology,
    sendPush: true,
    actionUrl: '/live-classes',
  }, appwrite, onesignal, d1);
}
