import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpen } from 'lucide-react'
import { getCourses } from '@/api/learning'
import { Badge, Card, PageHeader, ProgressBar, Skeleton } from '@/components/ui/Primitives'
import { buttonClass } from '@/components/ui/Button'
import { EmptyState, ErrorState } from '@/components/ui/States'

export default function Learn() {
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['courses'], queryFn: getCourses })
  return (
    <div className="stack stack--lg">
      <PageHeader title="Learn" subtitle="Courses that take you from the qubit to real algorithms." />
      {isLoading && <div className="grid grid--3">{[0, 1, 2].map((i) => <Skeleton key={i} height={190} radius={18} />)}</div>}
      {isError && <ErrorState error={error} title="Couldn’t load courses" onRetry={() => void refetch()} />}
      {data?.length === 0 && <EmptyState icon={<BookOpen size={22} />} title="No courses yet" description="Courses will appear here once they’re published." />}
      <div className="grid grid--3">
        {data?.map((c) => (
          <Card key={c.id} interactive className="stack">
            <div className="row">{c.difficulty && <Badge tone="accent">{c.difficulty}</Badge>}<Badge>{c.modules.length} modules</Badge></div>
            <h3>{c.title}</h3>
            {c.description && <p className="muted">{c.description}</p>}
            {c.progress !== undefined && <ProgressBar value={c.progress} label={`${c.title} progress`} />}
            <Link to={`/learn/courses/${c.id}`} className={buttonClass(c.progress ? 'primary' : 'secondary', 'sm')}>{c.progress ? 'Continue' : 'Open course'}</Link>
          </Card>
        ))}
      </div>
    </div>
  )
}
