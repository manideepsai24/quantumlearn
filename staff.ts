import { request } from './client'
import { asString, isRecord, pick, unwrapList, unwrapRecord } from '@/lib/normalize'
import type { UnknownRecord } from '@/lib/normalize'

/*
 * ASSUMED endpoints (instructor/admin APIs are not in the original contract — confirm with the backend):
 *   GET /instructor/students      GET /instructor/analytics
 *   GET /admin/users              DELETE /admin/users/{id}
 *   GET /admin/content            DELETE /admin/content/{id}
 *   GET /admin/analytics
 * The pages render whatever fields the server returns; nothing is invented. If an endpoint
 * does not exist the page shows the server's error. The backend enforces all authorization.
 */
const records = (raw: unknown): UnknownRecord[] => unwrapList(raw).filter(isRecord)

export const getStudents = async () => records(await request('/instructor/students'))
export const getInstructorAnalytics = async () => unwrapRecord(await request('/instructor/analytics'))
export const getUsers = async () => records(await request('/admin/users'))
export const getContent = async () => records(await request('/admin/content'))
export const getAdminAnalytics = async () => unwrapRecord(await request('/admin/analytics'))
export const deleteUser = async (id: string) => { await request(`/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' }) }
export const deleteContent = async (id: string) => { await request(`/admin/content/${encodeURIComponent(id)}`, { method: 'DELETE' }) }

export const recordId = (r: UnknownRecord): string => asString(pick(r, 'id', 'user_id', 'content_id', 'slug')) ?? ''
