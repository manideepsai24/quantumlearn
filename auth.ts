import { ApiError, parseTokenPair, request } from './client'
import { asString, isRecord, pick, unwrapRecord } from '@/lib/normalize'
import type { Role, User } from '@/types'

export function normalizeUser(raw: unknown): User {
  const r = unwrapRecord(raw)
  const u = isRecord(r.user) ? r.user : r
  const roleRaw = asString(pick(u, 'role'))?.toLowerCase()
  const role: Role = roleRaw === 'admin' || roleRaw === 'instructor' ? roleRaw : 'student'
  return {
    id: asString(pick(u, 'id', 'user_id')) ?? '',
    name: asString(pick(u, 'name', 'full_name', 'username')) ?? 'Learner',
    email: asString(u.email) ?? '',
    role,
  }
}

export async function login(email: string, password: string) {
  const raw = await request('/auth/login', { method: 'POST', body: { email, password }, auth: false })
  const pair = parseTokenPair(raw)
  if (!pair) throw new ApiError(500, 'BAD_RESPONSE', 'The server returned an unexpected sign-in response.')
  return pair
}

export async function register(name: string, email: string, password: string): Promise<void> {
  await request('/auth/register', { method: 'POST', body: { name, email, password }, auth: false })
}

export async function me(): Promise<User> {
  return normalizeUser(await request('/auth/me'))
}

export async function logout(refreshToken: string | null): Promise<void> {
  await request('/auth/logout', { method: 'POST', body: refreshToken ? { refresh_token: refreshToken } : {} })
}
