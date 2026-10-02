import { request } from './client'
import {
  asArray, asNumber, asString, asStringArray, isRecord, pick, unwrapList, unwrapRecord,
} from '@/lib/normalize'
import { normalizeCircuit } from './circuits'
import type { QuantumCircuit } from '@/quantum/circuitTypes'
import type { Challenge, ChallengeResult, Quiz, QuizQuestion, QuizResult } from '@/types'

/*
 * ASSUMED endpoints (not in the original contract — confirm with the backend):
 *   GET /challenges, GET /challenges/{id}, GET /quizzes/{id}
 * Submission endpoints are from the contract:
 *   POST /progress/challenges/{id}/submit, POST /progress/quizzes/{id}/submit
 */

export function normalizeChallenge(raw: unknown): Challenge | null {
  const r = unwrapRecord(raw)
  const id = asString(pick(r, 'id', 'challenge_id'))
  if (!id) return null
  const target = pick(r, 'target', 'target_result', 'target_distribution')
  return {
    id,
    title: asString(pick(r, 'title', 'name')) ?? 'Challenge',
    difficulty: asString(r.difficulty),
    objective: asString(r.objective),
    instructions: asString(r.instructions),
    target: typeof target === 'string' ? target : isRecord(target) ? JSON.stringify(target) : undefined,
    completed: Boolean(pick(r, 'completed', 'is_completed')),
  }
}

export async function getChallenges(): Promise<Challenge[]> {
  return unwrapList(await request('/challenges')).map(normalizeChallenge).filter((c): c is Challenge => c !== null)
}

export async function getChallenge(id: string): Promise<Challenge> {
  const c = normalizeChallenge(await request(`/challenges/${encodeURIComponent(id)}`))
  if (!c) throw new Error('Unexpected challenge response')
  return c
}

const text = (v: unknown): string | undefined =>
  typeof v === 'string' ? v : isRecord(v) || Array.isArray(v) ? JSON.stringify(v) : undefined

export async function submitChallenge(id: string, circuit: QuantumCircuit): Promise<ChallengeResult> {
  const raw = await request(`/progress/challenges/${encodeURIComponent(id)}/submit`, { method: 'POST', body: { circuit } })
  const r = unwrapRecord(raw)
  return {
    passed: Boolean(pick(r, 'passed', 'success', 'correct')),
    score: asNumber(r.score),
    feedback: asString(pick(r, 'feedback', 'message')),
    actual: text(pick(r, 'actual_result', 'actual')),
    target: text(pick(r, 'target_result', 'target')),
    nextStep: asString(pick(r, 'next_step', 'next')),
  }
}

function normalizeQuestion(raw: unknown): QuizQuestion | null {
  if (!isRecord(raw)) return null
  const id = asString(pick(raw, 'id', 'question_id'))
  if (!id) return null
  const type = asString(pick(raw, 'type', 'question_type')) ?? 'multiple_choice'
  let options = asArray(raw.options).map((o, i) =>
    isRecord(o) ? { id: asString(pick(o, 'id', 'key')) ?? String(i), text: asString(pick(o, 'text', 'label')) ?? '' } : { id: String(o), text: String(o) },
  )
  if (options.length === 0 && type === 'true_false') options = [{ id: 'true', text: 'True' }, { id: 'false', text: 'False' }]
  const c = pick(raw, 'circuit')
  const rec = isRecord(c) ? normalizeCircuit(c) : undefined
  return {
    id,
    type,
    prompt: asString(pick(raw, 'prompt', 'question', 'text')) ?? '',
    options,
    multiple: type === 'multiple_answer',
    circuit: rec ? { name: rec.name, num_qubits: rec.numQubits, shots: rec.shots, gates: rec.gates } : undefined,
  }
}

export async function getQuiz(id: string): Promise<Quiz> {
  const r = unwrapRecord(await request(`/quizzes/${encodeURIComponent(id)}`))
  return {
    id: asString(pick(r, 'id', 'quiz_id')) ?? id,
    title: asString(pick(r, 'title', 'name')) ?? 'Quiz',
    questions: asArray(r.questions).map(normalizeQuestion).filter((q): q is QuizQuestion => q !== null),
  }
}

export async function submitQuiz(id: string, answers: Record<string, string[]>): Promise<QuizResult> {
  const body = { answers: Object.entries(answers).map(([question_id, selected]) => ({ question_id, selected })) }
  const raw = await request(`/progress/quizzes/${encodeURIComponent(id)}/submit`, { method: 'POST', body })
  const r = unwrapRecord(raw)
  return {
    score: asNumber(r.score),
    total: asNumber(pick(r, 'total', 'max_score', 'total_questions')),
    percentage: asNumber(pick(r, 'percentage', 'percent')),
    passed: typeof r.passed === 'boolean' ? r.passed : undefined,
    feedback: asString(pick(r, 'feedback', 'message')),
    strong: asStringArray(pick(r, 'strong_topics', 'strengths')),
    review: asStringArray(pick(r, 'review_topics', 'weak_topics')),
    explanations: asArray(pick(r, 'explanations', 'results'))
      .map((e) => (isRecord(e)
        ? { question: asString(pick(e, 'question', 'prompt')) ?? '', explanation: asString(pick(e, 'explanation', 'feedback')) ?? '', correct: typeof e.correct === 'boolean' ? e.correct : undefined }
        : null))
      .filter((e): e is { question: string; explanation: string; correct: boolean | undefined } => e !== null && Boolean(e.explanation)),
    nextTo: asString(pick(r, 'next_url', 'next')),
  }
}
