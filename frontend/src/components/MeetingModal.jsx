import React, { useState, useEffect } from 'react'
import { tipProps } from '../utils/tipProps.js'

const EMPTY = {
  text: '',
  priority: 'medium',
  dueDate: '',
  startTime: '',
  endTime: '',
  location: '',
  meetingLink: '',
  memberNames: '',
  important: false,
  addToSchedule: true,
  category: 'Meetings',
  type: 'task',
  isToday: false,
}

export default function MeetingModal({ meeting, onSave, onClose, saving }) {
  const isEdit = Boolean(meeting?._id)
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    if (meeting) {
      const names = (meeting.attendees || []).map(a => a.name).join(', ')
      setForm({
        text: meeting.text || '',
        priority: meeting.priority || 'medium',
        dueDate: meeting.dueDate ? meeting.dueDate.slice(0, 10) : '',
        startTime: meeting.startTime || '',
        endTime: meeting.endTime || '',
        location: meeting.location || '',
        meetingLink: meeting.meetingLink || '',
        memberNames: names,
        important: meeting.important || false,
        addToSchedule: Boolean(meeting.scheduleId),
        category: 'Meetings',
        type: 'task',
        isToday: false,
        scheduleId: meeting.scheduleId || null,
      })
    } else {
      setForm(EMPTY)
    }
  }, [meeting])

  const handle = e => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [e.target.name]: val }))
  }

  const submit = e => {
    e.preventDefault()
    if (!form.text.trim()) return
    const attendees = form.memberNames.split(',').map(n => n.trim()).filter(Boolean)
      .map(n => ({ name: n, initials: n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) }))
    onSave({ ...form, attendees })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-soft w-full max-w-md p-6 animate-fade-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-800 text-base">{isEdit ? 'Edit Meeting' : 'New Meeting'}</h3>
          <button onClick={onClose} {...tipProps('Close')} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Meeting title *</label>
            <input name="text" value={form.text} onChange={handle} placeholder="Weekly standup"
                   className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Date</label>
              <input name="dueDate" type="date" value={form.dueDate} onChange={handle}
                     className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-400 transition-all"/>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Start time</label>
              <input name="startTime" value={form.startTime} onChange={handle} placeholder="09:00 AM"
                     className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-400 transition-all"/>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">End time</label>
              <input name="endTime" value={form.endTime} onChange={handle} placeholder="10:00 AM"
                     className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-400 transition-all"/>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Location</label>
            <input name="location" value={form.location} onChange={handle} placeholder="Conference Room A"
                   className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-400 transition-all"/>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Meeting link</label>
            <input name="meetingLink" value={form.meetingLink} onChange={handle} placeholder="https://zoom.us/..."
                   className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-400 transition-all"/>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Attendees</label>
            <input name="memberNames" value={form.memberNames} onChange={handle} placeholder="Alice, Bob, Carol"
                   className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-400 transition-all"/>
          </div>

          <div>
            <label className="flex items-end gap-2 cursor-pointer select-none pb-2">
              <input type="checkbox" name="important" checked={form.important} onChange={handle}
                     className="w-4 h-4 rounded accent-yellow-500"/>
              <span className="text-sm text-gray-600">⭐ Important</span>
            </label>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" name="addToSchedule" checked={form.addToSchedule} onChange={handle}
                   className="w-4 h-4 rounded accent-purple-600"/>
            <span className="text-sm text-gray-600">Add to schedule calendar</span>
          </label>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-soft disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg,#6c47ff,#8b6dff)' }}>
              {saving ? 'Saving…' : (isEdit ? 'Save Meeting' : 'Schedule Meeting')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
