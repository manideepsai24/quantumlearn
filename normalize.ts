/** Small helpers for reading backend JSON defensively without using `any`. */
export type UnknownRecord = Record<string, unknown>

export function isRecord(v: unknown): v is UnknownRecord {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function asNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v)
  return undefined
}

export function asString(v: unknown): string | undefined {
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  return undefined
}

export function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}

export function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

export function asNumberArray(v: unknown): number[] {
  if (typeof v === 'number') return [v]
  return Array.isArray(v) ? v.filter((x): x is number => typeof x === 'number' && Number.isFinite(x)) : []
}

/** First key present (and not null/undefined) wins. */
export function pick(rec: UnknownRecord, ...keys: string[]): unknown {
  for (const k of keys) {
    const v = rec[k]
    if (v !== undefined && v !== null) return v
  }
  return undefined
}

export function unwrapList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (isRecord(raw)) {
    for (const k of ['items', 'data', 'results', 'records']) {
      const v = raw[k]
      if (Array.isArray(v)) return v
    }
  }
  return []
}

export function unwrapRecord(raw: unknown): UnknownRecord {
  if (!isRecord(raw)) return {}
  const inner = raw['data']
  return isRecord(inner) && Object.keys(raw).length <= 2 ? inner : raw
}

export function numberRecord(v: unknown): Record<string, number> | undefined {
  if (!isRecord(v)) return undefined
  const out: Record<string, number> = {}
  for (const [k, val] of Object.entries(v)) {
    const n = asNumber(val)
    if (n !== undefined) out[k] = n
  }
  return Object.keys(out).length ? out : undefined
}
