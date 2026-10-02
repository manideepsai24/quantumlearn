import { ArrowUp } from 'lucide-react'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Primitives'

const STEPS = ['Preparing circuit', 'Executing quantum simulation', 'Analyzing measurements', 'Preparing visualization']

export function RunningState() {
  return (
    <Card className="running" role="status" aria-live="polite">
      <div className="orbit" aria-hidden="true"><span className="orbit__ring" /><span className="orbit__dot" /></div>
      <div>
        <h3>Running your circuit</h3>
        <ul className="running__steps">
          {STEPS.map((s, i) => <li key={s} style={{ animationDelay: `${i * 0.25}s` }}><span className="pulse-dot" />{s}</li>)}
        </ul>
      </div>
    </Card>
  )
}

export function SimulationError({ error, onBack }: { error: unknown; onBack: () => void }) {
  const api = error instanceof ApiError ? error : null
  const tooLarge = !!api && (api.status === 413 || /LIMIT|TOO_LARGE/i.test(api.code) || /limit|maximum/i.test(api.message))
  const invalid = api?.code === 'INVALID_CIRCUIT'
  const title = tooLarge ? 'This circuit is too large to simulate' : invalid ? 'The server rejected this circuit' : 'The simulation didn’t finish'
  return (
    <Card className="sim-error" role="alert">
      <h3>{title}</h3>
      <p className="muted">{api?.message ?? 'Something went wrong. Please try again.'}</p>
      {tooLarge && <p className="muted">Reduce the number of qubits and try again.</p>}
      <Button icon={<ArrowUp size={15} />} onClick={onBack}>Back to circuit</Button>
    </Card>
  )
}
