import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatComplex, formatNumber, formatPercent, ket } from '@/lib/format'
import { magnitude, phase } from '@/quantum/visualization'
import type { Amplitude } from '@/types'

const PAGE = 16
const EPS = 1e-12

export function StatevectorViewer({ amplitudes }: { amplitudes: Amplitude[] }) {
  const [hideZero, setHideZero] = useState(true)
  const [page, setPage] = useState(0)

  const rows = useMemo(
    () => amplitudes.filter((a) => !hideZero || a.re * a.re + a.im * a.im > EPS),
    [amplitudes, hideZero],
  )
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const current = Math.min(page, pages - 1)
  const visible = rows.slice(current * PAGE, current * PAGE + PAGE)

  const nonzero = amplitudes.filter((a) => a.re * a.re + a.im * a.im > EPS)
  const terms = nonzero.slice(0, 4).map((a) => `(${formatComplex(a.re, a.im, 3)})${ket(a.state)}`)
  const expr = terms.length ? `|ψ⟩ = ${terms.join(' + ')}${nonzero.length > 4 ? ` + … (${nonzero.length - 4} more)` : ''}` : '|ψ⟩ = 0'

  return (
    <div className="stack">
      <p className="mono statevector__expr">{expr}</p>
      <label className="check">
        <input type="checkbox" checked={hideZero} onChange={(e) => { setHideZero(e.target.checked); setPage(0) }} />
        Hide zero amplitudes
      </label>
      <div className="table-wrap">
        <table className="table">
          <caption className="sr-only">Statevector amplitudes</caption>
          <thead>
            <tr><th>Basis</th><th>Amplitude</th><th>Real</th><th>Imag</th><th>|α|</th><th>Phase</th><th>Probability</th></tr>
          </thead>
          <tbody>
            {visible.map((a) => {
              const mag = magnitude(a.re, a.im)
              return (
                <tr key={a.state}>
                  <td className="mono">{ket(a.state)}</td>
                  <td className="mono">{formatComplex(a.re, a.im)}</td>
                  <td className="mono">{formatNumber(a.re, 6)}</td>
                  <td className="mono">{formatNumber(a.im, 6)}</td>
                  <td className="mono">{formatNumber(mag, 6)}</td>
                  <td className="mono">{formatNumber(phase(a.re, a.im) / Math.PI, 4)}π</td>
                  <td className="mono">{formatPercent(mag * mag, 4)}</td>
                </tr>
              )
            })}
            {visible.length === 0 && <tr><td colSpan={7} className="muted">No amplitudes to show.</td></tr>}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="row">
          <Button size="sm" iconOnly aria-label="Previous page" disabled={current === 0} onClick={() => setPage(current - 1)} icon={<ChevronLeft size={15} />} />
          <span className="muted">Page {current + 1} of {pages} · {rows.length} amplitudes</span>
          <Button size="sm" iconOnly aria-label="Next page" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} icon={<ChevronRight size={15} />} />
        </div>
      )}
    </div>
  )
}
