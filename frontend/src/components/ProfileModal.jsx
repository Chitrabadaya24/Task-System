import React, { useState, useEffect } from 'react'
import { tipProps } from '../utils/tipProps.js'

export default function ProfileModal({ user, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setError('')
    }
  }, [user])

  const handle = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const submit = e => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Name is required')
      return
    }
    if (!form.email.trim()) {
      setError('Email is required')
      return
    }
    if (form.newPassword || form.confirmPassword || form.currentPassword) {
      if (!form.currentPassword) {
        setError('Enter your current password to change it')
        return
      }
      if (form.newPassword.length < 6) {
        setError('New password must be at least 6 characters')
        return
      }
      if (form.newPassword !== form.confirmPassword) {
        setError('New passwords do not match')
        return
      }
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
    }
    if (form.newPassword) {
      payload.currentPassword = form.currentPassword
      payload.newPassword = form.newPassword
    }
    onSave(payload)
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-soft w-full max-w-md p-6 animate-fade-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-800 text-base">Edit Profile</h3>
          <button onClick={onClose} {...tipProps('Close')} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="flex flex-col items-center mb-5">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
            style={{ background: 'linear-gradient(135deg,#6c47ff,#00c9a7)' }}
          >
            {initials}
          </div>
          <p className="text-sm font-medium text-gray-800 mt-2">{user?.name}</p>
          <p className="text-xs text-gray-400">{user?.email}</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handle}
              placeholder="Your name"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Email *</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handle}
              placeholder="you@example.com"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase mb-3">Change password</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Current password</label>
                <input
                  name="currentPassword"
                  type="password"
                  value={form.currentPassword}
                  onChange={handle}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">New password</label>
                <input
                  name="newPassword"
                  type="password"
                  value={form.newPassword}
                  onChange={handle}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Confirm new password</label>
                <input
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handle}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-soft disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg,#6c47ff,#8b6dff)' }}>
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
