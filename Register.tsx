import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/store/auth'
import { AuthLayout } from './AuthLayout'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Errors { name?: string; email?: string; password?: string; confirm?: string }

export default function Register() {
  const register = useAuth((s) => s.register)
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  type FieldKey = 'name' | 'email' | 'password' | 'confirm'
  const set = (k: FieldKey) => (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: Errors = {}
    if (form.name.trim().length < 2) next.name = 'Enter your name.'
    if (!EMAIL.test(form.email)) next.email = 'Enter a valid email address.'
    if (form.password.length < 8) next.password = 'Use at least 8 characters.'
    if (form.confirm !== form.password) next.confirm = 'Passwords don’t match.'
    setErrors(next)
    setFormError(null)
    if (Object.keys(next).length) return
    setLoading(true)
    try {
      await register(form.name.trim(), form.email.trim(), form.password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setFormError('An account with this email already exists.')
      else if (err instanceof ApiError) setFormError(err.message)
      else setFormError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const field = (id: FieldKey, label: string, type: string, auto: string, err?: string) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} className={`input ${err ? 'input--error' : ''}`} type={type} autoComplete={auto} value={form[id]} onChange={set(id)}
        aria-invalid={!!err} aria-describedby={err ? `${id}-err` : undefined} />
      {err && <p id={`${id}-err`} className="field__error">{err}</p>}
    </div>
  )

  return (
    <AuthLayout title="Create your account" subtitle="Learn quantum computing by building it."
      footer={<>Already have an account? <Link to="/login" className="link">Sign in</Link></>}>
      <form className="stack" onSubmit={(e) => void submit(e)} noValidate>
        {formError && <div className="form-error" role="alert">{formError}</div>}
        {field('name', 'Name', 'text', 'name', errors.name)}
        {field('email', 'Email', 'email', 'email', errors.email)}
        {field('password', 'Password', 'password', 'new-password', errors.password)}
        {field('confirm', 'Confirm password', 'password', 'new-password', errors.confirm)}
        <Button type="submit" variant="primary" size="lg" loading={loading}>Create account</Button>
      </form>
    </AuthLayout>
  )
}
