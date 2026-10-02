import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { getAlgorithms } from '@/api/algorithms'
import { listCircuits } from '@/api/circuits'
import { getCourses } from '@/api/learning'
import { NAV_ITEMS, SETTINGS_ITEM } from '@/constants/navigation'
import { useUi } from '@/store/ui'

interface Item {
  id: string
  group: string
  label: string
  hint?: string
  to: string
}

export function CommandPalette() {
  const open = useUi((s) => s.paletteOpen)
  const setOpen = useUi((s) => s.setPalette)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const circuits = useQuery({ queryKey: ['circuits'], queryFn: listCircuits, enabled: open })
  const algorithms = useQuery({ queryKey: ['algorithms'], queryFn: getAlgorithms, enabled: open })
  const courses = useQuery({ queryKey: ['courses'], queryFn: getCourses, enabled: open })

  const items = useMemo<Item[]>(() => {
    const all: Item[] = [
      ...[...NAV_ITEMS, SETTINGS_ITEM].map((n) => ({ id: `page:${n.to}`, group: 'Pages', label: n.label, to: n.to })),
      ...(courses.data ?? []).map((c) => ({ id: `course:${c.id}`, group: 'Courses', label: c.title, to: `/learn/courses/${c.id}` })),
      ...(algorithms.data ?? []).map((a) => ({ id: `alg:${a.slug}`, group: 'Algorithms', label: a.name, hint: a.difficulty, to: `/algorithms/${a.slug}` })),
      ...(circuits.data ?? []).map((c) => ({ id: `circuit:${c.id}`, group: 'Circuits', label: c.name, hint: `${c.numQubits} qubits`, to: `/circuits/${c.id}` })),
    ]
    const q = query.trim().toLowerCase()
    return q ? all.filter((i) => i.label.toLowerCase().includes(q)) : all.slice(0, 12)
  }, [query, courses.data, algorithms.data, circuits.data])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      window.setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const go = (item: Item | undefined) => {
    if (!item) return
    setOpen(false)
    navigate(item.to)
  }

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false)
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      go(items[active])
    }
  }

  let lastGroup = ''
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="modal-backdrop modal-backdrop--top" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
          <motion.div className="palette glass" role="dialog" aria-modal="true" aria-label="Search QuantumLearn"
            initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 460, damping: 34 }} onKeyDown={onKeyDown}>
            <div className="palette__input">
              <Search size={18} aria-hidden />
              <input ref={inputRef} value={query} onChange={(e) => { setQuery(e.target.value); setActive(0) }}
                placeholder="Search lessons, algorithms, circuits…" aria-label="Search" role="combobox"
                aria-expanded="true" aria-controls="palette-list" />
              <kbd>Esc</kbd>
            </div>
            <ul className="palette__list" id="palette-list" role="listbox">
              {items.length === 0 && <li className="palette__empty muted">No results for “{query}”.</li>}
              {items.map((item, i) => {
                const header = item.group !== lastGroup ? item.group : null
                lastGroup = item.group
                return (
                  <li key={item.id} role="presentation">
                    {header && <div className="palette__group">{header}</div>}
                    <button role="option" aria-selected={i === active} className={`palette__item ${i === active ? 'is-active' : ''}`}
                      onMouseEnter={() => setActive(i)} onClick={() => go(item)}>
                      <span>{item.label}</span>
                      {item.hint && <span className="muted">{item.hint}</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
