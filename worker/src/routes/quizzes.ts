/**
 * DAKKHO Quiz Routes — Cloudflare Workers + Hono
 *
 * Mounted at /student/quizzes
 * Uses D1 for quiz data (quizzes, quiz_questions, quiz_attempts).
 * Integrates with achievements and streak tracking.
 */

import { Hono } from 'hono';
import type { Env } from '../env';
import { validateStudentSession } from '../lib/student-auth';
import { getErrorMessage } from '../lib/utils';
import { recordActivity } from '../lib/streak';
import { checkAndUnlockAchievements } from '../lib/achievements';
import { notifyAchievementUnlocked } from '../lib/auto-notifications';
import { generateId } from '../lib/utils';

const quizRoutes = new Hono<{ Bindings: Env }>();

// ─── Helper: Get student auth from header ───

async function getStudentAuth(
  c: any
): Promise<{ authorized: boolean; userId?: string; email?: string; emailVerified?: boolean }> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false };
  }
  const token = authHeader.substring(7);
  const result = await validateStudentSession(c.env, token);
  return result;
}

// ─── Helper: Require email verification ───

async function requireEmailVerified(
  c: any
): Promise<{ authorized: boolean; userId?: string; email?: string; emailVerified?: boolean } | Response> {
  const auth = await getStudentAuth(c);
  if (!auth.authorized) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  if (!auth.emailVerified) {
    return c.json({ error: 'Email verification required', code: 'EMAIL_NOT_VERIFIED' }, 403);
  }
  return auth;
}

// ─── D1 Row Types ───

