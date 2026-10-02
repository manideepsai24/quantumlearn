import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { getQuiz, submitQuiz } from '@/api/assessments'
import { errorMessage } from '@/api/client'
import { CircuitPreview } from '@/components/learning/CircuitPreview'
import { Button, buttonClass } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/Modal'
import { Badge, Card, PageHeaderBack, ProgressBar } from '@/components/ui/Primitives'
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/States'
import { toast } from '@/store/toast'

export default function Quiz() {
  const { id = '' } = useParams()
  const qc = useQueryClient()
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [confirm, setConfirm] = useState(false)
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['quiz', id], queryFn: () => getQuiz(id) })

  const submit = useMutation({
    mutationFn: () => submitQuiz(id, answers),
    onSuccess: () => { setConfirm(false); toast.success('Quiz submitted'); void qc.invalidateQueries({ queryKey: ['progress'] }) },
    onError: (e) => { setConfirm(false); toast.error(errorMessage(e)) },
  })

  if (isLoading) return <PageSkeleton />
  if (isError || !data) return <ErrorState error={error} title="Couldn’t load this quiz" onRetry={() => void refetch()} />
  if (data.questions.length === 0) return <EmptyState title="This quiz has no questions yet" />

  const res = submit.data
  if (res) {
    const pct = res.percentage ?? (res.score !== undefined && res.total ? (res.score / res.total) * 100 : undefined)
    return (
      <div className="stack stack--lg narrow-lg">
        <Card className="stack quiz-result">
          <h1>{res.passed === false ? 'Keep going.' : 'Great work.'}</h1>
          {res.score !== undefined && res.total !== undefined && <div className="big">{res.score} / {res.total}</div>}
          {pct !== undefined && <div className="row"><span className="muted">{Math.round(pct)}%</span>{res.passed !== undefined && <Badge tone={res.passed ? 'success' : 'warning'}>{res.passed ? 'Passed' : 'Not passed'}</Badge>}</div>}
          {res.feedback && <p>{res.feedback}</p>}
          {res.strong.length > 0 && <p><strong>You are strong in:</strong> {res.strong.join(', ')}</p>}
          {res.review.length > 0 && <p><strong>Review:</strong> {res.review.join(', ')}</p>}
        </Card>
        {res.explanations.length > 0 && (
          <Card className="stack"><h3>Explanations</h3>
            <ul className="list list--stack">{res.explanations.map((e, i) => <li key={i}><div><strong>{e.question}</strong>{e.correct !== undefined && <Badge tone={e.correct ? 'success' : 'error'}>{e.correct ? 'Correct' : 'Incorrect'}</Badge>}<p className="muted">{e.explanation}</p></div></li>)}</ul>
          </Card>
        )}
        <div className="row"><Link to={res.nextTo ?? '/learn'} className={buttonClass('primary')}>Continue learning</Link><Link to="/progress" className={buttonClass('secondary')}>See progress</Link></div>
      </div>
    )
  }

  const q = data.questions[index]
  const selected = answers[q.id] ?? []
  const choose = (optId: string) =>
    setAnswers((a) => {
      const cur = a[q.id] ?? []
      if (q.multiple) return { ...a, [q.id]: cur.includes(optId) ? cur.filter((x) => x !== optId) : [...cur, optId] }
      return { ...a, [q.id]: [optId] }
    })
  const unanswered = data.questions.filter((x) => (answers[x.id] ?? []).length === 0).length
  const last = index === data.questions.length - 1

  return (
    <div className="stack stack--lg narrow-lg">
      <PageHeaderBack to="/learn" label="Learn" />
      <div className="stack">
        <div className="row row--between"><h2>{data.title}</h2><span className="muted">Question {index + 1} of {data.questions.length}</span></div>
        <ProgressBar value={((index + 1) / data.questions.length) * 100} label="Quiz progress" />
      </div>
      <motion.div key={q.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
        <Card className="stack">
          <h3 className="quiz__prompt">{q.prompt}</h3>
          {q.circuit && <CircuitPreview circuit={q.circuit} />}
          <fieldset className="quiz__options">
            <legend className="sr-only">{q.multiple ? 'Select all that apply' : 'Select one answer'}</legend>
            {q.multiple && <p className="muted">Select all that apply.</p>}
            {q.options.map((o) => {
              const on = selected.includes(o.id)
              return (
                <label key={o.id} className={`option ${on ? 'is-selected' : ''}`}>
                  <input type={q.multiple ? 'checkbox' : 'radio'} name={q.id} checked={on} onChange={() => choose(o.id)} />
                  <span>{o.text}</span>
                </label>
              )
            })}
          </fieldset>
        </Card>
      </motion.div>
      <div className="row row--between">
        <Button icon={<ArrowLeft size={15} />} disabled={index === 0} onClick={() => setIndex(index - 1)}>Previous</Button>
        {last
          ? <Button variant="primary" onClick={() => setConfirm(true)}>Submit quiz</Button>
          : <Button variant="primary" onClick={() => setIndex(index + 1)}>Next <ArrowRight size={15} /></Button>}
      </div>
      <ConfirmModal open={confirm} title="Submit your answers?" confirmLabel="Submit" loading={submit.isPending}
        message={unanswered > 0 ? `${unanswered} question${unanswered === 1 ? ' is' : 's are'} unanswered. You can still submit.` : 'The server will score your quiz.'}
        onClose={() => setConfirm(false)} onConfirm={() => submit.mutate()} />
    </div>
  )
}
