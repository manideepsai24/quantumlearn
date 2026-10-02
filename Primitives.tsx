import { Link } from 'react-router-dom'
import type { HTMLAttributes, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { spring } from '@/lib/motion'

export function Card({ className = '', interactive = false, ...rest }: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return <div className={`card ${interactive ? 'card--interactive' : ''} ${className}`} {...rest} />
}

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'error'; children: ReactNode }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v)} aria-label={label ?? 'Progress'}>
      <motion.div className="progress__fill" initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={spring} />
    </div>
  )
}

export function Skeleton({ height = 16, width = '100%', radius = 8 }: { height?: number; width?: number | string; radius?: number }) {
  return <div className="skeleton" style={{ height, width, borderRadius: radius }} aria-hidden="true" />
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <span className="spinner" role="status">
      <Loader2 className="spin" size={18} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="muted page-header__sub">{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  )
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {action}
    </div>
  )
}

export function Segmented<T extends string>({ value, options, onChange, label }: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value}
          className={`segmented__item ${value === o.value ? 'is-active' : ''}`} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function PageHeaderBack({ to, label }: { to: string; label: string }) {
  return <Link to={to} className="back-link">← {label}</Link>
}
