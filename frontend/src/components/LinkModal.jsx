import React, { useState, useEffect } from 'react'
import { tipProps } from '../utils/tipProps.js'

export default function LinkModal({ link, onSave, onClose, saving }) {
  const isEdit = Boolean(link?._id)
  const [form, setForm] = useState({
    text: '',
    url: '',
    category: 'General',
    important: false,
    type: 'link',
    isToday: false,
  })

  useEffect(() => {
    if (link) {
      setForm({
        text: link.text || '',
        url: link.url || (link.text && /^https?:\/\//i.test(link.text) ? link.text : ''),
        category: link.category || 'General',
        important: link.important || false,
        type: 'link',
        isToday: false,
      })
    }
  }, [link])

  const handle = e => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [e.target.name]: val }))
  }

  const submit = e => {
    e.preventDefault()
    if (!form.text.trim() || !form.url.trim()) return
    onSave(form)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-soft w-full max-w-md p-6 animate-fade-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-800 text-base">{isEdit ? 'Edit Link' : 'Save Link'}</h3>
          <button onClick={onClose} {...tipProps('Close')} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Title *</label>
            <input
              name="text"
              value={form.text}
              onChange={handle}
              placeholder="e.g. React Docs"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">URL *</label>
            <input
              name="url"
              type="url"
              value={form.url}
              onChange={handle}
              placeholder="https://example.com"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Category</label>
            <input
              name="category"
              value={form.category}
              onChange={handle}
              placeholder="General"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-400 transition-all"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" name="important" checked={form.important} onChange={handle}
                   className="w-4 h-4 rounded accent-yellow-500"/>
            <span className="text-sm text-gray-600">⭐ Mark as important</span>
          </label>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-soft disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg,#6c47ff,#8b6dff)' }}>
              {saving ? 'Saving…' : (isEdit ? 'Save Link' : 'Add Link')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
