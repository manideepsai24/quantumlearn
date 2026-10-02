import { asString, isRecord, pick, unwrapRecord } from '@/lib/normalize'

const DEFAULT_BASE = 'http://localhost:8000/api/v1'
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BASE).replace(/\/+$/, '')

const REFRESH_KEY = 'ql.refresh'
let accessToken: string | null = null
let onAuthFailure: (() => void) | null = null
let refreshing: Promise<boolean> | null = null

/** Access token lives in memory only. The refresh token is kept in localStorage so sessions survive reloads. */
export const tokens = {
  get access(): string | null {
    return accessToken
  },
  get refresh(): string | null {
    try {
      return localStorage.getItem(REFRESH_KEY)
    } catch {
      return null
    }
  },
  set(access: string | null, refresh?: string | null): void {
    accessToken = access
    try {
      if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
    } catch {
      /* storage unavailable */
    }
  },
  clear(): void {
    accessToken = null
    try {
      localStorage.removeItem(REFRESH_KEY)
    } catch {
      /* storage unavailable */
    }
  },
}

export function setAuthFailureHandler(fn: () => void): void {
  onAuthFailure = fn
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: Record<string, unknown>
  constructor(status: number, code: string, message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'The request wasn’t valid. Please check your input and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You don’t have permission to do that.',
  404: 'We couldn’t find what you were looking for.',
  409: 'That conflicts with something that already exists.',
  422: 'Some of the information provided isn’t valid.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong on our side. Please try again.',
  503: 'The service is temporarily unavailable. Please try again shortly.',
}

function buildApiError(status: number, body: unknown): ApiError {
  let code = 'HTTP_ERROR'
  let message: string | undefined
  let details: Record<string, unknown> = {}
  if (isRecord(body)) {
    const err = body.error
    if (isRecord(err)) {
      code = asString(err.code) ?? code
      message = asString(err.message)
      if (isRecord(err.details)) details = err.details
    } else if (typeof body.detail === 'string') {
      message = body.detail
    } else if (Array.isArray(body.detail)) {
      // FastAPI validation errors
      message = body.detail
        .map((d) => (isRecord(d) ? asString(d.msg) : undefined))
        .filter((m): m is string => Boolean(m))
        .join(' ')
    }
  }
  // Never surface server internals for 5xx responses.
  const safe = status >= 500 ? STATUS_MESSAGES[status] ?? STATUS_MESSAGES[500] : message
  return new ApiError(status, code, safe || STATUS_MESSAGES[status] || 'Something went wrong.', details)
}

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message
  return 'Something went wrong. Please try again.'
}

export function parseTokenPair(raw: unknown): { access: string; refresh: string | null } | null {
  const r = unwrapRecord(raw)
  const access = asString(pick(r, 'access_token', 'accessToken', 'access'))
  if (!access) return null
  return { access, refresh: asString(pick(r, 'refresh_token', 'refreshToken', 'refresh')) ?? null }
}

export function refreshSession(): Promise<boolean> {
  if (refreshing) return refreshing
  const rt = tokens.refresh
  if (!rt) return Promise.resolve(false)
  refreshing = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: rt }),
      })
      if (!res.ok) {
        tokens.clear()
        return false
      }
      const pair = parseTokenPair(await res.json())
      if (!pair) {
        tokens.clear()
        return false
      }
      tokens.set(pair.access, pair.refresh ?? rt)
      return true
    } catch {
      return false // network failure: keep the refresh token for a later attempt
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  auth?: boolean
  signal?: AbortSignal
  retried?: boolean
}

export async function request<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, signal } = opts
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`

  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'QuantumLearn couldn’t reach the learning server. Check your connection and try again.',
    )
  }

  if (res.status === 401 && auth && !opts.retried && tokens.refresh) {
    if (await refreshSession()) return request<T>(path, { ...opts, retried: true })
  }
  if (res.status === 401 && auth) onAuthFailure?.()

  if (!res.ok) {
    let parsed: unknown = null
    try {
      parsed = await res.json()
    } catch {
      /* non-JSON error body */
    }
    throw buildApiError(res.status, parsed)
  }
  if (res.status === 204) return undefined as T
  try {
    return (await res.json()) as T
  } catch {
    return undefined as T
  }
}
