import { useQuery } from '@tanstack/react-query'
import { getProgress } from '@/api/progress'
import { Badge, Card, PageHeader } from '@/components/ui/Primitives'
import { useAuth } from '@/store/auth'

export default function Profile() {
  const user = useAuth((s) => s.user)
  const { data: p } = useQuery({ queryKey: ['progress'], queryFn: getProgress })
  return (
    <div className="stack stack--lg narrow">
      <PageHeader title="Profile" />
      <Card className="profile">
        <div className="avatar avatar--lg" aria-hidden="true">{(user?.name ?? '?').slice(0, 1).toUpperCase()}</div>
        <div><h2>{user?.name}</h2><p className="muted">{user?.email}</p><Badge tone="accent">{user?.role}</Badge></div>
      </Card>
      <Card className="stack">
        <h3>Learning</h3>
        <dl className="kv">
          <dt>XP</dt><dd>{p?.xp?.toLocaleString() ?? '—'}</dd>
          <dt>Streak</dt><dd>{p?.streakDays !== undefined ? `${p.streakDays} days` : '—'}</dd>
          <dt>Achievements</dt><dd>{p ? p.achievements.length : '—'}</dd>
          <dt>Completed courses</dt><dd>{p ? (p.completedCourses.length ? p.completedCourses.join(', ') : 'None yet') : '—'}</dd>
        </dl>
      </Card>
    </div>
  )
}
