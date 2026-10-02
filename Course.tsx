import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Circle } from 'lucide-react'
import { getCourse } from '@/api/learning'
import { Card, PageHeader, PageHeaderBack, ProgressBar } from '@/components/ui/Primitives'
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/States'

export default function Course() {
  const { courseId = '' } = useParams()
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['course', courseId], queryFn: () => getCourse(courseId) })
  if (isLoading) return <PageSkeleton />
  if (isError || !data) return <ErrorState error={error} title="Couldn’t load this course" onRetry={() => void refetch()} />
  return (
    <div className="stack stack--lg">
      <PageHeaderBack to="/learn" label="All courses" />
      <PageHeader title={data.title} subtitle={data.description} />
      {data.progress !== undefined && <ProgressBar value={data.progress} label="Course progress" />}
      {data.modules.length === 0 && <EmptyState title="No modules yet" />}
      {data.modules.map((m, i) => (
        <Card key={m.id} className="stack">
          <div className="row row--between">
            <h3>{i + 1}. <Link to={`/learn/modules/${m.id}`} className="link">{m.title}</Link></h3>
            {m.progress !== undefined && <span className="muted">{Math.round(m.progress)}%</span>}
          </div>
          {m.description && <p className="muted">{m.description}</p>}
          <ul className="list">
            {m.lessons.map((l) => (
              <li key={l.id}>
                <Link to={`/learn/lessons/${l.id}`} className="lesson-link">
                  {l.completed ? <CheckCircle2 size={16} className="ok" aria-label="Completed" /> : <Circle size={16} aria-label="Not completed" />}
                  {l.title}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  )
}
