import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brand } from '@/components/ui/Logo'

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="auth">
      <Link to="/" className="auth__brand" aria-label="QuantumLearn home"><Brand /></Link>
      <motion.div className="auth__card card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <h1 className="auth__title">{title}</h1>
        <p className="muted">{subtitle}</p>
        {children}
      </motion.div>
      <p className="muted auth__footer">{footer}</p>
    </div>
  )
}
