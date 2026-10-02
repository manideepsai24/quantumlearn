import { useId } from 'react'
import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'

export function Tabs<T extends string>({ value, tabs, onChange, label }: {
  value: T
  tabs: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  const id = useId()
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button key={t.value} type="button" role="tab" id={`${id}-${t.value}`} aria-selected={value === t.value}
          className={`tabs__tab ${value === t.value ? 'is-active' : ''}`} onClick={() => onChange(t.value)}>
          {t.label}
          {value === t.value && <motion.span layoutId={`${id}-underline`} className="tabs__underline" transition={spring} />}
        </button>
      ))}
    </div>
  )
}

