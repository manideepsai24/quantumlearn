import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getChallenge } from '@/api/assessments'
import { OpenInLab } from '@/components/learning/OpenInLab'
import { Badge, Card, PageHeader, PageHeaderBack } from '@/components/ui/Primitives'
import { ErrorState, PageSkeleton } from '@/components/ui/States'
import { useLab } from '@/store/lab'

export default function ChallengeDetail() {
  const { id = '' } = useParams()
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['challenge', id], queryFn: () => getChallenge(id) })
  if (isLoading) return <PageSkeleton />
  if (isError || !data) return <ErrorState error={error} title="Couldn’t load this challenge" onRetry={() => void refetch()} />
  return (
    <div className="stack stack--lg narrow-lg">
      <PageHeaderBack to="/challenges" label="Challenges" />
      <PageHeader title={data.title} actions={data.difficulty ? <Badge tone="accent">{data.difficulty}</Badge> : undefined} />
      {data.objective && <Card className="stack"><h3>Objective</h3><p>{data.objective}</p></Card>}
      {data.instructions && <Card className="stack"><h3>Instructions</h3><p>{data.instructions}</p></Card>}
      {data.target && <Card className="stack"><h3>Target result</h3><p className="mono">{data.target}</p></Card>}
      <div><span onClickCapture={() => useLab.getState().reset()}><OpenInLab challengeId={data.id} label="Build it in Quantum Lab" /></span></div>
    </div>
  )
}
