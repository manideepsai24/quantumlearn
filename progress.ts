import { request } from './client'
import { asArray, asNumber, asString, asStringArray, isRecord, pick, unwrapRecord } from '@/lib/normalize'
import { entityPath } from '@/lib/paths'
import type { Achievement, ActivityItem, ContinueLearning, Progress, Recommendation } from '@/types'

function toPercent(v: unknown): number | undefined {
  const n = asNumber(v)
  if (n === undefined) return undefined
  const p = n > 0 && n < 1 ? n * 100 : n
  return Math.max(0, Math.min(100, p))
}

function normalizeContinue(v: unknown): ContinueLearning | undefined {
  if (!isRecord(v)) return undefined
  return {
    title: asString(pick(v, 'title', 'name', 'lesson_title')) ?? 'Continue learning',
    subtitle: asString(pick(v, 'subtitle', 'course_title', 'module_title', 'description')),
    completion: toPercent(pick(v, 'progress', 'completion', 'percent')),
    to: entityPath(asString(v.type) ?? 'lesson', asString(pick(v, 'lesson_id', 'id'))),
  }
}

function normalizeRecommendation(v: unknown): Recommendation | null {
  if (typeof v === 'string') return { title: v }
  if (!isRecord(v)) return null
  const title = asString(pick(v, 'title', 'name'))
  if (!title) return null
  return {
    title,
    reason: asString(pick(v, 'reason', 'description', 'message')),
    to: entityPath(asString(v.type), asString(pick(v, 'id', 'slug', 'target_id'))),
  }
}

function normalizeActivity(v: unknown): ActivityItem | null {
  if (!isRecord(v)) return null
  const title = asString(pick(v, 'title', 'description', 'name'))
  if (!title) return null
  return { title, type: asString(v.type), at: asString(pick(v, 'at', 'created_at', 'timestamp')) }
}

function normalizeAchievement(v: unknown): Achievement | null {
  if (!isRecord(v)) return null
  const name = asString(pick(v, 'name', 'title'))
  if (!name) return null
  return {
    id: asString(v.id) ?? name,
    name,
    description: asString(v.description),
    unlockedAt: asString(pick(v, 'unlocked_at', 'earned_at')),
  }
}

function labelled(v: unknown, labelKeys: string[]): { label: string; value: number }[] {
  return asArray(v)
    .map((x) => {
      if (!isRecord(x)) return null
      const label = asString(pick(x, ...labelKeys))
      const value = toPercent(pick(x, 'score', 'percentage', 'progress', 'value'))
      return label && value !== undefined ? { label, value } : null
    })
    .filter((x): x is { label: string; value: number } => x !== null)
}

export function normalizeProgress(raw: unknown): Progress {
  const r = unwrapRecord(raw)
  const ch = pick(r, 'challenge_stats', 'challenges')
  return {
    courseProgress: labelled(pick(r, 'course_progress', 'courses'), ['name', 'title', 'course']).map((x) => ({ name: x.label, value: x.value })),
    quizScores: labelled(pick(r, 'quiz_performance', 'quiz_scores', 'quizzes'), ['title', 'name', 'quiz']),
    challengeStats: isRecord(ch)
      ? { completed: asNumber(pick(ch, 'completed', 'solved')) ?? 0, total: asNumber(ch.total), averageScore: asNumber(pick(ch, 'average_score', 'avg_score')) }
      : undefined,
    learningMinutes: asNumber(pick(r, 'learning_minutes', 'total_minutes')),
    simulationCount: asNumber(pick(r, 'simulation_count', 'simulations_run', 'simulations')),
    algorithmsAttempted: asNumber(pick(r, 'algorithms_attempted')),
    strongTopics: asStringArray(pick(r, 'strong_topics', 'strengths')),
    weakTopics: asStringArray(pick(r, 'weak_topics', 'weaknesses')),
    completedCourses: asStringArray(pick(r, 'completed_courses')),
    overallCompletion: toPercent(pick(r, 'overall_completion', 'overall_progress', 'completion_percentage')),
    xp: asNumber(pick(r, 'xp', 'total_xp')),
    streakDays: asNumber(pick(r, 'streak', 'streak_days', 'learning_streak')),
    continueLearning: normalizeContinue(pick(r, 'continue_learning', 'current_lesson', 'next_lesson', 'continue')),
    recommendations: asArray(pick(r, 'recommendations', 'recommended'))
      .map(normalizeRecommendation)
      .filter((x): x is Recommendation => x !== null),
    recentActivity: asArray(pick(r, 'recent_activity', 'activity'))
      .map(normalizeActivity)
      .filter((x): x is ActivityItem => x !== null),
    achievements: asArray(r.achievements)
      .map(normalizeAchievement)
      .filter((x): x is Achievement => x !== null),
  }
}

export async function getProgress(): Promise<Progress> {
  return normalizeProgress(await request('/progress'))
}
