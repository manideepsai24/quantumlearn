import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useReducedMotion } from 'framer-motion'
import { Flame, Zap } from 'lucide-react'
import { getProgress } from '@/api/progress'
import { Badge, Card, PageHeader, ProgressBar, SectionHeader, Skeleton } from '@/components/ui/Primitives'
import { ErrorState } from '@/components/ui/States'

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="stat"><div className="stat__label">{label}</div><div className="stat__value">{value}</div></div>
}

export default function Progress() {
  const reduced = useReducedMotion()
  const { data: p, isLoading, isError, error, refetch } = useQuery({ queryKey: ['progress'], queryFn: getProgress })
  if (isLoading) return <div className="stack"><Skeleton height={34} width="30%" /><Skeleton height={200} radius={18} /></div>
  if (isError || !p) return <ErrorState error={error} title="Couldn’t load your progress" onRetry={() => void refetch()} />
  const hours = p.learningMinutes !== undefined ? `${Math.floor(p.learningMinutes / 60)}h ${Math.round(p.learningMinutes % 60)}m` : undefined

  return (
    <div className="stack stack--lg">
      <PageHeader title="Progress" subtitle="How you’re doing, and where to focus next." actions={<Link to="/achievements" className="link">Achievements</Link>} />
      <div className="stats">
        {p.overallCompletion !== undefined && <Stat label="Overall" value={`${Math.round(p.overallCompletion)}%`} />}
        {p.xp !== undefined && <Stat label="XP" value={p.xp.toLocaleString()} />}
        {p.streakDays !== undefined && <Stat label="Streak" value={`${p.streakDays} days`} />}
        {hours && <Stat label="Learning time" value={hours} />}
        {p.simulationCount !== undefined && <Stat label="Simulations" value={String(p.simulationCount)} />}
        {p.algorithmsAttempted !== undefined && <Stat label="Algorithms tried" value={String(p.algorithmsAttempted)} />}
      </div>

      {p.overallCompletion !== undefined && <Card className="stack"><h3>Overall progress</h3><ProgressBar value={p.overallCompletion} label="Overall progress" /></Card>}

      {p.courseProgress.length > 0 && (
        <section><SectionHeader title="Course progress" />
          <Card className="stack">{p.courseProgress.map((c) => (
            <div key={c.name} className="stack stack--tight"><div className="row row--between"><span>{c.name}</span><span className="muted">{Math.round(c.value)}%</span></div><ProgressBar value={c.value} label={c.name} /></div>
          ))}</Card></section>
      )}

      {p.quizScores.length > 0 && (
        <section><SectionHeader title="Quiz performance" />
          <Card>
            <p className="sr-only">Quiz scores: {p.quizScores.map((q) => `${q.label} ${Math.round(q.value)}%`).join(', ')}</p>
            <div aria-hidden="true"><ResponsiveContainer width="100%" height={240}>
              <BarChart data={p.quizScores} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={40} tickFormatter={(v: number) => `${v}%`} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <Tooltip formatter={(v: number) => `${Math.round(v)}%`} cursor={{ fill: 'var(--accent-soft)' }} />
                <Bar dataKey="value" fill="var(--accent)" radius={[6, 6, 0, 0]} isAnimationActive={!reduced} />
              </BarChart>
            </ResponsiveContainer></div>
          </Card></section>
      )}

      {p.challengeStats && (
        <Card className="stack"><h3>Challenges</h3>
          <p>{p.challengeStats.completed}{p.challengeStats.total !== undefined ? ` of ${p.challengeStats.total}` : ''} completed{p.challengeStats.averageScore !== undefined ? ` · average score ${Math.round(p.challengeStats.averageScore)}` : ''}</p>
        </Card>
      )}

      <div className="grid grid--2">
        <Card className="stack"><h3>Strong topics</h3>
          <div className="row row--wrap">{p.strongTopics.length ? p.strongTopics.map((t) => <Badge key={t} tone="success">{t}</Badge>) : <span className="muted">Complete quizzes to find your strengths.</span>}</div></Card>
        <Card className="stack"><h3>Worth reviewing</h3>
          <div className="row row--wrap">{p.weakTopics.length ? p.weakTopics.map((t) => <Badge key={t} tone="warning">{t}</Badge>) : <span className="muted">Nothing flagged yet.</span>}</div></Card>
      </div>

      <section><SectionHeader title="Recommended for you" />
        {p.recommendations.length === 0 && <p className="muted">Recommendations appear after your first quiz or challenge.</p>}
        <div className="grid grid--2">{p.recommendations.map((r) => (
          <Card key={r.title} interactive className="stack"><h3>{r.title}</h3>{r.reason && <p className="muted">{r.reason}</p>}{r.to && <Link to={r.to} className="link">Open →</Link>}</Card>
        ))}</div>
      </section>
      <div className="row muted"><Flame size={14} aria-hidden /> Streak and <Zap size={14} aria-hidden /> XP come straight from the server.</div>
    </div>
  )
}
