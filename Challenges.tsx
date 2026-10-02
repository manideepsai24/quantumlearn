import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Swords } from 'lucide-react'
import { getChallenges } from '@/api/assessments'
import { buttonClass } from '@/components/ui/Button'
import { Badge, Card, PageHeader, Skeleton } from '@/components/ui/Primitives'
import { EmptyState, ErrorState } from '@/components/ui/States'

export default function Challenges() {
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['challenges'], queryFn: getChallenges })
  return (
    <div className="stack stack--lg">
      <PageHeader title="Quantum challenges" subtitle="Build a circuit that produces the target result. The server checks your answer." />
      {isLoading && <div className="grid grid--3">{[0, 1, 2].map((i) => <Skeleton key={i} height={160} radius={18} />)}</div>}
      {isError && <ErrorState error={error} title="Couldn’t load challenges" onRetry={() => void refetch()} />}
      {data?.length === 0 && <EmptyState icon={<Swords size={22} />} title="No challenges yet" />}
      <div className="grid grid--3">
        {data?.map((c) => (
          <Card key={c.id} interactive className="stack">
            <div className="row">{c.difficulty && <Badge tone="accent">{c.difficulty}</Badge>}{c.completed && <Badge tone="success"><CheckCircle2 size={12} /> Done</Badge>}</div>
            <h3>{c.title}</h3>
            {c.objective && <p className="muted">{c.objective}</p>}
            <Link to={`/challenges/${c.id}`} className={buttonClass('secondary', 'sm')}>{c.completed ? 'Review' : 'Start'}</Link>
          </Card>
        ))}
      </div>
    </div>
  )
}
