import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { useToasts } from '@/store/toast'

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info }

export function Toaster() {
  const items = useToasts((s) => s.items)
  const dismiss = useToasts((s) => s.dismiss)
  return (
    <div className="toaster" role="status" aria-live="polite">
      <AnimatePresence>
        {items.map((t) => {
          const Icon = ICONS[t.kind]
          return (
            <motion.button
              key={t.id}
              layout
              className={`toast toast--${t.kind} glass`}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              onClick={() => dismiss(t.id)}
              aria-label={`${t.message}. Dismiss`}
            >
              <Icon size={16} aria-hidden />
              <span>{t.message}</span>
            </motion.button>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
