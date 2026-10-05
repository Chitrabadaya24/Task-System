import React, { useState, useEffect } from 'react'
import { tipProps } from '../utils/tipProps.js'
import {
  HABIT_CATEGORIES,
  HABIT_COLORS,
  HABIT_ICONS,
  DAY_LABELS_SHORT,
  WEEK_ORDER,
} from '../utils/habitHelpers.js'

const emptyForm = () => ({
  title: '',
  description: '',
  icon: '🔥',
  color: '#6c47ff',
  category: 'Health',
  frequency: 'daily',
  reminderTime: '',
  targetDays: [0, 1, 2, 3, 4, 5, 6],
  customCategory: '',
})

export default function HabitModal({ habit, onSave, onClose, saving }) {
  const isEdit = Boolean(habit?._id)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  useEffect(() => {
    if (habit) {
      const known = HABIT_CATEGORIES.includes(habit.category)
      setForm({
        title: habit.title || '',
        description: habit.description || '',
        icon: habit.icon || '🔥',
        color: habit.color || '#6c47ff',
        category: known ? habit.category : 'Custom',
        frequency: habit.frequency || 'daily',
        reminderTime: habit.reminderTime || '',
        targetDays: Array.isArray(habit.targetDays) && habit.targetDays.length
          ? [...habit.targetDays]
          : [0, 1, 2, 3, 4, 5, 6],
        customCategory: known ? '' : (habit.category || ''),
      })
    } else {
      setForm(emptyForm())
    }
    setError('')
  }, [habit])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const toggleDay = (dow) => {
    setForm(f => {
      const has = f.targetDays.includes(dow)
      let next = has ? f.targetDays.filter(d => d !== dow) : [...f.targetDays, dow]
      if (!next.length) next = [dow]
      return { ...f, targetDays: next.sort() }
    })
  }

  const submit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Habit name is required')
      return
    }
    if (!form.targetDays.length) {
      setError('Select at least one day')
      return
    }
    const category = form.category === 'Custom'
      ? (form.customCategory.trim() || 'Custom')
      : form.category

    onSave({
      title: form.title.trim(),
      description: form.description.trim(),
      icon: form.icon,
      color: form.color,
      category,
      frequency: form.frequency,
      reminderTime: form.reminderTime,
      targetDays: form.frequency === 'daily' && form.targetDays.length === 7
        ? form.targetDays
        : form.targetDays,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-soft w-full max-w-lg p-6 animate-fade-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-800 text-base">
            {isEdit ? 'Edit Habit' : 'New Habit'}
          </h3>
          <button type="button" onClick={onClose} {...tipProps('Close')}
                  className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="flex gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Icon</label>
              <div className="flex flex-wrap gap-1.5 max-w-[140px]">
                {HABIT_ICONS.map(ic => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => set('icon', ic)}
                    className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all
                      ${form.icon === ic ? 'ring-2 ring-purple-500 bg-purple-50 scale-110' : 'bg-gray-50 hover:bg-gray-100'}`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-xs font-medium text-gray-500 block mb-1">Name *</label>
              <input
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="e.g. Morning meditation"
                maxLength={120}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
              />
              <label className="text-xs font-medium text-gray-500 block mb-1 mt-3">Description</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Optional short note…"
                rows={2}
                maxLength={500}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all resize-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Color</label>
            <div className="flex flex-wrap gap-2">
              {HABIT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('color', c)}
                  {...tipProps(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'ring-2 ring-offset-2 ring-purple-400 scale-110' : 'hover:scale-105'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => set('category', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-400 bg-white"
              >
                {HABIT_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {form.category === 'Custom' && (
                <input
                  value={form.customCategory}
                  onChange={e => set('customCategory', e.target.value)}
                  placeholder="Custom name"
                  className="w-full mt-2 px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-400"
                />
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Frequency</label>
              <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                {['daily', 'weekly'].map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => {
                      set('frequency', f)
                      if (f === 'daily') set('targetDays', [0, 1, 2, 3, 4, 5, 6])
                      else set('targetDays', [1, 2, 3, 4, 5])
                    }}
                    className={`flex-1 py-2 text-sm capitalize transition-colors
                      ${form.frequency === f ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              {form.frequency === 'weekly' ? 'Active days' : 'Target days'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {WEEK_ORDER.map(dow => (
                <button
                  key={dow}
                  type="button"
                  onClick={() => toggleDay(dow)}
                  className={`w-10 h-9 rounded-lg text-xs font-medium transition-all
                    ${form.targetDays.includes(dow)
                      ? 'text-white shadow-sm'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                  style={form.targetDays.includes(dow) ? { background: form.color } : undefined}
                >
                  {DAY_LABELS_SHORT[dow]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Reminder time
              <span className="text-gray-400 font-normal ml-1">(optional)</span>
            </label>
            <input
              type="time"
              value={form.reminderTime}
              onChange={e => set('reminderTime', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-400"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Stored for upcoming reminder notifications.
            </p>
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
              {saving ? 'Saving…' : (isEdit ? 'Save Habit' : 'Create Habit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
