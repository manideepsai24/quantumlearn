import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, PageHeader, Segmented } from '@/components/ui/Primitives'
import { useAuth } from '@/store/auth'
import { toast } from '@/store/toast'
import { useUi } from '@/store/ui'
import type { ThemePref } from '@/store/ui'
import type { LearningLevel } from '@/types'

export default function Settings() {
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const theme = useUi((s) => s.theme)
  const level = useUi((s) => s.level)
  const setTheme = useUi((s) => s.setTheme)
  const setLevel = useUi((s) => s.setLevel)

  return (
    <div className="stack stack--lg narrow">
      <PageHeader title="Settings" />
      <Card className="stack">
        <h2>Appearance</h2>
        <Segmented<ThemePref> label="Theme" value={theme} onChange={(v) => { setTheme(v); toast.success('Settings updated') }}
          options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
      </Card>
      <Card className="stack">
        <h2>Learning</h2>
        <p className="muted">The tutor adapts its explanations to this level.</p>
        <Segmented<LearningLevel> label="Learning level" value={level} onChange={(v) => { setLevel(v); toast.success('Settings updated') }}
          options={[{ value: 'beginner', label: 'Beginner' }, { value: 'intermediate', label: 'Intermediate' }, { value: 'advanced', label: 'Advanced' }]} />
      </Card>
      <Card className="stack">
        <h2>Account</h2>
        <dl className="kv"><dt>Name</dt><dd>{user?.name}</dd><dt>Email</dt><dd>{user?.email}</dd><dt>Role</dt><dd>{user?.role}</dd></dl>
        <div><Button icon={<LogOut size={15} />} onClick={() => void logout().then(() => navigate('/login'))}>Log out</Button></div>
      </Card>
    </div>
  )
}
