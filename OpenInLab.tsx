import { useNavigate } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { QuantumCircuit } from '@/quantum/circuitTypes'
import { useLab } from '@/store/lab'

export function OpenInLab({ circuit, challengeId, label = 'Try it in Quantum Lab' }: { circuit?: QuantumCircuit; challengeId?: string; label?: string }) {
  const navigate = useNavigate()
  const go = () => {
    if (circuit) {
      useLab.getState().loadRecord({
        id: '', name: circuit.name, description: '', tags: [], numQubits: circuit.num_qubits, shots: circuit.shots ?? 1024,
        gates: circuit.gates, skippedGates: 0,
      })
    }
    navigate(challengeId ? `/quantum-lab?challenge=${encodeURIComponent(challengeId)}` : '/quantum-lab')
  }
  return <Button variant="primary" icon={<FlaskConical size={15} />} onClick={go}>{label}</Button>
}
