import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Award } from 'lucide-react'
import { getProgress } from '@/api/progress'
import { buttonClass } from '@/components/ui/Button'
import { Card, PageHeader, Skeleton } from '@/components/ui/Primitives'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { formatDate } from '@/lib/format'

export default function Achievements() {
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['progress'], queryFn: getProgress })
  return (
    <div className="stack stack--lg">
      <PageHeader title="Achievements" subtitle="Milestones you’ve earned." />
      {isLoading && <div className="grid grid--3">{[0, 1, 2].map((i) => <Skeleton key={i} height={110} radius={18} />)}</div>}
      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}
      {data && data.achievements.length === 0 && (
        <EmptyState icon={<Award size={22} />} title="No achievements yet" description="Complete your first challenge to earn one."
          action={<Link to="/challenges" className={buttonClass('primary')}>See challenges</Link>} />
      )}
      <div className="grid grid--3">
        {data?.achievements.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="achievement"><Award size={22} aria-hidden /><h3>{a.name}</h3>{a.description && <p className="muted">{a.description}</p>}<p className="muted caption">Earned {formatDate(a.unlockedAt)}</p></Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