interface QuizRow {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
  max_attempts: number;
  passing_score: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface QuizQuestionRow {
  id: string;
  quiz_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string | null;
  order_num: number;
}

interface QuizAttemptRow {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  passed: number;
  answers: string;
  started_at: string;
  completed_at: string;
  time_taken: number | null;
}

// ═══════════════════════════════════════════════════════════════
// QUIZ ROUTES
// ═══════════════════════════════════════════════════════════════

// GET /:courseId — List quizzes for a course
quizRoutes.get('/:courseId', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const courseId = c.req.param('courseId');

    // Get quizzes for this course
    const { results } = await c.env.DB.prepare(
      'SELECT id, course_id, title, description, time_limit_minutes, max_attempts, passing_score, is_active, created_at, updated_at FROM quizzes WHERE course_id = ? AND is_active = 1 ORDER BY created_at DESC'
    ).bind(courseId).all<QuizRow>();

    // Get attempt counts for the user for each quiz
    const quizzesWithAttempts = await Promise.all(
      results.map(async (quiz) => {
        const attemptCount = await c.env.DB.prepare(
          'SELECT COUNT(*) as count FROM quiz_attempts WHERE quiz_id = ? AND user_id = ?'
        ).bind(quiz.id, auth.userId).first<{ count: number }>();

        const bestAttempt = await c.env.DB.prepare(
          'SELECT MAX(percentage) as best_percentage FROM quiz_attempts WHERE quiz_id = ? AND user_id = ?'
        ).bind(quiz.id, auth.userId).first<{ best_percentage: number | null }>();

        return {
          ...quiz,
          userAttemptCount: attemptCount?.count || 0,
          bestPercentage: bestAttempt?.best_percentage || null,
          canAttempt: (attemptCount?.count || 0) < quiz.max_attempts,
        };
      })
    );

    return c.json({ quizzes: quizzesWithAttempts });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// GET /:courseId/:quizId — Get quiz with questions (no correct answers)
quizRoutes.get('/:courseId/:quizId', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const quizId = c.req.param('quizId');

    // Get quiz details
    const quiz = await c.env.DB.prepare(
      'SELECT id, course_id, title, description, time_limit_minutes, max_attempts, passing_score, is_active, created_at, updated_at FROM quizzes WHERE id = ? AND is_active = 1'
    ).bind(quizId).first<QuizRow>();

    if (!quiz) {
      return c.json({ error: 'Quiz not found' }, 404);
    }

    // Check attempt limit
    const attemptCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM quiz_attempts WHERE quiz_id = ? AND user_id = ?'
    ).bind(quizId, auth.userId).first<{ count: number }>();

    if ((attemptCount?.count || 0) >= quiz.max_attempts) {
      return c.json({ error: 'Maximum attempts reached for this quiz' }, 400);
    }

    // Get questions WITHOUT correct_option field (prevent cheating)
    const { results: questions } = await c.env.DB.prepare(
      'SELECT id, quiz_id, question_text, option_a, option_b, option_c, option_d, order_num FROM quiz_questions WHERE quiz_id = ? ORDER BY order_num ASC'
    ).bind(quizId).all<Omit<QuizQuestionRow, 'correct_option' | 'explanation'>>();

    // Get user's previous attempts summary (without answers)
    const { results: attempts } = await c.env.DB.prepare(
      'SELECT id, score, total_questions, percentage, passed, started_at, completed_at, time_taken FROM quiz_attempts WHERE quiz_id = ? AND user_id = ? ORDER BY completed_at DESC'
    ).bind(quizId, auth.userId).all();

    return c.json({
      quiz: {
        ...quiz,
        userAttemptCount: attemptCount?.count || 0,
        canAttempt: (attemptCount?.count || 0) < quiz.max_attempts,
      },
      questions,
      previousAttempts: attempts,
    });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// POST /:quizId/submit — Submit quiz answers (email verification required)
quizRoutes.post('/:quizId/submit', async (c) => {
  try {
    const authResult = await requireEmailVerified(c);
    if (authResult instanceof Response) return authResult;
    const auth = authResult;

    const quizId = c.req.param('quizId');
    const { answers } = await c.req.json() as {
      answers: Array<{ questionId: string; selected: string }>;
    };

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return c.json({ error: 'answers array is required' }, 400);
    }

    // Get quiz details
    const quiz = await c.env.DB.prepare(
      'SELECT * FROM quizzes WHERE id = ? AND is_active = 1'
    ).bind(quizId).first<QuizRow>();

    if (!quiz) {
      return c.json({ error: 'Quiz not found' }, 404);
    }

    // Check attempt limit
    const attemptCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM quiz_attempts WHERE quiz_id = ? AND user_id = ?'
    ).bind(quizId, auth.userId).first<{ count: number }>();

    if ((attemptCount?.count || 0) >= quiz.max_attempts) {
      return c.json({ error: 'Maximum attempts reached for this quiz' }, 400);
    }

    // Get all questions with correct answers for scoring
    const { results: questions } = await c.env.DB.prepare(
      'SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY order_num ASC'
    ).bind(quizId).all<QuizQuestionRow>();

    // Calculate score
    let correctCount = 0;
    const scoredAnswers = answers.map((answer) => {
      const question = questions.find((q) => q.id === answer.questionId);
      const isCorrect = question?.correct_option === answer.selected;
      if (isCorrect) correctCount++;

      return {
        questionId: answer.questionId,
        selected: answer.selected,
        correct: question?.correct_option || null,
        isCorrect,
      };
    });

    const totalQuestions = questions.length;
    const score = correctCount;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = percentage >= quiz.passing_score;

    // Store the attempt
    const attemptId = generateId();
    const now = new Date().toISOString();
    await c.env.DB.prepare(
      `INSERT INTO quiz_attempts (id, quiz_id, user_id, score, total_questions, percentage, passed, answers, started_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      attemptId,
      quizId,
      auth.userId,
      score,
      totalQuestions,
      percentage,
      passed ? 1 : 0,
      JSON.stringify(scoredAnswers),
      now,
      now
    ).run();

    // Log activity and check achievements
    try {
      await c.env.DB.prepare(
        "INSERT INTO student_activity (user_id, activity_type, resource_type, resource_id, title, description, metadata) VALUES (?, 'quiz_completed', 'quiz', ?, ?, 'Completed quiz', ?)"
      ).bind(
        auth.userId,
        String(quizId),
        quiz.title,
        JSON.stringify({
          quizId,
          courseId: quiz.course_id,
          score,
          totalQuestions,
          percentage,
          passed,
        })
      ).run();

      // Record streak activity
      await recordActivity(c.env.DB, auth.userId!);

      // Check and unlock achievements
      const newAchievements = await checkAndUnlockAchievements(c.env.DB, auth.userId!, 'quiz_completed');
      if (newAchievements.length > 0) {
        const appwriteConfig = {
          endpoint: c.env.APPWRITE_ENDPOINT,
          projectId: c.env.APPWRITE_PROJECT_ID,
          databaseId: c.env.APPWRITE_DATABASE_ID,
          apiKey: c.env.APPWRITE_API_KEY,
        };
        const onesignalConfig = c.env.ONE_SIGNAL_APP_ID ? {
          appId: c.env.ONE_SIGNAL_APP_ID,
          restApiKey: c.env.ONE_SIGNAL_REST_API_KEY,
        } : undefined;

        for (const ach of newAchievements) {
          await notifyAchievementUnlocked(auth.userId!, ach.name, appwriteConfig, onesignalConfig, c.env.DB);
        }
      }
    } catch (e) {
      console.error('Activity/achievement logging failed:', e);
    }

    return c.json({
      result: {
        quizId,
        score,
        totalQuestions,
        percentage,
        passed,
        answers: scoredAnswers,
        attemptNumber: (attemptCount?.count || 0) + 1,
        maxAttempts: quiz.max_attempts,
        canRetry: (attemptCount?.count || 0) + 1 < quiz.max_attempts,
      },
    });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// GET /:quizId/attempts — Get user's past attempts for a quiz
quizRoutes.get('/:quizId/attempts', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const quizId = c.req.param('quizId');

    // Get quiz details
    const quiz = await c.env.DB.prepare(
      'SELECT id, course_id, title, max_attempts, passing_score FROM quizzes WHERE id = ?'
    ).bind(quizId).first<QuizRow>();

    if (!quiz) {
      return c.json({ error: 'Quiz not found' }, 404);
    }

    // Get all attempts for this user (without full answers for brevity)
    const { results: attempts } = await c.env.DB.prepare(
      'SELECT id, quiz_id, score, total_questions, percentage, passed, started_at, completed_at, time_taken FROM quiz_attempts WHERE quiz_id = ? AND user_id = ? ORDER BY completed_at DESC'
    ).bind(quizId, auth.userId).all<Omit<QuizAttemptRow, 'answers'>>();

    return c.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        maxAttempts: quiz.max_attempts,
        passingScore: quiz.passing_score,
      },
      attempts,
      totalAttempts: attempts.length,
      bestPercentage: attempts.length > 0
        ? Math.max(...attempts.map((a) => a.percentage))
        : null,
    });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

export default quizRoutes;
