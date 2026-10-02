import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CircuitBoard, Copy, Pencil, Play, Plus, Trash2 } from 'lucide-react'
import { createCircuit, deleteCircuit, listCircuits } from '@/api/circuits'
import type { CircuitRecord } from '@/api/circuits'
import { errorMessage } from '@/api/client'
import { Button, buttonClass } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/Modal'
import { Badge, Card, PageHeader, Skeleton } from '@/components/ui/Primitives'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { formatDate } from '@/lib/format'
import { toBackendCircuit, layoutGates } from '@/quantum/circuitUtils'
import { useLab } from '@/store/lab'
import { toast } from '@/store/toast'

export default function Circuits() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [query, setQuery] = useState('')
  const [toDelete, setToDelete] = useState<CircuitRecord | null>(null)
  const [pendingOpen, setPendingOpen] = useState<string | null>(null)
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['circuits'], queryFn: listCircuits })

  const del = useMutation({
    mutationFn: (id: string) => deleteCircuit(id),
    onSuccess: (_d, id) => {
      toast.success('Circuit deleted')
      setToDelete(null)
      if (useLab.getState().savedId === id) useLab.getState().reset()
      void qc.invalidateQueries({ queryKey: ['circuits'] })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const dup = useMutation({
    mutationFn: (c: CircuitRecord) =>
      createCircuit(
        toBackendCircuit({ name: `${c.name} copy`, numQubits: c.numQubits, shots: c.shots, gates: layoutGates(c.gates) }),
        { description: c.description, tags: c.tags },
      ),
    onSuccess: () => { toast.success('Circuit duplicated'); void qc.invalidateQueries({ queryKey: ['circuits'] }) },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (data ?? []).filter((c) => !q || c.name.toLowerCase().includes(q) || c.tags.some((t) => t.toLowerCase().includes(q)))
  }, [data, query])

  const open = (path: string, id: string) => {
    const s = useLab.getState()
    if (s.dirty && s.savedId !== id && s.circuit.gates.length > 0) setPendingOpen(path)
    else navigate(path)
  }

  return (
    <div className="stack stack--lg">
      <PageHeader title="My circuits" subtitle="Saved circuits you can reopen, duplicate, or run again."
        actions={<Link to="/quantum-lab" className={buttonClass('primary')} onClick={() => useLab.getState().reset()}><Plus size={16} /> New circuit</Link>} />
      <input className="input" placeholder="Search by name or tag" aria-label="Search circuits" value={query} onChange={(e) => setQuery(e.target.value)} />

      {isLoading && <div className="grid grid--3">{[0, 1, 2].map((i) => <Skeleton key={i} height={170} radius={18} />)}</div>}
      {isError && <ErrorState error={error} title="Couldn’t load your circuits" onRetry={() => void refetch()} />}
      {data && data.length === 0 && (
        <EmptyState icon={<CircuitBoard size={22} />} title="No saved circuits yet" description="Build your first quantum circuit in Quantum Lab."
          action={<Link to="/quantum-lab" className={buttonClass('primary')}>Open Quantum Lab</Link>} />
      )}
      {data && data.length > 0 && filtered.length === 0 && <p className="muted">No circuits match “{query}”.</p>}

      <div className="grid grid--3">
        {filtered.map((c) => (
          <Card key={c.id} interactive className="circuit-card">
            <h3>{c.name}</h3>
            <p className="muted">{c.numQubits} qubits · {c.gates.length} gates</p>
            <div className="row row--wrap">{c.tags.map((t) => <Badge key={t} tone="accent">{t}</Badge>)}</div>
            <dl className="kv kv--tight">
              <dt>Created</dt><dd>{formatDate(c.createdAt)}</dd>
              <dt>Updated</dt><dd>{formatDate(c.updatedAt)}</dd>
              <dt>Last simulation</dt><dd>{formatDate(c.lastSimulationAt)}</dd>
            </dl>
            <div className="row row--wrap">
              <Button size="sm" variant="primary" onClick={() => open(`/circuits/${c.id}`, c.id)}>Open</Button>
              <Button size="sm" iconOnly aria-label={`Edit ${c.name}`} icon={<Pencil size={14} />} onClick={() => open(`/circuits/${c.id}`, c.id)} />
              <Button size="sm" iconOnly aria-label={`Run ${c.name}`} icon={<Play size={14} />} onClick={() => open(`/circuits/${c.id}?run=1`, c.id)} />
              <Button size="sm" iconOnly aria-label={`Duplicate ${c.name}`} icon={<Copy size={14} />} loading={dup.isPending && dup.variables?.id === c.id} onClick={() => dup.mutate(c)} />
              <Button size="sm" variant="danger" iconOnly aria-label={`Delete ${c.name}`} icon={<Trash2 size={14} />} onClick={() => setToDelete(c)} />
            </div>
          </Card>
        ))}
      </div>

      <ConfirmModal open={toDelete !== null} danger title="Delete this circuit?" confirmLabel="Delete" loading={del.isPending}
        message={`“${toDelete?.name ?? ''}” will be permanently deleted. This can’t be undone.`}
        onClose={() => setToDelete(null)} onConfirm={() => toDelete && del.mutate(toDelete.id)} />
      <ConfirmModal open={pendingOpen !== null} danger title="Discard unsaved changes?" confirmLabel="Discard and open"
        message="The circuit in Quantum Lab has unsaved changes. Opening another circuit replaces it."
        onClose={() => setPendingOpen(null)} onConfirm={() => { const p = pendingOpen; setPendingOpen(null); if (p) navigate(p) }} />
    </div>
  )
}
