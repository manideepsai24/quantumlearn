import { useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, PanelLeftClose, PanelLeftOpen, Search, Sparkles } from 'lucide-react'
import { Brand } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Toaster } from '@/components/ui/Toast'
import { CommandPalette } from './CommandPalette'
import { TutorDrawer } from './TutorDrawer'
import { MOBILE_NAV, NAV_ITEMS, SETTINGS_ITEM } from '@/constants/navigation'
import type { NavItem } from '@/constants/navigation'
import { spring } from '@/lib/motion'
import { useAuth } from '@/store/auth'
import { useTutor } from '@/store/tutor'
import { useUi } from '@/store/ui'

function SideLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon
  return (
    <NavLink to={item.to} title={collapsed ? item.label : undefined}
      className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}>
      {({ isActive }) => (
        <>
          {isActive && <motion.span layoutId="nav-pill" className="nav-item__pill" transition={spring} />}
          <Icon size={18} aria-hidden className="nav-item__icon" />
          {!collapsed && <span className="nav-item__label">{item.label}</span>}
        </>
      )}
    </NavLink>
  )
}

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const collapsed = useUi((s) => s.sidebarCollapsed)
  const toggleSidebar = useUi((s) => s.toggleSidebar)
  const setPalette = useUi((s) => s.setPalette)
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const tutorOpen = useTutor((s) => s.open)
  const setTutorOpen = useTutor((s) => s.setOpen)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette(!useUi.getState().paletteOpen)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setPalette])

  const isLab = location.pathname.startsWith('/quantum-lab') || location.pathname.startsWith('/circuits/')
  const extra: NavItem[] = []
  if (user?.role === 'instructor' || user?.role === 'admin') extra.push({ ...NAV_ITEMS[0], to: '/instructor', label: 'Instructor' })
  if (user?.role === 'admin') extra.push({ ...NAV_ITEMS[0], to: '/admin', label: 'Admin' })

  return (
    <div className={`shell ${collapsed ? 'shell--collapsed' : ''}`}>
      <aside className="sidebar" aria-label="Primary">
        <div className="sidebar__top">
          <NavLink to="/dashboard" aria-label="QuantumLearn home"><Brand compact={collapsed} /></NavLink>
        </div>
        <nav className="sidebar__nav">
          {[...NAV_ITEMS, ...extra].map((item) => <SideLink key={item.to} item={item} collapsed={collapsed} />)}
        </nav>
        <div className="sidebar__bottom">
          <SideLink item={SETTINGS_ITEM} collapsed={collapsed} />
          <button className="nav-item" onClick={toggleSidebar} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <PanelLeftOpen size={18} aria-hidden /> : <PanelLeftClose size={18} aria-hidden />}
            {!collapsed && <span className="nav-item__label">Collapse</span>}
          </button>
        </div>
      </aside>

      <div className="shell__main">
        <header className="topbar glass">
          <div className="topbar__brand-mobile"><Brand compact /></div>
          <button className="search-trigger" onClick={() => setPalette(true)} aria-label="Search (Ctrl K)">
            <Search size={16} aria-hidden />
            <span>Search</span>
            <kbd>Ctrl K</kbd>
          </button>
          <div className="topbar__spacer" />
          <Button variant={tutorOpen ? 'primary' : 'secondary'} size="sm" icon={<Sparkles size={15} />} onClick={() => setTutorOpen(!tutorOpen)} aria-pressed={tutorOpen}>
            AI Tutor
          </Button>
          <button className="avatar" onClick={() => navigate('/profile')} aria-label="Profile">{(user?.name ?? '?').slice(0, 1).toUpperCase()}</button>
          <Button variant="ghost" size="sm" iconOnly aria-label="Log out" icon={<LogOut size={16} />}
            onClick={() => void logout().then(() => navigate('/login'))} />
        </header>

        <motion.main key={location.pathname} className={`page ${isLab ? 'page--wide' : ''}`}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}>
          <Outlet />
        </motion.main>
      </div>

      <nav className="mobile-nav glass" aria-label="Mobile">
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon
          return (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `mobile-nav__item ${isActive ? 'is-active' : ''}`}>
              <Icon size={20} aria-hidden />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <CommandPalette />
      <TutorDrawer />
      <Toaster />
    </div>
  )
}
