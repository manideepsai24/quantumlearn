import { useRef, useState } from 'react'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatNumber } from '@/lib/format'
import type { BlochVector } from '@/types'

const R = 100
const C = 130
const DEFAULT_VIEW = { yaw: -0.6, pitch: 0.35 }

function project(x: number, y: number, z: number, yaw: number, pitch: number) {
  const xr = x * Math.cos(yaw) - y * Math.sin(yaw)
  const yr = x * Math.sin(yaw) + y * Math.cos(yaw)
  return { sx: xr, sy: -(z * Math.cos(pitch) + yr * Math.sin(pitch)) }
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

export function BlochSphere({ vectors }: { vectors?: BlochVector[] }) {
  const [index, setIndex] = useState(0)
  const [view, setView] = useState(DEFAULT_VIEW)
  const [zoom, setZoom] = useState(1)
  const drag = useRef<{ x: number; y: number } | null>(null)

  if (!vectors || vectors.length === 0) {
    return (
      <div className="empty">
        <h3>Bloch-sphere visualization is not available</h3>
        <p className="muted">The simulator did not return Bloch-sphere data for this circuit/result, so nothing is drawn.</p>
      </div>
    )
  }

  const v = vectors[Math.min(index, vectors.length - 1)]
  const len = Math.hypot(v.x, v.y, v.z)
  const s = R * zoom
  const p = (x: number, y: number, z: number) => {
    const { sx, sy } = project(x, y, z, view.yaw, view.pitch)
    return { x: C + sx * s, y: C + sy * s }
  }
  const axis = (x: number, y: number, z: number) => ({ a: p(-x, -y, -z), b: p(x, y, z) })
  const ax = axis(1, 0, 0)
  const ay = axis(0, 1, 0)
  const az = axis(0, 0, 1)
  const tip = p(v.x, v.y, v.z)
  const origin = p(0, 0, 0)
  const lab = (x: number, y: number, z: number) => p(x * 1.18, y * 1.18, z * 1.18)

  const rotate = (dyaw: number, dpitch: number) =>
    setView((w) => ({ yaw: w.yaw + dyaw, pitch: clamp(w.pitch + dpitch, -1.3, 1.3) }))

  const description = `Bloch vector for qubit ${v.qubit}: x ${formatNumber(v.x)}, y ${formatNumber(v.y)}, z ${formatNumber(v.z)}.`

  return (
    <div className="bloch">
      <div className="bloch__stage">
        <svg viewBox="0 0 260 260" role="img" aria-label={description} tabIndex={0} className="bloch__svg"
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY } }}
          onPointerMove={(e) => {
            if (!drag.current) return
            rotate((e.clientX - drag.current.x) * 0.01, (e.clientY - drag.current.y) * 0.01)
            drag.current = { x: e.clientX, y: e.clientY }
          }}
          onPointerUp={() => { drag.current = null }}
          onKeyDown={(e) => {
            const step = 0.1
            if (e.key === 'ArrowLeft') rotate(-step, 0)
            else if (e.key === 'ArrowRight') rotate(step, 0)
            else if (e.key === 'ArrowUp') rotate(0, -step)
            else if (e.key === 'ArrowDown') rotate(0, step)
            else return
            e.preventDefault()
          }}>
          <circle className="bloch__outline" cx={C} cy={C} r={s} />
          <ellipse className="bloch__ring" cx={C} cy={C} rx={s} ry={s * Math.abs(Math.sin(view.pitch))} />
          <ellipse className="bloch__ring bloch__ring--faint" cx={C} cy={C} rx={s} ry={s * Math.abs(Math.cos(view.pitch))} />
          {[ax, ay, az].map((l, i) => <line key={i} className="bloch__axis" x1={l.a.x} y1={l.a.y} x2={l.b.x} y2={l.b.y} />)}
          <text className="bloch__label" x={lab(1, 0, 0).x} y={lab(1, 0, 0).y}>x</text>
          <text className="bloch__label" x={lab(0, 1, 0).x} y={lab(0, 1, 0).y}>y</text>
          <text className="bloch__label" x={lab(0, 0, 1).x} y={lab(0, 0, 1).y}>|0⟩</text>
          <text className="bloch__label" x={lab(0, 0, -1).x} y={lab(0, 0, -1).y}>|1⟩</text>
          <line className="bloch__vector" x1={origin.x} y1={origin.y} x2={tip.x} y2={tip.y} />
          <circle className="bloch__tip" cx={tip.x} cy={tip.y} r={5} />
        </svg>
        <div className="row bloch__controls">
          <Button size="sm" iconOnly aria-label="Zoom out" onClick={() => setZoom((z) => clamp(z - 0.15, 0.7, 1.4))} icon={<Minus size={14} />} />
          <Button size="sm" iconOnly aria-label="Zoom in" onClick={() => setZoom((z) => clamp(z + 0.15, 0.7, 1.4))} icon={<Plus size={14} />} />
          <Button size="sm" icon={<RotateCcw size={14} />} onClick={() => { setView(DEFAULT_VIEW); setZoom(1) }}>Reset view</Button>
        </div>
        <p className="muted bloch__hint">Drag or use arrow keys to rotate.</p>
      </div>

      <div className="stack">
        {vectors.length > 1 && (
          <div className="field">
            <label htmlFor="bloch-qubit">Qubit</label>
            <select id="bloch-qubit" className="input" value={index} onChange={(e) => setIndex(Number(e.target.value))}>
              {vectors.map((b, i) => <option key={b.qubit} value={i}>q{b.qubit}</option>)}
            </select>
          </div>
        )}
        <dl className="kv">
          <dt>x</dt><dd className="mono">{formatNumber(v.x, 6)}</dd>
          <dt>y</dt><dd className="mono">{formatNumber(v.y, 6)}</dd>
          <dt>z</dt><dd className="mono">{formatNumber(v.z, 6)}</dd>
          <dt>Length |r|</dt><dd className="mono">{formatNumber(len, 6)}</dd>
          {len > 0.999 && (<><dt>θ</dt><dd className="mono">{formatNumber(Math.acos(clamp(v.z / len, -1, 1)) / Math.PI, 4)}π</dd>
            <dt>φ</dt><dd className="mono">{formatNumber(Math.atan2(v.y, v.x) / Math.PI, 4)}π</dd></>)}
        </dl>
        {len < 0.999 && (
          <p className="muted">A length below 1 means this qubit alone is in a mixed state. For a pure overall state, that happens when the qubit is entangled with others.</p>
        )}
      </div>
    </div>
  )
}
