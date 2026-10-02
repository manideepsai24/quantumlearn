import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/store/auth'
import { AuthLayout } from './AuthLayout'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const login = useAuth((s) => s.login)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!EMAIL.test(email)) next.email = 'Enter a valid email address.'
    if (!password) next.password = 'Enter your password.'
    setErrors(next)
    setFormError(null)
    if (Object.keys(next).length) return
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 400)) setFormError('Incorrect email or password.')
      else if (err instanceof ApiError) setFormError(err.message)
      else setFormError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue your quantum journey."
      footer={<>New here? <Link to="/register" className="link">Create an account</Link></>}>
      <form className="stack" onSubmit={(e) => void submit(e)} noValidate>
        {formError && <div className="form-error" role="alert">{formError}</div>}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" className={`input ${errors.email ? 'input--error' : ''}`} type="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-err' : undefined} />
          {errors.email && <p id="email-err" className="field__error">{errors.email}</p>}
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" className={`input ${errors.password ? 'input--error' : ''}`} type="password" autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)} aria-invalid={!!errors.password} aria-describedby={errors.password ? 'pw-err' : undefined} />
          {errors.password && <p id="pw-err" className="field__error">{errors.password}</p>}
        </div>
        <Button type="submit" variant="primary" size="lg" loading={loading}>Sign in</Button>
      </form>
    </AuthLayout>
  )
}
