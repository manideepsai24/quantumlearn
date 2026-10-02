import { AITutorPanel } from '@/components/ai/AITutorPanel'
import { PageHeader } from '@/components/ui/Primitives'

export default function AITutor() {
  return (
    <div className="stack stack--lg tutor-page">
      <PageHeader title="Quantum Tutor" subtitle="Ask questions, get hints, and understand your own circuits and results." />
      <div className="card tutor-page__card"><AITutorPanel variant="page" /></div>
    </div>
  )
}
