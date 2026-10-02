import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { GATE_DEFS, LIMITS } from '@/quantum/circuitTypes'
import type { EditorCircuit, EditorGate, GateType } from '@/quantum/circuitTypes'
import { formatAngle, gateQubits, gateSpan } from '@/quantum/circuitUtils'

const CELL_W = 72
const ROW_H = 60
const LABEL_W = 64
const PAD_Y = 12
const BOX = 40

const xOf = (c: number) => LABEL_W + c * CELL_W + CELL_W / 2
const yOf = (q: number) => PAD_Y + q * ROW_H + ROW_H / 2

interface GateGlyphProps {
  gate: EditorGate
  selected: boolean
  flagged: boolean
  onSelect: (id: string) => void
}

const GateGlyph = memo(function GateGlyph({ gate, selected, flagged, onSelect }: GateGlyphProps) {
  const def = GATE_DEFS[gate.type]
  const x = xOf(gate.column)
  const qs = gateQubits(gate)
  const [lo, hi] = gateSpan(gate)
  const controls = gate.controls ?? []
  const theta = def.parameter ? gate.parameters?.[def.parameter] : undefined
  const label = `${def.name} on ${qs.map((q) => `q${q}`).join(', ')}, column ${gate.column + 1}${selected ? ', selected' : ''}`
  const kind = gate.type === 'CNOT' || gate.type === 'CCX' ? 'cx' : gate.type === 'CZ' ? 'cz' : gate.type === 'SWAP' ? 'swap' : 'box'

  return (
    <motion.g
      className={`gate gate--${def.group === 'Rotation' ? 'rot' : 'std'} ${selected ? 'gate--selected' : ''} ${flagged ? 'gate--flagged' : ''}`}
      role="button" tabIndex={0} aria-label={label} aria-pressed={selected}
      initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 520, damping: 34 }}
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      onClick={(e) => { e.stopPropagation(); onSelect(gate.id) }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(gate.id) } }}
    >
      <rect className="gate__sel" x={x - 25} y={yOf(lo) - 25} width={50} height={yOf(hi) - yOf(lo) + 50} rx={14} />
      <rect className="gate__hit" x={x - 22} y={yOf(lo) - 22} width={44} height={yOf(hi) - yOf(lo) + 44} />
      {lo !== hi && <line className="gate__link" x1={x} x2={x} y1={yOf(lo)} y2={yOf(hi)} />}
      {controls.map((c) => <circle key={c} className="gate__dot" cx={x} cy={yOf(c)} r={5} />)}
      {kind === 'cx' && gate.targets.map((t) => (
        <g key={t}>
          <circle className="gate__target" cx={x} cy={yOf(t)} r={13} />
          <line className="gate__plus" x1={x - 13} x2={x + 13} y1={yOf(t)} y2={yOf(t)} />
          <line className="gate__plus" x1={x} x2={x} y1={yOf(t) - 13} y2={yOf(t) + 13} />
        </g>
      ))}
      {kind === 'cz' && gate.targets.map((t) => <circle key={t} className="gate__dot" cx={x} cy={yOf(t)} r={5} />)}
      {kind === 'swap' && gate.targets.map((t) => (
        <g key={t}>
          <line className="gate__cross" x1={x - 8} x2={x + 8} y1={yOf(t) - 8} y2={yOf(t) + 8} />
          <line className="gate__cross" x1={x - 8} x2={x + 8} y1={yOf(t) + 8} y2={yOf(t) - 8} />
        </g>
      ))}
      {kind === 'box' && gate.targets.map((t) => (
        <g key={t}>
          <rect className="gate__box" x={x - BOX / 2} y={yOf(t) - BOX / 2} width={BOX} height={BOX} rx={10} />
          <text className="gate__text" x={x} y={yOf(t) + (theta !== undefined ? -1 : 5)} textAnchor="middle">{def.symbol}</text>
          {theta !== undefined && <text className="gate__angle" x={x} y={yOf(t) + 12} textAnchor="middle">{formatAngle(theta)}</text>}
        </g>
      ))}
    </motion.g>
  )
})

interface Props {
  circuit: EditorCircuit
  selectedId: string | null
  armed: GateType | null
  picks: number[]
  pickColumn: number | null
  flaggedIds: Set<string>
  onCell: (qubit: number, column: number) => void
  onSelect: (id: string | null) => void
}

export function CircuitEditor({ circuit, selectedId, armed, picks, pickColumn, flaggedIds, onCell, onSelect }: Props) {
  const n = circuit.numQubits
  const maxCol = circuit.gates.reduce((m, g) => Math.max(m, g.column), -1)
  const cols = Math.min(LIMITS.maxColumns, Math.max(8, maxCol + 3))
  const width = LABEL_W + cols * CELL_W + 16
  const height = PAD_Y * 2 + n * ROW_H

  const occupied = useMemo(() => {
    const grid = new Set<string>()
    for (const g of circuit.gates) {
      const [lo, hi] = gateSpan(g)
      for (let q = lo; q <= hi; q++) grid.add(`${g.column}:${q}`)
    }
    return grid
  }, [circuit.gates])

  const armedSymbol = armed ? GATE_DEFS[armed].symbol : ''

  return (
    <div className="circuit-scroll">
      <svg className="circuit" width={width} height={height} role="group" aria-label={`Quantum circuit editor, ${n} qubits, ${circuit.gates.length} gates`}>
        <rect width={width} height={height} fill="transparent" onClick={() => onSelect(null)} />
        {Array.from({ length: n }, (_, q) => (
          <g key={q}>
            <text className="wire__label" x={14} y={yOf(q) + 4}>q{q}</text>
            <text className="wire__ket" x={40} y={yOf(q) + 4}>|0⟩</text>
            <line className="wire" x1={LABEL_W - 4} x2={width - 8} y1={yOf(q)} y2={yOf(q)} />
          </g>
        ))}

        {Array.from({ length: cols }, (_, c) =>
          Array.from({ length: n }, (_, q) => {
            if (occupied.has(`${c}:${q}`)) return null
            const dim = picks.length > 0 && pickColumn !== c
            const cls = `cell ${armed ? 'cell--armed' : ''} ${dim ? 'cell--dim' : ''} ${picks.length > 0 && pickColumn === c ? 'cell--target' : ''}`
            const interactive = armed
              ? { role: 'button', tabIndex: 0, 'aria-label': `Place ${GATE_DEFS[armed].name} at qubit ${q}, column ${c + 1}` }
              : { 'aria-hidden': true as const }
            return (
              <g key={`${c}-${q}`} className={cls} {...interactive}
                onClick={() => onCell(q, c)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCell(q, c) } }}>
                <rect className="cell__hit" x={LABEL_W + c * CELL_W + 4} y={PAD_Y + q * ROW_H + 4} width={CELL_W - 8} height={ROW_H - 8} rx={12} />
                {armed && <text className="cell__ghost" x={xOf(c)} y={yOf(q) + 5} textAnchor="middle">{armedSymbol}</text>}
              </g>
            )
          }),
        )}

        {pickColumn !== null && picks.map((q) => (
          <circle key={q} className="pick" cx={xOf(pickColumn)} cy={yOf(q)} r={9} />
        ))}

        {circuit.gates.map((g) => (
          <GateGlyph key={g.id} gate={g} selected={g.id === selectedId} flagged={flaggedIds.has(g.id)} onSelect={onSelect} />
        ))}
      </svg>
    </div>
  )
}
