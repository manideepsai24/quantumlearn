import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FilePlus2, Minus, Play, Plus, Redo2, Save, Sparkles, Trash2, Undo2 } from 'lucide-react'
import { createCircuit, getCircuit, updateCircuit } from '@/api/circuits'
import { errorMessage } from '@/api/client'
import { runSimulation } from '@/api/simulations'
import { CircuitEditor } from '@/components/quantum/CircuitEditor'
import { GateInspector } from '@/components/quantum/GateInspector'
import { GatePalette } from '@/components/quantum/GatePalette'
import { ResultsPanel } from '@/components/quantum/ResultsPanel'
import { RunningState, SimulationError } from '@/components/quantum/SimulationStates'
import { Button } from '@/components/ui/Button'
import { ChallengePanel } from '@/components/learning/ChallengePanel'
import { ConfirmModal, Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Primitives'
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/States'
import { formatTime } from '@/lib/format'
import { LIMITS } from '@/quantum/circuitTypes'
import { gatesTouchingQubit, pendingHint, toBackendCircuit } from '@/quantum/circuitUtils'
import type { QuantumCircuit } from '@/quantum/circuitTypes'
import { validateCircuit } from '@/quantum/circuitValidation'
import { useLab } from '@/store/lab'
import { toast } from '@/store/toast'
import { useTutor } from '@/store/tutor'
import type { TutorMode } from '@/types'

interface SaveForm {
  name: string
  description: string
  tags: string
}

export default function QuantumLab() {
  const { id } = useParams<{ id: string }>()
  const [search, setSearch] = useSearchParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const circuit = useLab((s) => s.circuit)
  const savedId = useLab((s) => s.savedId)
  const savedAt = useLab((s) => s.savedAt)
  const dirty = useLab((s) => s.dirty)
  const meta = useLab((s) => s.meta)
  const armed = useLab((s) => s.armed)
  const picks = useLab((s) => s.picks)
  const pickColumn = useLab((s) => s.pickColumn)
  const selectedId = useLab((s) => s.selectedId)
  const lastRun = useLab((s) => s.lastRun)
  const canUndo = useLab((s) => s.past.length > 0)
  const canRedo = useLab((s) => s.future.length > 0)

  const [saveOpen, setSaveOpen] = useState(false)
  const [form, setForm] = useState<SaveForm>({ name: '', description: '', tags: '' })
  const [shrinkOpen, setShrinkOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const challengeId = search.get('challenge')
  const autoRan = useRef(false)
  const snapshot = useRef(circuit)
  const editorRef = useRef<HTMLDivElement>(null)

  /* ---------- load an existing circuit ---------- */
  const loaded = useQuery({ queryKey: ['circuit', id], queryFn: () => getCircuit(id as string), enabled: Boolean(id) })
  useEffect(() => {
    const rec = loaded.data
    if (rec && useLab.getState().savedId !== rec.id) {
      useLab.getState().loadRecord(rec)
      if (rec.skippedGates > 0) toast.info(`${rec.skippedGates} gate(s) with unsupported types were not loaded.`)
    }
  }, [loaded.data])

  /* ---------- validation (local, fast) ---------- */
  const issues = useMemo(() => validateCircuit(circuit, { allowEmpty: true }), [circuit])
  const flaggedIds = useMemo(() => new Set(issues.flatMap((i) => (i.gateId ? [i.gateId] : []))), [issues])
  const backendCircuit = useMemo(() => toBackendCircuit(circuit), [circuit])
  const stale = lastRun ? lastRun.signature !== JSON.stringify(backendCircuit) : false

  /* ---------- simulation ---------- */
  const sim = useMutation({
    mutationFn: (c: QuantumCircuit) => runSimulation(c),
    onSuccess: (result, c) => useLab.getState().setLastRun({ result, circuit: c, signature: JSON.stringify(c) }),
  })
  const { mutate: runMutate, reset: resetSim } = sim

  const onRun = useCallback(() => {
    const state = useLab.getState()
    const found = validateCircuit(state.circuit)
    if (found.length > 0) {
      toast.error(found[0].message)
      const gid = found.find((i) => i.gateId)?.gateId
      if (gid) state.select(gid)
      return
    }
    runMutate(toBackendCircuit(state.circuit))
  }, [runMutate])

  useEffect(() => {
    if (search.get('run') === '1' && loaded.data && !autoRan.current && useLab.getState().savedId === loaded.data.id) {
      autoRan.current = true
      setSearch((p) => { p.delete('run'); return p }, { replace: true })
      onRun()
    }
  }, [search, loaded.data, onRun, setSearch])

  /* ---------- saving ---------- */
  const save = useMutation({
    mutationFn: (m: { name: string; description: string; tags: string[] }) => {
      const state = useLab.getState()
      snapshot.current = state.circuit
      const payload = toBackendCircuit({ ...state.circuit, name: m.name })
      const metaOnly = { description: m.description, tags: m.tags }
      return state.savedId ? updateCircuit(state.savedId, payload, metaOnly) : createCircuit(payload, metaOnly)
    },
    onSuccess: (rec) => {
      useLab.getState().markSaved(rec.id, rec.name, { description: rec.description, tags: rec.tags }, snapshot.current)
      toast.success('Circuit saved')
      setSaveOpen(false)
      void qc.invalidateQueries({ queryKey: ['circuits'] })
      void qc.invalidateQueries({ queryKey: ['circuit', rec.id] })
      if (!id) navigate(`/circuits/${rec.id}`, { replace: true })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const onSave = useCallback(() => {
    const state = useLab.getState()
    if (state.savedId) {
      save.mutate({ name: state.circuit.name, description: state.meta.description, tags: state.meta.tags })
    } else {
      setForm({ name: state.circuit.name, description: state.meta.description, tags: state.meta.tags.join(', ') })
      setSaveOpen(true)
    }
  }, [save])

  /* ---------- keyboard shortcuts ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const typing = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)
      const mod = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()
      const s = useLab.getState()
      if (mod && key === 's') { e.preventDefault(); onSave(); return }
      if (mod && e.key === 'Enter') { e.preventDefault(); onRun(); return }
      if (typing) return
      if (mod && key === 'z') { e.preventDefault(); if (e.shiftKey) s.redo(); else s.undo(); return }
      if (mod && key === 'y') { e.preventDefault(); s.redo(); return }
      if (mod && key === 'd') { e.preventDefault(); const m = s.duplicateSelected(); if (m) toast.error(m); return }
      if ((e.key === 'Delete' || e.key === 'Backspace') && s.selectedId) { e.preventDefault(); s.removeSelected(); return }
      if (e.key === 'Escape') { s.arm(null); s.select(null); return }
      const arrows: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
      const move = arrows[e.key]
      if (move && s.selectedId) { e.preventDefault(); const m = s.moveSelected(move[0], move[1]); if (m) toast.error(m) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onSave, onRun])

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  /* ---------- helpers ---------- */
  const askAI = (prompt: string, mode: TutorMode) => {
    const state = useLab.getState()
    const run = state.lastRun
    const current = toBackendCircuit(state.circuit)
    const fresh = run && run.signature === JSON.stringify(current)
    useTutor.getState().openWith({ label: state.circuit.name, circuit: current, challengeId: challengeId ?? undefined, simulation: fresh ? run.result : undefined }, prompt, mode)
  }

  const changeQubits = (delta: number) => {
    const n = circuit.numQubits + delta
    if (n < LIMITS.minQubits || n > LIMITS.maxQubits) return
    if (delta < 0 && gatesTouchingQubit(circuit, n).length > 0) setShrinkOpen(true)
    else useLab.getState().setNumQubits(n)
  }

  const onCell = (q: number, c: number) => {
    const msg = useLab.getState().clickCell(q, c)
    if (msg) toast.error(msg)
  }

  const savedLabel = save.isPending ? 'Saving…' : dirty ? 'Unsaved changes' : savedAt ? `Saved ${formatTime(savedAt)}` : savedId ? 'Saved' : 'Not saved yet'

  if (id && loaded.isLoading) return <PageSkeleton />
  if (id && loaded.isError) return <ErrorState error={loaded.error} title="Couldn’t open this circuit" onRetry={() => void loaded.refetch()} />

  const hint = armed ? pendingHint(armed, picks) : 'Pick a gate from the palette, then click a spot on a wire.'

  return (
    <div className="lab">
      <div className="lab__bar glass">
        <input className="lab__name" value={circuit.name} aria-label="Circuit name" maxLength={80}
          onChange={(e) => useLab.getState().setName(e.target.value)} />
        <Badge tone={dirty ? 'warning' : 'neutral'}>{savedLabel}</Badge>
        <div className="lab__spacer" />
        <div className="row" role="group" aria-label="Qubits">
          <Button size="sm" iconOnly aria-label="Remove qubit" disabled={circuit.numQubits <= LIMITS.minQubits} onClick={() => changeQubits(-1)} icon={<Minus size={14} />} />
          <span className="lab__qubits">{circuit.numQubits} qubits</span>
          <Button size="sm" iconOnly aria-label="Add qubit" disabled={circuit.numQubits >= LIMITS.maxQubits} onClick={() => changeQubits(1)} icon={<Plus size={14} />} />
        </div>
        <label className="lab__shots">Shots
          <input className="input input--sm" type="number" min={1} max={LIMITS.maxShots} value={circuit.shots}
            onChange={(e) => useLab.getState().setShots(Math.floor(Number(e.target.value)))} />
        </label>
        <Button size="sm" iconOnly aria-label="Undo" disabled={!canUndo} onClick={() => useLab.getState().undo()} icon={<Undo2 size={15} />} />
        <Button size="sm" iconOnly aria-label="Redo" disabled={!canRedo} onClick={() => useLab.getState().redo()} icon={<Redo2 size={15} />} />
        <Button size="sm" iconOnly aria-label="Clear circuit" disabled={circuit.gates.length === 0} onClick={() => useLab.getState().clear()} icon={<Trash2 size={15} />} />
        <Button size="sm" icon={<FilePlus2 size={15} />} onClick={() => (dirty && circuit.gates.length ? setNewOpen(true) : (useLab.getState().reset(), resetSim(), id && navigate('/quantum-lab')))}>New</Button>
        <Button size="sm" icon={<Sparkles size={15} />} disabled={circuit.gates.length === 0} onClick={() => askAI('Explain what this circuit does, step by step.', 'explain')}>Explain</Button>
        <Button size="sm" icon={<Save size={15} />} loading={save.isPending} onClick={onSave}>Save</Button>
        <Button variant="primary" size="sm" icon={<Play size={15} />} loading={sim.isPending} onClick={onRun}>Run simulation</Button>
      </div>

      {challengeId && <ChallengePanel challengeId={challengeId} />}

      <div className="lab__main">
        <aside className="lab__palette card"><GatePalette armed={armed} onArm={(t) => useLab.getState().arm(t)} /></aside>
        <section className="lab__canvas card" ref={editorRef}>
          <CircuitEditor circuit={circuit} selectedId={selectedId} armed={armed} picks={picks} pickColumn={pickColumn}
            flaggedIds={flaggedIds} onCell={onCell} onSelect={(gid) => useLab.getState().select(gid)} />
          <p className="lab__hint muted" aria-live="polite">{hint}</p>
        </section>
        <aside className="lab__inspector card">
          <GateInspector circuit={circuit} selectedId={selectedId} issues={issues} onSelect={(gid) => useLab.getState().select(gid)} />
        </aside>
      </div>

      <section aria-label="Simulation results" className="lab__results">
        {sim.isPending && <RunningState />}
        {!sim.isPending && sim.isError && <SimulationError error={sim.error} onBack={() => { resetSim(); editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }} />}
        {!sim.isPending && !sim.isError && lastRun && (
          <ResultsPanel result={lastRun.result} submitted={lastRun.circuit} stale={stale} onAsk={askAI} />
        )}
        {!sim.isPending && !sim.isError && !lastRun && (
          <EmptyState icon={<Play size={22} />} title="No simulation yet" description="Build a circuit, then run it to see real measurement results from the simulator."
            action={<Button variant="primary" icon={<Play size={15} />} onClick={onRun}>Run simulation</Button>} />
        )}
      </section>

      <Modal open={saveOpen} onClose={() => setSaveOpen(false)} title="Save circuit"
        footer={<><Button variant="ghost" onClick={() => setSaveOpen(false)}>Cancel</Button>
          <Button variant="primary" loading={save.isPending} disabled={!form.name.trim()}
            onClick={() => save.mutate({ name: form.name.trim(), description: form.description.trim(), tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) })}>Save</Button></>}>
        <div className="stack">
          <div className="field"><label htmlFor="sv-name">Name</label>
            <input id="sv-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field"><label htmlFor="sv-desc">Description</label>
            <textarea id="sv-desc" className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="field"><label htmlFor="sv-tags">Tags (comma separated)</label>
            <input id="sv-tags" className="input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
          <p className="muted">Meta: {meta.tags.length ? meta.tags.join(', ') : 'no tags yet'}</p>
        </div>
      </Modal>

      <ConfirmModal open={shrinkOpen} title="Remove the last qubit?" danger confirmLabel="Remove qubit"
        message={`q${circuit.numQubits - 1} has gates on it. Removing the qubit also removes those gates. You can undo this.`}
        onClose={() => setShrinkOpen(false)} onConfirm={() => { useLab.getState().setNumQubits(circuit.numQubits - 1); setShrinkOpen(false) }} />

      <ConfirmModal open={newOpen} title="Start a new circuit?" danger confirmLabel="Discard changes"
        message="You have unsaved changes. Starting a new circuit discards them."
        onClose={() => setNewOpen(false)} onConfirm={() => { useLab.getState().reset(); resetSim(); setNewOpen(false); if (id) navigate('/quantum-lab') }} />
    </div>
  )
}
