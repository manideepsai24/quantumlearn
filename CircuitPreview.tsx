import { useMemo } from 'react'
import { CircuitEditor } from '@/components/quantum/CircuitEditor'
import type { QuantumCircuit } from '@/quantum/circuitTypes'
import { layoutGates } from '@/quantum/circuitUtils'

const noop = () => undefined
const none = new Set<string>()

/** Read-only circuit diagram. */
export function CircuitPreview({ circuit }: { circuit: QuantumCircuit }) {
  const editor = useMemo(
    () => ({ name: circuit.name, numQubits: circuit.num_qubits, shots: circuit.shots ?? 1024, gates: layoutGates(circuit.gates) }),
    [circuit],
  )
  return (
    <div className="circuit-preview">
      <CircuitEditor circuit={editor} selectedId={null} armed={null} picks={[]} pickColumn={null} flaggedIds={none} onCell={noop} onSelect={noop} />
    </div>
  )
}
