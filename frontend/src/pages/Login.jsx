import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [show, setShow] = useState(false)

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) return setError('Please fill in all fields.')
    setBusy(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f3f8] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 w-full max-w-md p-8 animate-fade-up">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2.5 mb-2">
            <img src="/logo.png" alt="" className="w-10 h-10 rounded-xl object-cover ring-1 ring-black/10" />
            <span className="text-xl font-semibold tracking-tight">
              <span className="text-gray-900">Task</span>
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg,#6c47ff,#00b4d8)' }}
              >
                Pilot
              </span>
            </span>
          </div>
          <p className="text-sm text-gray-400">Welcome back — sign in to continue</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm px-3 py-2.5 text-center">
            {error}
          </div>
        )}

        <form onSubmit={submit} autoComplete="off" className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handle}
              placeholder="you@example.com"
              autoComplete="username"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Password</label>
            <div className="relative">
              <input
                name="password"
                type={show ? 'text' : 'password'}
                value={form.password}
                onChange={handle}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="w-full px-3 py-2.5 pr-16 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-purple-600"
              >
                {show ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-soft disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#6c47ff,#8b6dff)' }}
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-purple-600 hover:underline font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
