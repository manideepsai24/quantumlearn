import { request } from './client'
import {
  asNumber, asNumberArray, asString, asStringArray, isRecord, pick, unwrapList, unwrapRecord,
} from '@/lib/normalize'
import { DEFAULT_SHOTS, GATE_DEFS, isGateType } from '@/quantum/circuitTypes'
import type { GateType, QuantumCircuit, QuantumGate } from '@/quantum/circuitTypes'

export interface CircuitRecord {
  id: string
  name: string
  description: string
  tags: string[]
  numQubits: number
  shots: number
  gates: QuantumGate[]
  skippedGates: number
  createdAt?: string
  updatedAt?: string
  lastSimulationAt?: string
}

export interface CircuitMeta {
  description: string
  tags: string[]
}

const GATE_ALIASES: Record<string, GateType> = { CX: 'CNOT', TOFFOLI: 'CCX' }

function normalizeGate(raw: unknown, index: number): QuantumGate | null {
  if (!isRecord(raw)) return null
  const typeRaw = (asString(pick(raw, 'type', 'name', 'gate')) ?? '').toUpperCase()
  const type = GATE_ALIASES[typeRaw] ?? typeRaw
  if (!isGateType(type)) return null
  const def = GATE_DEFS[type]
  const controls = asNumberArray(pick(raw, 'controls', 'control'))
  const targets = asNumberArray(pick(raw, 'targets', 'target'))
  const params: Record<string, number> = {}
  const rawParams = pick(raw, 'parameters', 'params')
  if (isRecord(rawParams)) {
    for (const [k, v] of Object.entries(rawParams)) {
      const n = asNumber(v)
      if (n !== undefined) params[k] = n
    }
  }
  if (def.parameter && params[def.parameter] === undefined) {
    const n = asNumber(pick(raw, 'theta', 'angle'))
    if (n !== undefined) params[def.parameter] = n
  }
  return {
    id: asString(raw.id) ?? `loaded-${index}`,
    type,
    ...(controls.length ? { controls } : {}),
    targets,
    ...(Object.keys(params).length ? { parameters: params } : {}),
  }
}

export function normalizeCircuit(raw: unknown): CircuitRecord {
  const r = unwrapRecord(raw)
  const def = isRecord(r.definition) ? r.definition : isRecord(r.circuit) ? r.circuit : r
  const rawGates = Array.isArray(def.gates) ? def.gates : []
  const gates = rawGates.map(normalizeGate).filter((g): g is QuantumGate => g !== null)
  return {
    id: asString(pick(r, 'id', 'circuit_id')) ?? '',
    name: asString(pick(r, 'name')) ?? asString(def.name) ?? 'Untitled circuit',
    description: asString(r.description) ?? '',
    tags: asStringArray(r.tags),
    numQubits: asNumber(pick(def, 'num_qubits', 'n_qubits')) ?? asNumber(pick(r, 'num_qubits')) ?? 2,
    shots: asNumber(pick(def, 'shots')) ?? asNumber(pick(r, 'shots')) ?? DEFAULT_SHOTS,
    gates,
    skippedGates: rawGates.length - gates.length,
    createdAt: asString(pick(r, 'created_at', 'createdAt')),
    updatedAt: asString(pick(r, 'updated_at', 'updatedAt')),
    lastSimulationAt: asString(pick(r, 'last_simulation_at', 'last_simulated_at', 'last_run_at')),
  }
}

/** The save payload. If your backend nests the circuit differently, this is the one place to change. */
function buildPayload(circuit: QuantumCircuit, meta: CircuitMeta) {
  return { ...circuit, description: meta.description, tags: meta.tags }
}

export async function listCircuits(): Promise<CircuitRecord[]> {
  return unwrapList(await request('/circuits')).map(normalizeCircuit)
}

export async function getCircuit(id: string): Promise<CircuitRecord> {
  return normalizeCircuit(await request(`/circuits/${encodeURIComponent(id)}`))
}

export async function createCircuit(circuit: QuantumCircuit, meta: CircuitMeta): Promise<CircuitRecord> {
  return normalizeCircuit(await request('/circuits', { method: 'POST', body: buildPayload(circuit, meta) }))
}

export async function updateCircuit(id: string, circuit: QuantumCircuit, meta: CircuitMeta): Promise<CircuitRecord> {
  return normalizeCircuit(
    await request(`/circuits/${encodeURIComponent(id)}`, { method: 'PUT', body: buildPayload(circuit, meta) }),
  )
}

export async function deleteCircuit(id: string): Promise<void> {
  await request(`/circuits/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
