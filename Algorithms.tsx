import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Workflow } from 'lucide-react'
import { getAlgorithms } from '@/api/algorithms'
import { buttonClass } from '@/components/ui/Button'
import { Badge, Card, PageHeader, ProgressBar, Skeleton } from '@/components/ui/Primitives'
import { EmptyState, ErrorState } from '@/components/ui/States'

export default function Algorithms() {
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['algorithms'], queryFn: getAlgorithms })
  return (
    <div className="stack stack--lg">
      <PageHeader title="Quantum algorithms" subtitle="From Bell states to Grover search." />
      {isLoading && <div className="grid grid--3">{[0, 1, 2].map((i) => <Skeleton key={i} height={190} radius={18} />)}</div>}
      {isError && <ErrorState error={error} title="Couldn’t load algorithms" onRetry={() => void refetch()} />}
      {data?.length === 0 && <EmptyState icon={<Workflow size={22} />} title="No algorithms yet" />}
      <div className="grid grid--3">
        {data?.map((a) => (
          <Card key={a.slug} interactive className="stack">
            {a.difficulty && <div><Badge tone="accent">{a.difficulty}</Badge></div>}
            <h3>{a.name}</h3>
            {a.description && <p className="muted">{a.description}</p>}
            {a.prerequisites.length > 0 && <p className="muted caption">Prerequisites: {a.prerequisites.join(', ')}</p>}
            {a.progress !== undefined && <ProgressBar value={a.progress} label={`${a.name} progress`} />}
            <Link to={`/algorithms/${a.slug}`} className={buttonClass('secondary', 'sm')}>Open</Link>
          </Card>
        ))}
      </div>
    </div>
  )
}
