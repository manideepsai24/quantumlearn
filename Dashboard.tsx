import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Award, CircuitBoard, Flame, Zap } from 'lucide-react'
import { listCircuits } from '@/api/circuits'
import { getProgress } from '@/api/progress'
import { Button, buttonClass } from '@/components/ui/Button'
import { Badge, Card, ProgressBar, SectionHeader, Skeleton } from '@/components/ui/Primitives'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { formatDate, timeGreeting } from '@/lib/format'
import { useAuth } from '@/store/auth'

export default function Dashboard() {
  const user = useAuth((s) => s.user)
  const progress = useQuery({ queryKey: ['progress'], queryFn: getProgress })
  const circuits = useQuery({ queryKey: ['circuits'], queryFn: listCircuits })
  const p = progress.data

  return (
    <div className="stack stack--lg">
      <header>
        <h1>{timeGreeting()}, {user?.name.split(' ')[0] ?? 'there'}.</h1>
        <p className="muted lead">Continue your quantum journey.</p>
      </header>

      {progress.isError && <ErrorState error={progress.error} title="Couldn’t load your progress" onRetry={() => void progress.refetch()} />}

      <div className="dash-top">
        <Card className="continue">
          <Badge tone="accent">Continue learning</Badge>
          {progress.isLoading && <Skeleton height={80} />}
          {p?.continueLearning ? (
            <>
              <h2>{p.continueLearning.title}</h2>
              {p.continueLearning.subtitle && <p className="muted">{p.continueLearning.subtitle}</p>}
              {p.continueLearning.completion !== undefined && (
                <div className="continue__bar"><ProgressBar value={p.continueLearning.completion} label="Lesson progress" /><span className="muted">{Math.round(p.continueLearning.completion)}%</span></div>
              )}
              {p.continueLearning.to && <Link to={p.continueLearning.to} className={buttonClass('primary')}>Continue <ArrowRight size={16} /></Link>}
            </>
          ) : (
            !progress.isLoading && (
              <>
                <h2>Nothing in progress yet</h2>
                <p className="muted">Start a course, or jump straight into the lab.</p>
                <div className="row">
                  <Link to="/learn" className={buttonClass('primary')}>Browse courses</Link>
                  <Link to="/quantum-lab" className={buttonClass('secondary')}>Open Quantum Lab</Link>
                </div>
              </>
            )
          )}
        </Card>

        <Card className="stack">
          <h3>Your progress</h3>
          {progress.isLoading && <Skeleton height={60} />}
          {p && (
            <>
              {p.overallCompletion !== undefined ? (
                <div><div className="muted">Overall completion</div><div className="big">{Math.round(p.overallCompletion)}%</div><ProgressBar value={p.overallCompletion} label="Overall completion" /></div>
              ) : <p className="muted">No completion data yet.</p>}
              <div className="row">
                {p.streakDays !== undefined && <Badge tone="warning"><Flame size={12} /> {p.streakDays} day streak</Badge>}
                {p.xp !== undefined && <Badge tone="accent"><Zap size={12} /> {p.xp.toLocaleString()} XP</Badge>}
              </div>
            </>
          )}
        </Card>
      </div>

      <section>
        <SectionHeader title="Recommended next" />
        {p && p.recommendations.length > 0 ? (
          <div className="grid grid--2">
            {p.recommendations.map((r) => (
              <Card key={r.title} interactive className="stack">
                <h3>{r.title}</h3>
                {r.reason && <p className="muted">{r.reason}</p>}
                {r.to && <Link to={r.to} className="link">Open <ArrowRight size={14} /></Link>}
              </Card>
            ))}
          </div>
        ) : (
          !progress.isLoading && <p className="muted">Recommendations appear once you’ve completed a quiz or challenge.</p>
        )}
      </section>

      <div className="grid grid--2">
        <section>
          <SectionHeader title="Recent activity" />
          <Card>
            {p && p.recentActivity.length > 0 ? (
              <ul className="list">{p.recentActivity.slice(0, 6).map((a, i) => (
                <li key={i}><span>{a.title}</span><span className="muted">{a.type ?? ''} {a.at ? `· ${formatDate(a.at)}` : ''}</span></li>
              ))}</ul>
            ) : <p className="muted">No activity yet. Run a simulation or finish a lesson to get started.</p>}
          </Card>
        </section>
        <section>
          <SectionHeader title="Achievements" />
          <Card>
            {p && p.achievements.length > 0 ? (
              <ul className="list">{p.achievements.slice(0, 5).map((a) => (
                <li key={a.id}><span><Award size={14} aria-hidden /> {a.name}</span><span className="muted">{formatDate(a.unlockedAt)}</span></li>
              ))}</ul>
            ) : <p className="muted">No achievements yet. Complete your first challenge.</p>}
          </Card>
        </section>
      </div>

      <section>
        <SectionHeader title="My circuits" action={<Link to="/circuits" className="link">View all</Link>} />
        {circuits.isError && <ErrorState error={circuits.error} onRetry={() => void circuits.refetch()} />}
        {circuits.data && circuits.data.length === 0 && (
          <EmptyState icon={<CircuitBoard size={22} />} title="No saved circuits yet" description="Build your first quantum circuit in Quantum Lab."
            action={<Link to="/quantum-lab" className={buttonClass('primary')}>Open Quantum Lab <ArrowRight size={15} /></Link>} />
        )}
        <div className="grid grid--3">
          {circuits.data?.slice(0, 3).map((c) => (
            <Card key={c.id} interactive className="stack">
              <h3>{c.name}</h3>
              <p className="muted">{c.numQubits} qubits · updated {formatDate(c.updatedAt)}</p>
              <Link to={`/circuits/${c.id}`}><Button size="sm">Open</Button></Link>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
