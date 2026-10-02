import { Fragment, useState } from 'react'
import { ArrowLeft, ArrowRight, Copy, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Primitives'
import { SHORTCUTS } from '@/constants/navigation'
import { GATE_DEFS } from '@/quantum/circuitTypes'
import type { EditorCircuit } from '@/quantum/circuitTypes'
import { columnsUsed, countGates, formatAngle, parseAngle } from '@/quantum/circuitUtils'
import type { ValidationIssue } from '@/quantum/circuitValidation'
import { toast } from '@/store/toast'
import { useLab } from '@/store/lab'

const PRESETS: { label: string; value: number }[] = [
  { label: 'π/4', value: Math.PI / 4 },
  { label: 'π/2', value: Math.PI / 2 },
  { label: 'π', value: Math.PI },
  { label: '2π', value: 2 * Math.PI },
  { label: '−π/2', value: -Math.PI / 2 },
]

function AngleField({ theta, onApply }: { theta: number; onApply: (v: number) => void }) {
  const [text, setText] = useState(formatAngle(theta))
  const [error, setError] = useState(false)
  const apply = () => {
    const v = parseAngle(text)
    if (v === null) { setError(true); return }
    setError(false)
    onApply(v)
  }
  return (
    <div className="field">
      <label htmlFor="angle-input">Angle θ (radians)</label>
      <div className="row">
        <input id="angle-input" className={`input ${error ? 'input--error' : ''}`} value={text} aria-invalid={error}
          onChange={(e) => setText(e.target.value)} onBlur={apply}
          onKeyDown={(e) => { if (e.key === 'Enter') apply() }} />
        <Button size="sm" onClick={apply}>Apply</Button>
      </div>
      {error && <p className="field__error">Try values like pi/2, 3π/4, or 1.57.</p>}
      <div className="row row--wrap">
        {PRESETS.map((p) => <button key={p.label} className="chip chip--action" onClick={() => { setText(p.label); onApply(p.value) }}>{p.label}</button>)}
      </div>
    </div>
  )
}

export function GateInspector({ circuit, selectedId, issues, onSelect }: {
  circuit: EditorCircuit
  selectedId: string | null
  issues: ValidationIssue[]
  onSelect: (id: string) => void
}) {
  const gate = circuit.gates.find((g) => g.id === selectedId)
  const report = (msg: string | null) => { if (msg) toast.error(msg) }

  if (!gate) {
    const counts = countGates(circuit.gates)
    return (
      <div className="inspector">
        <h3 className="panel-title">Circuit</h3>
        <dl className="kv">
          <dt>Qubits</dt><dd>{circuit.numQubits}</dd>
          <dt>Gates</dt><dd>{circuit.gates.length}</dd>
          <dt>Columns used</dt><dd>{columnsUsed(circuit)}</dd>
          <dt>Shots</dt><dd>{circuit.shots.toLocaleString()}</dd>
        </dl>
        {Object.keys(counts).length > 0 && (
          <div className="row row--wrap">{Object.entries(counts).map(([k, v]) => <Badge key={k}>{k}: {v}</Badge>)}</div>
        )}
        {issues.length > 0 && (
          <div className="issues" role="alert">
            <strong>Needs attention</strong>
            <ul>{issues.map((i, idx) => (
              <li key={idx}>{i.gateId ? <button className="link" onClick={() => onSelect(i.gateId as string)}>{i.message}</button> : i.message}</li>
            ))}</ul>
          </div>
        )}
        <details className="shortcuts">
          <summary>Keyboard shortcuts</summary>
          <dl className="kv">{SHORTCUTS.map((s) => <Fragment key={s.keys}><dt><kbd>{s.keys}</kbd></dt><dd>{s.action}</dd></Fragment>)}</dl>
        </details>
      </div>
    )
  }

  const def = GATE_DEFS[gate.type]
  const theta = def.parameter ? gate.parameters?.[def.parameter] : undefined
  const act = useLab.getState()
  return (
    <div className="inspector">
      <h3 className="panel-title">{def.name}</h3>
      <div className="inspector__symbol">{def.symbol}</div>
      <p className="muted">{def.description}</p>
      <dl className="kv">
        {gate.controls && gate.controls.length > 0 && (<><dt>Controls</dt><dd>{gate.controls.map((q) => `q${q}`).join(', ')}</dd></>)}
        <dt>Targets</dt><dd>{gate.targets.map((q) => `q${q}`).join(', ')}</dd>
        <dt>Column</dt><dd>{gate.column + 1}</dd>
      </dl>
      {def.parameter && theta !== undefined && (
        <AngleField key={`${gate.id}:${theta}`} theta={theta} onApply={(v) => act.setParameter(gate.id, v)} />
      )}
      <div className="row row--wrap">
        <Button size="sm" iconOnly aria-label="Move left" icon={<ArrowLeft size={15} />} onClick={() => report(act.moveSelected(-1, 0))} />
        <Button size="sm" iconOnly aria-label="Move right" icon={<ArrowRight size={15} />} onClick={() => report(act.moveSelected(1, 0))} />
        <Button size="sm" icon={<Copy size={14} />} onClick={() => report(act.duplicateSelected())}>Duplicate</Button>
        <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => act.removeSelected()}>Remove</Button>
      </div>
    </div>
  )
}
