import { useMemo } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatPercent, ket } from '@/lib/format'
import { buildProbabilityRows } from '@/quantum/visualization'

interface Row {
  label: string
  state: string
  probability: number
}

interface TipProps {
  active?: boolean
  payload?: { payload: Row }[]
}

function Tip({ active, payload }: TipProps) {
  const row = active ? payload?.[0]?.payload : undefined
  if (!row) return null
  return (
    <div className="chart-tip">
      <strong className="mono">{row.label}</strong>
      <div>{formatPercent(row.probability, 4)}</div>
      <div className="muted mono">p = {row.probability}</div>
    </div>
  )
}

export function ProbabilityChart({ probabilities, numQubits }: { probabilities: Record<string, number>; numQubits?: number }) {
  const reduced = useReducedMotion()
  const { rows, hidden, total } = useMemo(() => buildProbabilityRows(probabilities, numQubits), [probabilities, numQubits])
  const data: Row[] = rows.map((r) => ({ ...r, label: ket(r.state) }))
  const top = [...rows].sort((a, b) => b.probability - a.probability).slice(0, 4).filter((r) => r.probability > 0)
  const summary = top.map((r) => `${ket(r.state)} ${formatPercent(r.probability)}`).join(', ')

  return (
    <figure className="chart">
      <p className="sr-only">Measurement probabilities. Most likely outcomes: {summary || 'none'}.</p>
      <div className="chart__area" aria-hidden="true">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} interval={data.length > 12 ? 'preserveStartEnd' : 0}
              tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-mono)' }} />
            <YAxis tickLine={false} axisLine={false} width={44} domain={[0, (max: number) => Math.min(1, Math.max(0.1, Math.ceil(max * 10) / 10))]}
              tickFormatter={(v: number) => `${Math.round(v * 100)}%`} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
            <Tooltip content={<Tip />} cursor={{ fill: 'var(--accent-soft)' }} />
            <Bar dataKey="probability" fill="var(--accent)" radius={[6, 6, 0, 0]} isAnimationActive={!reduced} animationDuration={450} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {hidden > 0 && <figcaption className="muted">Showing the {rows.length} most likely of {total} outcomes ({hidden} more not shown).</figcaption>}
    </figure>
  )
}
