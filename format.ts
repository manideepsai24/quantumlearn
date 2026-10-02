export const ket = (label: string): string => `|${label}⟩`

export function formatNumber(n: number, digits = 4): string {
  if (Math.abs(n) < 5 * 10 ** -(digits + 1)) return '0'
  return String(Number(n.toFixed(digits)))
}

export function formatComplex(re: number, im: number, digits = 4): string {
  const r = formatNumber(re, digits)
  const i = formatNumber(Math.abs(im), digits)
  if (i === '0') return r
  if (r === '0') return `${im < 0 ? '−' : ''}${i}i`
  return `${r} ${im < 0 ? '−' : '+'} ${i}i`
}

export function formatPercent(p: number, digits = 2): string {
  return `${Number((p * 100).toFixed(digits))}%`
}

export function formatDuration(ms: number): string {
  if (ms < 1) return '<1 ms'
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

export function formatDate(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(d)
}

export function formatTime(ts: number): string {
  return new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(new Date(ts))
}

export function timeGreeting(date = new Date()): string {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
