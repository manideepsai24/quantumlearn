import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'
import { AITutorPanel } from '@/components/ai/AITutorPanel'
import { Button } from '@/components/ui/Button'
import { useTutor } from '@/store/tutor'

export function TutorDrawer() {
  const open = useTutor((s) => s.open)
  const setOpen = useTutor((s) => s.setOpen)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  return (
    <AnimatePresence>
      {open && (
        <motion.aside className="drawer glass" aria-label="AI Tutor"
          initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 360, damping: 36 }}>
          <div className="drawer__head">
            <span className="drawer__title"><Sparkles size={16} aria-hidden /> Quantum Tutor</span>
            <Button variant="ghost" size="sm" iconOnly aria-label="Close tutor" onClick={() => setOpen(false)} icon={<X size={16} />} />
          </div>
          <AITutorPanel variant="drawer" />
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
