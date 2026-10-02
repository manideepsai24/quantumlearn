import { request } from './client'
import { asNumber, asString, isRecord, numberRecord, pick, unwrapRecord } from '@/lib/normalize'
import { indexToBitstring } from '@/quantum/visualization'
import type { QuantumCircuit } from '@/quantum/circuitTypes'
import type { Amplitude, BlochVector, SimulationResult } from '@/types'

/** Request body for POST /simulations/run. If the backend expects a different envelope, change it here. */
export function buildRunPayload(circuit: QuantumCircuit) {
  return { circuit }
}

const cleanKey = (s: string | undefined): string | undefined => (s === undefined ? undefined : s.replace(/[|⟩>\s]/g, ''))

function inferQubits(length: number): number {
  return Math.max(1, Math.round(Math.log2(Math.max(1, length))))
}

function parseDistribution(v: unknown, n: number | undefined): Record<string, number> | undefined {
  if (isRecord(v)) {
    const out: Record<string, number> = {}
    for (const [k, val] of Object.entries(v)) {
      const num = asNumber(val)
      if (num !== undefined) out[cleanKey(k) ?? k] = num
    }
    return Object.keys(out).length ? out : undefined
  }
  if (Array.isArray(v)) {
    const out: Record<string, number> = {}
    v.forEach((item, i) => {
      if (isRecord(item)) {
        const state = cleanKey(asString(pick(item, 'state', 'basis_state', 'bitstring', 'outcome')))
        const num = asNumber(pick(item, 'probability', 'count', 'value', 'p'))
        if (state !== undefined && num !== undefined) out[state] = num
      } else {
        const num = asNumber(item)
        if (num !== undefined) out[indexToBitstring(i, n ?? inferQubits(v.length))] = num
      }
    })
    return Object.keys(out).length ? out : undefined
  }
  return undefined
}

function parseAmplitude(item: unknown): { re: number; im: number; state?: string } | undefined {
  if (Array.isArray(item)) {
    const re = asNumber(item[0])
    return re === undefined ? undefined : { re, im: asNumber(item[1]) ?? 0 }
  }
  if (isRecord(item)) {
    const re = asNumber(pick(item, 'real', 're', 'r'))
    if (re === undefined) return undefined
    return {
      re,
      im: asNumber(pick(item, 'imag', 'imaginary', 'im', 'i')) ?? 0,
      state: cleanKey(asString(pick(item, 'state', 'basis_state', 'basis', 'bitstring'))),
    }
  }
  const re = asNumber(item)
  return re === undefined ? undefined : { re, im: 0 }
}

function parseStatevector(v: unknown, n: number | undefined): Amplitude[] | undefined {
  const out: Amplitude[] = []
  if (Array.isArray(v)) {
    v.forEach((item, i) => {
      const a = parseAmplitude(item)
      if (a) out.push({ state: a.state ?? indexToBitstring(i, n ?? inferQubits(v.length)), re: a.re, im: a.im })
    })
  } else if (isRecord(v)) {
    for (const [k, item] of Object.entries(v)) {
      const a = parseAmplitude(item)
      if (a) out.push({ state: cleanKey(k) ?? k, re: a.re, im: a.im })
    }
  }
  return out.length ? out : undefined
}

function toBloch(item: unknown, fallbackQubit: number): BlochVector | undefined {
  if (Array.isArray(item)) {
    const [x, y, z] = item.map(asNumber)
    if (x !== undefined && y !== undefined && z !== undefined) return { qubit: fallbackQubit, x, y, z }
  } else if (isRecord(item)) {
    const x = asNumber(item.x)
    const y = asNumber(item.y)
    const z = asNumber(item.z)
    if (x !== undefined && y !== undefined && z !== undefined) {
      return { qubit: asNumber(pick(item, 'qubit', 'index')) ?? fallbackQubit, x, y, z }
    }
  }
  return undefined
}

function parseBloch(v: unknown): BlochVector[] | undefined {
  const out: BlochVector[] = []
  if (Array.isArray(v)) {
    v.forEach((item, i) => {
      const b = toBloch(item, i)
      if (b) out.push(b)
    })
  } else if (isRecord(v)) {
    const single = toBloch(v, 0)
    if (single) out.push(single)
    else {
      Object.entries(v).forEach(([k, item], i) => {
        const b = toBloch(item, asNumber(k) ?? i)
        if (b) out.push(b)
      })
    }
  }
  return out.length ? out : undefined
}

/**
 * Reads the backend response without inventing anything: every field that the
 * backend did not send stays undefined and the UI shows "not available".
 */
export function normalizeSimulation(raw: unknown): SimulationResult {
  const root = unwrapRecord(raw)
  const inner = isRecord(root.result) ? root.result : root
  const r = isRecord(inner.metadata) ? { ...inner, ...inner.metadata } : inner

  const numQubits = asNumber(pick(r, 'num_qubits', 'n_qubits'))
  const ms = asNumber(pick(r, 'execution_time_ms', 'duration_ms', 'elapsed_ms'))
  const sec = asNumber(pick(r, 'execution_time', 'elapsed_seconds', 'duration_seconds'))

  return {
    id: asString(pick(r, 'id', 'simulation_id')),
    backend: asString(pick(r, 'backend', 'simulator')),
    numQubits,
    shots: asNumber(pick(r, 'shots')),
    executionTimeMs: ms ?? (sec !== undefined ? sec * 1000 : undefined),
    depth: asNumber(pick(r, 'circuit_depth', 'depth')),
    probabilities: parseDistribution(pick(r, 'probabilities', 'probability'), numQubits),
    counts: parseDistribution(pick(r, 'counts', 'measurement_counts'), numQubits),
    statevector: parseStatevector(pick(r, 'statevector', 'state_vector', 'amplitudes'), numQubits),
    gateCounts: numberRecord(pick(r, 'gate_counts', 'gate_statistics', 'gate_stats')),
    bloch: parseBloch(pick(r, 'bloch_vectors', 'bloch_sphere', 'bloch', 'bloch_coordinates')),
  }
}

export async function runSimulation(circuit: QuantumCircuit): Promise<SimulationResult> {
  const raw = await request('/simulations/run', { method: 'POST', body: buildRunPayload(circuit) })
  return normalizeSimulation(raw)
}
