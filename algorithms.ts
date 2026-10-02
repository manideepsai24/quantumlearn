import { request } from './client'
import { asNumber, asString, asStringArray, isRecord, pick, unwrapList, unwrapRecord } from '@/lib/normalize'
import { normalizeCircuit } from './circuits'
import type { Algorithm } from '@/types'

export function normalizeAlgorithm(raw: unknown): Algorithm | null {
  const r = unwrapRecord(raw)
  const slug = asString(pick(r, 'slug', 'id'))
  if (!slug) return null
  const circuitRaw = pick(r, 'circuit', 'example_circuit')
  const circuitRec = isRecord(circuitRaw) ? normalizeCircuit(circuitRaw) : undefined
  return {
    slug,
    name: asString(pick(r, 'name', 'title')) ?? slug,
    difficulty: asString(r.difficulty),
    description: asString(r.description),
    whyItMatters: asString(pick(r, 'why_it_matters', 'importance')),
    objectives: asStringArray(pick(r, 'learning_objectives', 'objectives')),
    prerequisites: asStringArray(r.prerequisites),
    howItWorks: asString(pick(r, 'how_it_works', 'explanation')),
    math: asString(pick(r, 'mathematical_intuition', 'math')),
    expected: asString(pick(r, 'expected_behavior', 'expected_result')),
    pseudocode: asString(r.pseudocode),
    code: asString(pick(r, 'qiskit_example', 'python_example', 'code')),
    circuit: circuitRec
      ? { name: circuitRec.name, num_qubits: circuitRec.numQubits, shots: circuitRec.shots, gates: circuitRec.gates }
      : undefined,
    progress: asNumber(r.progress),
    lessonId: asString(pick(r, 'lesson_id', 'related_lesson_id')),
    challengeId: asString(pick(r, 'challenge_id', 'related_challenge_id')),
    quizId: asString(pick(r, 'quiz_id', 'related_quiz_id')),
  }
}

export async function getAlgorithms(): Promise<Algorithm[]> {
  return unwrapList(await request('/algorithms')).map(normalizeAlgorithm).filter((a): a is Algorithm => a !== null)
}

export async function getAlgorithm(slug: string): Promise<Algorithm> {
  const a = normalizeAlgorithm(await request(`/algorithms/${encodeURIComponent(slug)}`))
  if (!a) throw new Error('Unexpected algorithm response')
  return a
}
