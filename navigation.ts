import { BookOpen, CircuitBoard, FlaskConical, LayoutDashboard, Settings, Sparkles, Swords, TrendingUp, Workflow } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/learn', label: 'Learn', icon: BookOpen },
  { to: '/quantum-lab', label: 'Quantum Lab', icon: FlaskConical },
  { to: '/algorithms', label: 'Algorithms', icon: Workflow },
  { to: '/challenges', label: 'Challenges', icon: Swords },
  { to: '/circuits', label: 'Circuits', icon: CircuitBoard },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/ai-tutor', label: 'AI Tutor', icon: Sparkles },
]

export const SETTINGS_ITEM: NavItem = { to: '/settings', label: 'Settings', icon: Settings }

export const MOBILE_NAV: NavItem[] = [
  NAV_ITEMS[0], NAV_ITEMS[1], NAV_ITEMS[2], NAV_ITEMS[6], { to: '/profile', label: 'Profile', icon: Settings },
]

export const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: 'Ctrl/⌘ K', action: 'Open search' },
  { keys: 'Ctrl/⌘ S', action: 'Save circuit' },
  { keys: 'Ctrl/⌘ Enter', action: 'Run simulation' },
  { keys: 'Ctrl/⌘ Z', action: 'Undo' },
  { keys: 'Ctrl/⌘ Shift Z', action: 'Redo' },
  { keys: 'Ctrl/⌘ D', action: 'Duplicate selected gate' },
  { keys: 'Delete', action: 'Remove selected gate' },
  { keys: '← → ↑ ↓', action: 'Move selected gate' },
  { keys: 'Esc', action: 'Deselect / cancel placement' },
]
