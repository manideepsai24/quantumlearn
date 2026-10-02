import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUp, BookOpen, Bug, Feather, Lightbulb, MessageCircleQuestion, RotateCcw, Sparkles, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useTutor } from '@/store/tutor'
import type { TutorMode } from '@/types'

const QUICK: { mode: TutorMode; label: string; prompt: string; icon: LucideIcon }[] = [
  { mode: 'explain', label: 'Explain', prompt: 'Explain what is happening here.', icon: BookOpen },
  { mode: 'hint', label: 'Hint', prompt: 'Give me a hint, but not the full answer.', icon: Lightbulb },
  { mode: 'debug', label: 'Debug', prompt: 'Help me find what is wrong. Guide me with questions first.', icon: Bug },
  { mode: 'why', label: 'Why?', prompt: 'Why did this happen?', icon: MessageCircleQuestion },
  { mode: 'example', label: 'Example', prompt: 'Show me a small example.', icon: Sparkles },
  { mode: 'simplify', label: 'Simplify', prompt: 'Explain that more simply, using an analogy.', icon: Feather },
]

const STARTERS = [
  'What is superposition?',
  'How does a Bell state create entanglement?',
  'Why does measuring a qubit change it?',
]

export function AITutorPanel({ variant = 'page' }: { variant?: 'page' | 'drawer' }) {
  const messages = useTutor((s) => s.messages)
  const pending = useTutor((s) => s.pending)
  const error = useTutor((s) => s.error)
  const context = useTutor((s) => s.context)
  const send = useTutor((s) => s.send)
  const retry = useTutor((s) => s.retry)
  const setContext = useTutor((s) => s.setContext)
  const clearConversation = useTutor((s) => s.clearConversation)
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'end' })
  }, [messages.length, pending, reduced])

  const chips: string[] = []
  if (context.label) chips.push(context.label)
  if (context.circuit) chips.push(`${context.circuit.num_qubits} qubits · ${context.circuit.gates.length} gates`)
  if (context.simulation) chips.push('Simulation result')
  if (context.algorithm) chips.push(`Algorithm: ${context.algorithm}`)
  if (context.lessonId) chips.push('Lesson')
  if (context.challengeId) chips.push('Challenge')

  const submit = () => {
    if (!text.trim()) return
    void send(text, 'chat')
    setText('')
  }

  return (
    <div className={`tutor tutor--${variant}`}>
      {chips.length > 0 && (
        <div className="tutor__context" aria-label="Tutor context">
          <span className="muted">Context</span>
          {chips.map((c) => <span key={c} className="chip">{c}</span>)}
          <button className="chip chip--action" onClick={() => setContext({})} aria-label="Clear context"><X size={12} aria-hidden /></button>
        </div>
      )}

      <div className="tutor__messages" aria-live="polite">
        {messages.length === 0 && (
          <div className="tutor__empty">
            <Sparkles size={22} aria-hidden />
            <h3>Ask anything about quantum computing</h3>
            <p className="muted">I explain with your actual circuit and results when you share them. I’ll nudge you before handing over answers.</p>
            <div className="tutor__starters">
              {STARTERS.map((s) => <button key={s} className="chip chip--action" onClick={() => void send(s, 'chat')}>{s}</button>)}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <motion.div key={m.id} className={`bubble bubble--${m.role}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
            {m.content.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
          </motion.div>
        ))}
        {pending && (
          <div className="bubble bubble--assistant bubble--typing" role="status" aria-label="Tutor is thinking">
            <span className="dot" /><span className="dot" /><span className="dot" />
          </div>
        )}
        {error && (
          <div className="bubble bubble--error" role="alert">
            <p>{error}</p>
            <Button size="sm" icon={<RotateCcw size={14} />} onClick={() => void retry()}>Retry</Button>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="tutor__actions" role="toolbar" aria-label="Learning modes">
        {QUICK.map(({ mode, label, prompt, icon: Icon }) => (
          <button key={mode} className="chip chip--action" disabled={pending} onClick={() => void send(prompt, mode)}>
            <Icon size={13} aria-hidden /> {label}
          </button>
        ))}
        {messages.length > 0 && <button className="chip chip--action" onClick={clearConversation}>Clear chat</button>}
      </div>

      <form className="tutor__input" onSubmit={(e) => { e.preventDefault(); submit() }}>
        <textarea value={text} rows={2} placeholder="Ask about quantum computing…" aria-label="Message the tutor"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }} />
        <Button variant="primary" iconOnly aria-label="Send" type="submit" disabled={!text.trim() || pending} icon={<ArrowUp size={16} />} />
      </form>
    </div>
  )
}
