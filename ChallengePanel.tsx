import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Send, XCircle } from 'lucide-react'
import { getChallenge, submitChallenge } from '@/api/assessments'
import { errorMessage } from '@/api/client'
import { Button, buttonClass } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/Modal'
import { Badge, Card } from '@/components/ui/Primitives'
import { ErrorState, Skeleton } from '@/components/ui/States'
import { toBackendCircuit } from '@/quantum/circuitUtils'
import { validateCircuit } from '@/quantum/circuitValidation'
import { useLab } from '@/store/lab'
import { toast } from '@/store/toast'
import { useTutor } from '@/store/tutor'

/** Shown above the Quantum Lab when it is opened with ?challenge=<id>. Correctness is decided by the backend. */
export function ChallengePanel({ challengeId }: { challengeId: string }) {
  const qc = useQueryClient()
  const [confirm, setConfirm] = useState(false)
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['challenge', challengeId], queryFn: () => getChallenge(challengeId) })

  const submit = useMutation({
    mutationFn: () => submitChallenge(challengeId, toBackendCircuit(useLab.getState().circuit)),
    onSuccess: (res) => {
      setConfirm(false)
      toast[res.passed ? 'success' : 'info'](res.passed ? 'Challenge completed' : 'Not quite yet — see the feedback')
      void qc.invalidateQueries({ queryKey: ['progress'] })
      void qc.invalidateQueries({ queryKey: ['challenges'] })
    },
    onError: (e) => { setConfirm(false); toast.error(errorMessage(e)) },
  })

  const onSubmitClick = () => {
    const issues = validateCircuit(useLab.getState().circuit)
    if (issues.length) { toast.error(issues[0].message); return }
    setConfirm(true)
  }

  if (isLoading) return <Card><Skeleton height={70} /></Card>
  if (isError || !data) return <ErrorState error={error} title="Couldn’t load this challenge" onRetry={() => void refetch()} />
  const res = submit.data

  return (
    <Card className="challenge-panel stack">
      <div className="row row--between row--wrap">
        <div className="row"><Badge tone="accent">Challenge</Badge>{data.difficulty && <Badge>{data.difficulty}</Badge>}<h3>{data.title}</h3></div>
        <div className="row">
          <Button size="sm" onClick={() => {
            const s = useLab.getState()
            useTutor.getState().openWith({ challengeId, label: data.title, circuit: toBackendCircuit(s.circuit) }, 'Give me a hint, but not the full answer.', 'hint')
          }}>Give me a hint</Button>
          <Button variant="primary" size="sm" icon={<Send size={14} />} loading={submit.isPending} onClick={onSubmitClick}>Submit circuit</Button>
        </div>
      </div>
      {data.objective && <p><strong>Objective:</strong> {data.objective}</p>}
      {data.instructions && <p className="muted">{data.instructions}</p>}
      {data.target && <p><strong>Target result:</strong> <span className="mono">{data.target}</span></p>}

      {res && (
        <div className={`result-banner ${res.passed ? 'result-banner--ok' : 'result-banner--no'}`} role="status">
          <div className="row">{res.passed ? <CheckCircle2 size={18} /> : <XCircle size={18} />}<strong>{res.passed ? 'Success' : 'Not yet'}</strong>{res.score !== undefined && <Badge>Score {res.score}</Badge>}</div>
          {res.feedback && <p>{res.feedback}</p>}
          {res.actual && <p className="muted">Your result: <span className="mono">{res.actual}</span></p>}
          {res.target && <p className="muted">Target: <span className="mono">{res.target}</span></p>}
          <div className="row row--wrap">
            {res.nextStep && <span className="muted">{res.nextStep}</span>}
            {res.passed && <Link to="/learn" className={buttonClass('primary', 'sm')}>Continue learning</Link>}
            {res.passed && <Link to="/challenges" className={buttonClass('secondary', 'sm')}>More challenges</Link>}
          </div>
        </div>
      )}

      <ConfirmModal open={confirm} title="Submit this circuit?" confirmLabel="Submit" loading={submit.isPending}
        message="Your current circuit will be evaluated by the server. You can keep editing and submit again."
        onClose={() => setConfirm(false)} onConfirm={() => submit.mutate()} />
    </Card>
  )
}
