import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import {
  deleteContent, deleteUser, getAdminAnalytics, getContent, getInstructorAnalytics, getStudents, getUsers, recordId,
} from '@/api/staff'
import { errorMessage } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/Modal'
import { Card, PageHeader, SectionHeader, Skeleton } from '@/components/ui/Primitives'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { asNumber, asString, isRecord } from '@/lib/normalize'
import type { UnknownRecord } from '@/lib/normalize'
import { toast } from '@/store/toast'

const scalar = (v: unknown): v is string | number | boolean => ['string', 'number', 'boolean'].includes(typeof v)
const title = (k: string) => k.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
const show = (v: unknown) => (typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v))

function RecordsTable({ rows, onDelete }: { rows: UnknownRecord[]; onDelete?: (r: UnknownRecord) => void }) {
  const [query, setQuery] = useState('')
  const columns = useMemo(() => {
    const keys: string[] = []
    for (const r of rows.slice(0, 20)) for (const [k, v] of Object.entries(r)) if (scalar(v) && !keys.includes(k)) keys.push(k)
    return keys.filter((k) => !/password|token|secret/i.test(k)).slice(0, 7)
  }, [rows])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? rows.filter((r) => columns.some((c) => String(r[c] ?? '').toLowerCase().includes(q))) : rows
  }, [rows, columns, query])
  if (rows.length === 0) return <EmptyState title="Nothing here yet" />
  return (
    <div className="stack">
      <input className="input" placeholder="Filter" aria-label="Filter rows" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="table-wrap"><table className="table">
        <thead><tr>{columns.map((c) => <th key={c}>{title(c)}</th>)}{onDelete && <th><span className="sr-only">Actions</span></th>}</tr></thead>
        <tbody>{filtered.slice(0, 200).map((r, i) => (
          <tr key={recordId(r) || i}>
            {columns.map((c) => <td key={c}>{scalar(r[c]) ? show(r[c]) : '—'}</td>)}
            {onDelete && <td><Button size="sm" variant="danger" iconOnly aria-label="Delete" icon={<Trash2 size={14} />} onClick={() => onDelete(r)} /></td>}
          </tr>
        ))}</tbody>
      </table></div>
      {filtered.length > 200 && <p className="muted">Showing the first 200 of {filtered.length} rows. Use the filter to narrow down.</p>}
    </div>
  )
}

function AnalyticsView({ data }: { data: UnknownRecord }) {
  const stats = Object.entries(data).filter(([, v]) => typeof v === 'number' || typeof v === 'string')
  const lists = Object.entries(data).filter(([, v]) => Array.isArray(v))
  if (stats.length === 0 && lists.length === 0) return <EmptyState title="No analytics data yet" />
  return (
    <div className="stack stack--lg">
      {stats.length > 0 && <div className="stats">{stats.map(([k, v]) => <div key={k} className="stat"><div className="stat__label">{title(k)}</div><div className="stat__value">{typeof v === 'number' ? v.toLocaleString() : String(v)}</div></div>)}</div>}
      {lists.map(([k, v]) => (
        <section key={k}><SectionHeader title={title(k)} />
          <Card><ul className="list">{(v as unknown[]).slice(0, 12).map((item, i) => {
            if (typeof item === 'string') return <li key={i}>{item}</li>
            if (isRecord(item)) {
              const label = asString(item.name ?? item.title ?? item.topic ?? item.label ?? item.mistake) ?? `Item ${i + 1}`
              const val = asNumber(item.count ?? item.value ?? item.score ?? item.rate)
              return <li key={i}><span>{label}</span>{val !== undefined && <span className="muted">{val}</span>}</li>
            }
            return null
          })}</ul></Card>
        </section>
      ))}
    </div>
  )
}

function Query<T>({ q, children }: { q: { isLoading: boolean; isError: boolean; error: unknown; data: T | undefined; refetch: () => unknown }; children: (d: T) => ReactNode }) {
  if (q.isLoading) return <Skeleton height={200} radius={18} />
  if (q.isError || q.data === undefined) return <ErrorState error={q.error} title="Couldn’t load this data" onRetry={() => void q.refetch()} />
  return <>{children(q.data)}</>
}

export function InstructorHome() {
  const students = useQuery({ queryKey: ['instructor', 'students'], queryFn: getStudents })
  const analytics = useQuery({ queryKey: ['instructor', 'analytics'], queryFn: getInstructorAnalytics })
  return (
    <div className="stack stack--lg">
      <PageHeader title="Instructor" subtitle="Student progress, quiz and challenge performance, and difficult topics." />
      <Query q={analytics}>{(d) => <AnalyticsView data={d} />}</Query>
      <SectionHeader title="Students" />
      <Query q={students}>{(rows) => <RecordsTable rows={rows} />}</Query>
    </div>
  )
}

export function InstructorStudents() {
  const students = useQuery({ queryKey: ['instructor', 'students'], queryFn: getStudents })
  return <div className="stack stack--lg"><PageHeader title="Students" /><Query q={students}>{(rows) => <RecordsTable rows={rows} />}</Query></div>
}

export function InstructorAnalytics() {
  const analytics = useQuery({ queryKey: ['instructor', 'analytics'], queryFn: getInstructorAnalytics })
  return <div className="stack stack--lg"><PageHeader title="Analytics" /><Query q={analytics}>{(d) => <AnalyticsView data={d} />}</Query></div>
}

function DeletableList({ queryKey, fetcher, remover, noun }: { queryKey: string; fetcher: () => Promise<UnknownRecord[]>; remover: (id: string) => Promise<void>; noun: string }) {
  const qc = useQueryClient()
  const [target, setTarget] = useState<UnknownRecord | null>(null)
  const q = useQuery({ queryKey: ['admin', queryKey], queryFn: fetcher })
  const del = useMutation({
    mutationFn: (id: string) => remover(id),
    onSuccess: () => { toast.success(`${noun} deleted`); setTarget(null); void qc.invalidateQueries({ queryKey: ['admin', queryKey] }) },
    onError: (e) => { setTarget(null); toast.error(errorMessage(e)) },
  })
  return (
    <>
      <Query q={q}>{(rows) => <RecordsTable rows={rows} onDelete={setTarget} />}</Query>
      <ConfirmModal open={target !== null} danger title={`Delete this ${noun}?`} confirmLabel="Delete" loading={del.isPending}
        message="This permanently removes it on the server and can’t be undone." onClose={() => setTarget(null)}
        onConfirm={() => target && del.mutate(recordId(target))} />
    </>
  )
}

export function AdminHome() {
  const analytics = useQuery({ queryKey: ['admin', 'analytics'], queryFn: getAdminAnalytics })
  return <div className="stack stack--lg"><PageHeader title="Admin" subtitle="Platform overview." /><Query q={analytics}>{(d) => <AnalyticsView data={d} />}</Query></div>
}
export function AdminUsers() {
  return <div className="stack stack--lg"><PageHeader title="Users" /><DeletableList queryKey="users" fetcher={getUsers} remover={deleteUser} noun="user" /></div>
}
export function AdminContent() {
  return <div className="stack stack--lg"><PageHeader title="Content" /><DeletableList queryKey="content" fetcher={getContent} remover={deleteContent} noun="item" /></div>
}
export function AdminAnalytics() {
  const analytics = useQuery({ queryKey: ['admin', 'analytics'], queryFn: getAdminAnalytics })
  return <div className="stack stack--lg"><PageHeader title="Platform analytics" /><Query q={analytics}>{(d) => <AnalyticsView data={d} />}</Query></div>
}
