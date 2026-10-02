import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Check, MessageCircleQuestion, Sparkles } from 'lucide-react'
import { completeLesson, getLesson } from '@/api/learning'
import { errorMessage } from '@/api/client'
import { CircuitPreview } from '@/components/learning/CircuitPreview'
import { Markdown } from '@/components/learning/Markdown'
import { OpenInLab } from '@/components/learning/OpenInLab'
import { Button, buttonClass } from '@/components/ui/Button'
import { Card, PageHeaderBack } from '@/components/ui/Primitives'
import { ErrorState, PageSkeleton } from '@/components/ui/States'
import { toast } from '@/store/toast'
import { useTutor } from '@/store/tutor'

export default function Lesson() {
  const { lessonId = '' } = useParams()
  const qc = useQueryClient()
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['lesson', lessonId], queryFn: () => getLesson(lessonId) })

  const complete = useMutation({
    mutationFn: () => completeLesson(lessonId),
    onSuccess: () => {
      toast.success('Lesson completed')
      void qc.invalidateQueries({ queryKey: ['progress'] })
      void qc.invalidateQueries({ queryKey: ['lesson', lessonId] })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  if (isLoading) return <PageSkeleton />
  if (isError || !data) return <ErrorState error={error} title="Couldn’t load this lesson" onRetry={() => void refetch()} />

  const ask = (prompt: string) =>
    useTutor.getState().openWith({ lessonId: data.id, label: data.title, circuit: data.circuit, algorithm: data.algorithm }, prompt, 'explain')

  return (
    <article className="stack stack--lg narrow-lg">
      <PageHeaderBack to="/learn" label="Courses" />
      <h1>{data.title}</h1>
      <Markdown source={data.content || 'This lesson has no content yet.'} />

      {data.circuit && (
        <Card className="stack">
          <h3>Circuit</h3>
          <CircuitPreview circuit={data.circuit} />
          <div className="row"><OpenInLab circuit={data.circuit} /></div>
        </Card>
      )}

      <Card className="stack">
        <h3>Need a hand?</h3>
        <div className="row row--wrap">
          <Button icon={<Sparkles size={15} />} onClick={() => ask('Explain this concept.')}>Explain this concept</Button>
          <Button icon={<MessageCircleQuestion size={15} />} onClick={() => ask('Give me an example.')}>Give me an example</Button>
          <Button onClick={() => ask('Quiz me on this lesson, one question at a time.')}>Quiz me</Button>
        </div>
      </Card>

      <div className="row row--wrap lesson-next">
        {!data.circuit && <OpenInLab label="Open Quantum Lab" />}
        {data.algorithm && <Link to={`/algorithms/${data.algorithm}`} className={buttonClass('secondary')}>Related algorithm</Link>}
        {data.challengeId && <Link to={`/challenges/${data.challengeId}`} className={buttonClass('secondary')}>Practice challenge</Link>}
        {data.quizId && <Link to={`/quizzes/${data.quizId}`} className={buttonClass('secondary')}>Take quiz</Link>}
        <div className="lab__spacer" />
        <Button variant={data.completed ? 'secondary' : 'primary'} icon={<Check size={15} />} loading={complete.isPending} disabled={data.completed} onClick={() => complete.mutate()}>
          {data.completed ? 'Completed' : 'Complete lesson'}
        </Button>
        {data.nextLessonId && <Link to={`/learn/lessons/${data.nextLessonId}`} className={buttonClass('primary')}>Continue <ArrowRight size={15} /></Link>}
      </div>
    </article>
  )
}
