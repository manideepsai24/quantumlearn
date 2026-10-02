import { useState } from 'react'
import { MessageCircleQuestion, Sparkles } from 'lucide-react'
import { Badge, Card } from '@/components/ui/Primitives'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { formatDuration, formatPercent, ket } from '@/lib/format'
import type { QuantumCircuit } from '@/quantum/circuitTypes'
import { countGates } from '@/quantum/circuitUtils'
import type { SimulationResult, TutorMode } from '@/types'
import { BlochSphere } from './BlochSphere'
import { ProbabilityChart } from './ProbabilityChart'
import { StatevectorViewer } from './StatevectorViewer'

type Tab = 'probabilities' | 'counts' | 'statevector' | 'bloch' | 'details'
const TABS: { value: Tab; label: string }[] = [
  { value: 'probabilities', label: 'Probabilities' },
  { value: 'counts', label: 'Counts' },
  { value: 'statevector', label: 'Statevector' },
  { value: 'bloch', label: 'Bloch sphere' },
  { value: 'details', label: 'Details' },
]

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <div className="stat__label">{label}</div>
      <div className="stat__value">{value}</div>
    </div>
  )
}

function Unavailable({ what }: { what: string }) {
  return <p className="muted">The simulator didn’t return {what} for this run.</p>
}

function CountsTable({ counts, shots }: { counts: Record<string, number>; shots?: number }) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const total = shots ?? entries.reduce((s, [, c]) => s + c, 0)
  return (
    <div className="table-wrap">
      <table className="table">
        <caption className="sr-only">Measurement counts</caption>
        <thead><tr><th>Outcome</th><th>Count</th><th>Share of {total.toLocaleString()} shots</th></tr></thead>
        <tbody>
          {entries.slice(0, 64).map(([state, count]) => (
            <tr key={state}>
              <td className="mono">{ket(state)}</td>
              <td className="mono">{count.toLocaleString()}</td>
              <td>
                <div className="bar-cell">
                  <div className="bar-cell__bar" style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
                  <span className="mono">{total ? formatPercent(count / total) : '—'}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {entries.length > 64 && <p className="muted">Showing the 64 most frequent of {entries.length} outcomes.</p>}
    </div>
  )
}

export function ResultsPanel({ result, submitted, stale, onAsk }: {
  result: SimulationResult
  submitted: QuantumCircuit
  stale: boolean
  onAsk: (prompt: string, mode: TutorMode) => void
}) {
  const [tab, setTab] = useState<Tab>('probabilities')
  const qubits = result.numQubits ?? submitted.num_qubits
  const shots = result.shots ?? submitted.shots
  const gateCounts = result.gateCounts ?? countGates(submitted.gates)

  return (
    <Card className="results">
      <div className="results__head">
        <h2>Simulation results</h2>
        {stale && <Badge tone="warning">Circuit changed since this run</Badge>}
        <div className="results__ask">
          <Button size="sm" icon={<MessageCircleQuestion size={14} />} onClick={() => onAsk('Why did this happen? Explain these measurement results.', 'why')}>Why did this happen?</Button>
          <Button size="sm" icon={<Sparkles size={14} />} onClick={() => onAsk('Explain the statevector and what each amplitude means.', 'explain')}>Explain statevector</Button>
        </div>
      </div>

      <div className="stats">
        {result.backend && <Stat label="Backend" value={result.backend} />}
        <Stat label="Qubits" value={String(qubits)} />
        {shots !== undefined && <Stat label="Shots" value={shots.toLocaleString()} />}
        {result.executionTimeMs !== undefined && <Stat label="Execution time" value={formatDuration(result.executionTimeMs)} />}
        {result.depth !== undefined && <Stat label="Circuit depth" value={String(result.depth)} />}
      </div>

      <Tabs value={tab} tabs={TABS} onChange={setTab} label="Result views" />
      <div className="results__panel" role="tabpanel">
        {tab === 'probabilities' && (result.probabilities
          ? <ProbabilityChart probabilities={result.probabilities} numQubits={qubits} />
          : <Unavailable what="probabilities" />)}
        {tab === 'counts' && (result.counts ? <CountsTable counts={result.counts} shots={shots} /> : <Unavailable what="measurement counts" />)}
        {tab === 'statevector' && (result.statevector ? <StatevectorViewer amplitudes={result.statevector} /> : <Unavailable what="a statevector" />)}
        {tab === 'bloch' && <BlochSphere vectors={result.bloch} />}
        {tab === 'details' && (
          <div className="stack">
            <h3>Gate statistics</h3>
            <div className="row row--wrap">
              {Object.entries(gateCounts).map(([k, v]) => <Badge key={k}>{k}: {v}</Badge>)}
              {Object.keys(gateCounts).length === 0 && <span className="muted">No gates.</span>}
            </div>
            {result.id && <p className="muted">Simulation ID: <span className="mono">{result.id}</span></p>}
          </div>
        )}
      </div>
    </Card>
  )
}
