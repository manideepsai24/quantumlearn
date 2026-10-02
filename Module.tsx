import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Circle } from 'lucide-react'
import { getModule } from '@/api/learning'
import { Card, PageHeader, PageHeaderBack, ProgressBar } from '@/components/ui/Primitives'
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/States'

export default function Module() {
  const { moduleId = '' } = useParams()
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['module', moduleId], queryFn: () => getModule(moduleId) })
  if (isLoading) return <PageSkeleton />
  if (isError || !data) return <ErrorState error={error} title="Couldn’t load this module" onRetry={() => void refetch()} />
  return (
    <div className="stack stack--lg">
      <PageHeaderBack to="/learn" label="Courses" />
      <PageHeader title={data.title} subtitle={data.description} />
      {data.progress !== undefined && <ProgressBar value={data.progress} label="Module progress" />}
      {data.lessons.length === 0 && <EmptyState title="No lessons in this module yet" />}
      <Card>
        <ul className="list">
          {data.lessons.map((l) => (
            <li key={l.id}>
              <Link to={`/learn/lessons/${l.id}`} className="lesson-link">
                {l.completed ? <CheckCircle2 size={16} className="ok" /> : <Circle size={16} />}{l.title}
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
