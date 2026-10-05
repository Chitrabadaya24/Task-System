import React, { useState, useEffect } from 'react'
import { tipProps } from '../utils/tipProps.js'

const EMPTY_FORM = {
  text: '',
  priority: 'medium',
  dueDate: '',
  isToday: true,
  category: 'General',
  important: false,
  type: 'task',
  subtasks: [],
}

export default function TaskModal({ task, onSave, onClose, saving, defaults }) {
  const isEdit = Boolean(task?._id)
  const [form, setForm] = useState({ ...EMPTY_FORM, ...defaults })
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (task) {
      setForm({
        text: task.text || '',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
        isToday: task.isToday !== undefined ? task.isToday : true,
        category: task.category || 'General',
        important: task.important || false,
        type: 'task',
        subtasks: (task.subtasks || []).map(s => ({
          text: s.text || '',
          done: Boolean(s.done),
          _id: s._id,
        })),
      })
    } else {
      setForm({ ...EMPTY_FORM, ...defaults, subtasks: [] })
    }
    setDraft('')
  }, [task, defaults])

  const handle = e => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [e.target.name]: val }))
  }

  const addSubtask = () => {
    const text = draft.trim()
    if (!text) return
    setForm(f => ({ ...f, subtasks: [...f.subtasks, { text, done: false }] }))
    setDraft('')
  }

  const removeSubtask = (idx) => {
    setForm(f => ({ ...f, subtasks: f.subtasks.filter((_, i) => i !== idx) }))
  }

  const toggleSubtask = (idx) => {
    setForm(f => ({
      ...f,
      subtasks: f.subtasks.map((s, i) => i === idx ? { ...s, done: !s.done } : s),
    }))
  }

  const updateSubtaskText = (idx, text) => {
    setForm(f => ({
      ...f,
      subtasks: f.subtasks.map((s, i) => i === idx ? { ...s, text } : s),
    }))
  }

  const submit = e => {
    e.preventDefault()
    if (!form.text.trim()) return
    onSave({
      ...form,
      type: 'task',
      subtasks: form.subtasks.filter(s => s.text.trim()).map(s => ({
        text: s.text.trim(),
        done: Boolean(s.done),
      })),
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-soft w-full max-w-md p-6 animate-fade-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-800 text-base">{isEdit ? 'Edit Task' : 'New Task'}</h3>
          <button onClick={onClose} {...tipProps('Close')} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Task Name *</label>
            <input name="text" value={form.text} onChange={handle} placeholder="Project or main task name"
                   className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"/>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Priority</label>
            <select name="priority" value={form.priority} onChange={handle}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-400 transition-all">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Due Date</label>
              <input name="dueDate" type="date" value={form.dueDate} onChange={handle}
                     className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-400 transition-all"/>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Category</label>
              <input name="category" value={form.category} onChange={handle} placeholder="General"
                     className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-400 transition-all"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" name="isToday" checked={form.isToday} onChange={handle}
                    className="w-4 h-4 rounded accent-purple-600"/>
              <span className="text-sm text-gray-600">Today's task</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" name="important" checked={form.important} onChange={handle}
                    className="w-4 h-4 rounded accent-yellow-500"/>
              <span className="text-sm text-gray-600">⭐ Important</span>
            </label>
          </div>

          {/* Mini tasks / checklist */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500">Mini tasks</label>
              <span className="text-[10px] text-gray-400">
                {form.subtasks.filter(s => s.done).length}/{form.subtasks.length} done
              </span>
            </div>

            {form.subtasks.length > 0 && (
              <div className="space-y-2 mb-3">
                {form.subtasks.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white rounded-lg border border-gray-100 px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => toggleSubtask(idx)}
                      {...tipProps(s.done ? 'Mark incomplete' : 'Mark complete')}
                      className={`rounded border flex items-center justify-center shrink-0 transition-all
                        ${s.done ? 'bg-teal-400 border-teal-400' : 'border-gray-300'}`}
                      style={{ width: 16, height: 16 }}
                    >
                      {s.done && (
                        <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                    <input
                      value={s.text}
                      onChange={e => updateSubtaskText(idx, e.target.value)}
                      className={`flex-1 text-sm outline-none bg-transparent ${s.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}
                    />
                    <button type="button" onClick={() => removeSubtask(idx)}
                            {...tipProps('Remove mini task')}
                            className="text-gray-300 hover:text-red-500 p-0.5">
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSubtask()
                  }
                }}
                placeholder="Add a mini task…"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-purple-400 bg-white"
              />
              <button
                type="button"
                onClick={addSubtask}
                {...tipProps('Add mini task')}
                className="px-3 py-2 rounded-lg text-white text-sm font-medium shrink-0"
                style={{ background: 'linear-gradient(135deg,#6c47ff,#8b6dff)' }}
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-soft disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg,#6c47ff,#8b6dff)' }}>
              {saving ? 'Saving…' : (isEdit ? 'Save Changes' : 'Add Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
