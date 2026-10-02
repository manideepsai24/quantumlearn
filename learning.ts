import { request } from './client'
import { asArray, asNumber, asString, isRecord, pick, unwrapList, unwrapRecord } from '@/lib/normalize'
import { normalizeCircuit } from './circuits'
import type { Course, Lesson, LessonSummary, Module } from '@/types'

const pct = (v: unknown): number | undefined => {
  const n = asNumber(v)
  if (n === undefined) return undefined
  return Math.max(0, Math.min(100, n > 0 && n < 1 ? n * 100 : n))
}

function normalizeLessonSummary(raw: unknown): LessonSummary | null {
  if (!isRecord(raw)) return null
  const id = asString(pick(raw, 'id', 'lesson_id'))
  if (!id) return null
  return { id, title: asString(pick(raw, 'title', 'name')) ?? 'Untitled lesson', completed: Boolean(pick(raw, 'completed', 'is_completed')) }
}

export function normalizeModule(raw: unknown): Module | null {
  const r = unwrapRecord(raw)
  const id = asString(pick(r, 'id', 'module_id'))
  if (!id) return null
  return {
    id,
    title: asString(pick(r, 'title', 'name')) ?? 'Untitled module',
    description: asString(r.description),
    progress: pct(pick(r, 'progress', 'completion')),
    lessons: asArray(r.lessons).map(normalizeLessonSummary).filter((l): l is LessonSummary => l !== null),
  }
}

export function normalizeCourse(raw: unknown): Course | null {
  const r = unwrapRecord(raw)
  const id = asString(pick(r, 'id', 'course_id', 'slug'))
  if (!id) return null
  return {
    id,
    title: asString(pick(r, 'title', 'name')) ?? 'Untitled course',
    description: asString(r.description),
    difficulty: asString(r.difficulty),
    progress: pct(pick(r, 'progress', 'completion')),
    modules: asArray(r.modules).map(normalizeModule).filter((m): m is Module => m !== null),
  }
}

export function normalizeLesson(raw: unknown): Lesson {
  const r = unwrapRecord(raw)
  const sections = asArray(r.sections)
    .map((s) => (isRecord(s) ? `${asString(s.title) ? `## ${asString(s.title)}\n\n` : ''}${asString(pick(s, 'body', 'content', 'text')) ?? ''}` : ''))
    .filter(Boolean)
    .join('\n\n')
  const circuitRaw = pick(r, 'circuit', 'example_circuit')
  const rec = isRecord(circuitRaw) ? normalizeCircuit(circuitRaw) : undefined
  return {
    id: asString(pick(r, 'id', 'lesson_id')) ?? '',
    title: asString(pick(r, 'title', 'name')) ?? 'Lesson',
    content: asString(pick(r, 'content', 'body', 'markdown')) ?? sections,
    completed: Boolean(pick(r, 'completed', 'is_completed')),
    circuit: rec ? { name: rec.name, num_qubits: rec.numQubits, shots: rec.shots, gates: rec.gates } : undefined,
    algorithm: asString(pick(r, 'algorithm', 'algorithm_slug', 'related_algorithm')),
    challengeId: asString(pick(r, 'challenge_id', 'related_challenge_id')),
    quizId: asString(pick(r, 'quiz_id', 'related_quiz_id')),
    nextLessonId: asString(pick(r, 'next_lesson_id')),
  }
}

export async function getCourses(): Promise<Course[]> {
  return unwrapList(await request('/courses')).map(normalizeCourse).filter((c): c is Course => c !== null)
}

export async function getModules(courseId?: string): Promise<Module[]> {
  const q = courseId ? `?course_id=${encodeURIComponent(courseId)}` : ''
  return unwrapList(await request(`/modules${q}`)).map(normalizeModule).filter((m): m is Module => m !== null)
}

export async function getCourse(id: string): Promise<Course> {
  const course = normalizeCourse(await request(`/courses/${encodeURIComponent(id)}`))
  if (!course) throw new Error('Unexpected course response')
  if (course.modules.length === 0) course.modules = await getModules(id)
  return course
}

export async function getModule(id: string): Promise<Module> {
  const m = normalizeModule(await request(`/modules/${encodeURIComponent(id)}`))
  if (!m) throw new Error('Unexpected module response')
  return m
}

export async function getLesson(id: string): Promise<Lesson> {
  return normalizeLesson(await request(`/lessons/${encodeURIComponent(id)}`))
}

export async function completeLesson(id: string): Promise<void> {
  await request(`/progress/lessons/${encodeURIComponent(id)}/complete`, { method: 'POST', body: {} })
}
