import { request } from './client'
import { asString, isRecord, pick, unwrapRecord } from '@/lib/normalize'
import type { LearningLevel, SimulationResult, TutorContext, TutorMode } from '@/types'

/** Keep the request light: send the statevector only when it is small. */
const MAX_STATEVECTOR_ENTRIES = 64

function compactSimulation(s: SimulationResult) {
  return {
    backend: s.backend,
    num_qubits: s.numQubits,
    shots: s.shots,
    depth: s.depth,
    probabilities: s.probabilities,
    counts: s.counts,
    gate_counts: s.gateCounts,
    statevector:
      s.statevector && s.statevector.length <= MAX_STATEVECTOR_ENTRIES
        ? s.statevector.map((a) => ({ state: a.state, real: a.re, imag: a.im }))
        : undefined,
    bloch_vectors: s.bloch,
  }
}

export interface TutorRequest {
  message: string
  mode: TutorMode
  context: TutorContext
  level: LearningLevel
}

export async function askTutor({ message, mode, context, level }: TutorRequest): Promise<string> {
  const raw = await request('/ai/tutor', {
    method: 'POST',
    body: {
      message,
      mode,
      context: {
        lesson_id: context.lessonId,
        algorithm: context.algorithm,
        challenge_id: context.challengeId,
        circuit: context.circuit,
        simulation_result: context.simulation ? compactSimulation(context.simulation) : undefined,
        learning_level: level,
      },
    },
  })
  if (typeof raw === 'string') return raw
  const r = unwrapRecord(raw)
  const direct = asString(pick(r, 'response', 'reply', 'answer', 'message', 'content', 'text'))
  if (direct) return direct
  const nested = pick(r, 'response', 'message')
  if (isRecord(nested)) {
    const t = asString(pick(nested, 'content', 'text'))
    if (t) return t
  }
  return 'The tutor returned an empty response. Try rephrasing your question.'
}
