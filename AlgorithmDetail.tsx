import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAlgorithm } from '@/api/algorithms'
import { CircuitPreview } from '@/components/learning/CircuitPreview'
import { Markdown } from '@/components/learning/Markdown'
import { OpenInLab } from '@/components/learning/OpenInLab'
import { buttonClass } from '@/components/ui/Button'
import { Badge, Card, PageHeader, PageHeaderBack } from '@/components/ui/Primitives'
import { ErrorState, PageSkeleton } from '@/components/ui/States'

function Block({ title, children }: { title: string; children: ReactNode }) {
  return <Card className="stack"><h3>{title}</h3>{children}</Card>
}

export default function AlgorithmDetail() {
  const { slug = '' } = useParams()
  const { data: a, isLoading, isError, error, refetch } = useQuery({ queryKey: ['algorithm', slug], queryFn: () => getAlgorithm(slug) })
  if (isLoading) return <PageSkeleton />
  if (isError || !a) return <ErrorState error={error} title="Couldn’t load this algorithm" onRetry={() => void refetch()} />
  return (
    <div className="stack stack--lg narrow-lg">
      <PageHeaderBack to="/algorithms" label="Algorithms" />
      <PageHeader title={a.name} subtitle={a.description} actions={a.difficulty ? <Badge tone="accent">{a.difficulty}</Badge> : undefined} />
      {a.whyItMatters && <Block title="Why it matters"><Markdown source={a.whyItMatters} /></Block>}
      {a.objectives.length > 0 && <Block title="Learning objectives"><ul>{a.objectives.map((o) => <li key={o}>{o}</li>)}</ul></Block>}
      {a.prerequisites.length > 0 && <Block title="Prerequisites"><div className="row row--wrap">{a.prerequisites.map((p) => <Badge key={p}>{p}</Badge>)}</div></Block>}
      {a.howItWorks && <Block title="How it works"><Markdown source={a.howItWorks} /></Block>}
      {a.math && <Block title="Mathematical intuition"><Markdown source={a.math} /></Block>}
      {a.circuit && <Block title="Circuit"><CircuitPreview circuit={a.circuit} /></Block>}
      {a.expected && <Block title="Expected behavior"><Markdown source={a.expected} /></Block>}
      {a.pseudocode && <Block title="Pseudocode"><pre className="code"><code>{a.pseudocode}</code></pre></Block>}
      {a.code && <Block title="Python / Qiskit example"><pre className="code"><code>{a.code}</code></pre></Block>}
      <div className="row row--wrap">
        <OpenInLab circuit={a.circuit} />
        {a.lessonId && <Link to={`/learn/lessons/${a.lessonId}`} className={buttonClass('secondary')}>Related lesson</Link>}
        {a.challengeId && <Link to={`/challenges/${a.challengeId}`} className={buttonClass('secondary')}>Related challenge</Link>}
        {a.quizId && <Link to={`/quizzes/${a.quizId}`} className={buttonClass('secondary')}>Related quiz</Link>}
      </div>
    </div>
  )
}
