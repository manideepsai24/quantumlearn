import { useState } from 'react'
import { GATE_DEFS, GATE_GROUPS, GATE_ORDER } from '@/quantum/circuitTypes'
import type { GateType } from '@/quantum/circuitTypes'

export function GatePalette({ armed, onArm }: { armed: GateType | null; onArm: (t: GateType | null) => void }) {
  const [hover, setHover] = useState<GateType | null>(null)
  const info = hover ?? armed
  return (
    <div className="palette-panel">
      <h3 className="panel-title">Gates</h3>
      {GATE_GROUPS.map((group) => (
        <div key={group} className="palette-group">
          <div className="palette-group__name">{group}</div>
          <div className="palette-group__grid">
            {GATE_ORDER.filter((t) => GATE_DEFS[t].group === group).map((t) => (
              <button key={t} type="button" className={`gate-chip ${armed === t ? 'is-armed' : ''}`} aria-pressed={armed === t}
                title={GATE_DEFS[t].description} aria-label={`${GATE_DEFS[t].name}. ${GATE_DEFS[t].description}`}
                onClick={() => onArm(armed === t ? null : t)}
                onMouseEnter={() => setHover(t)} onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(t)} onBlur={() => setHover(null)}>
                {GATE_DEFS[t].symbol}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="palette-info" aria-live="polite">
        {info ? (
          <>
            <strong>{GATE_DEFS[info].name}</strong>
            <p className="muted">{GATE_DEFS[info].description}</p>
          </>
        ) : (
          <p className="muted">Pick a gate, then click a spot on a wire. Press Esc to stop placing.</p>
        )}
      </div>
    </div>
  )
}
