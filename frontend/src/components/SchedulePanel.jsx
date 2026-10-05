import React, { useState } from 'react'
import { tipProps } from '../utils/tipProps.js'

const COLORS   = { yellow: '#fff4d6', blue: '#e8f0ff', pink: '#ffe8f0', green: '#e4f9ef' }
const TEXT_C   = { yellow: '#b07800', blue: '#2952a3', pink: '#b02060', green: '#1a7a4a' }
const AV_COLORS = ['#ffb347','#7ecfb8','#b39ddb','#ef9a9a','#80cbc4','#ffe082']

export default function SchedulePanel({ schedules, loading, weekDays, selectedDate, onSelectDate, onAdd, onDelete, onClose }) {
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm] = useState({ title: '', startTime: '', endTime: '', color: 'blue', memberNames: '' })

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    if (!form.title?.trim()) return
    const members = form.memberNames.split(',').map(n => n.trim()).filter(Boolean)
      .map(n => ({ name: n, initials: n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) }))
    await onAdd({ ...form, members, date: selectedDate })
    setForm({ title: '', startTime: '', endTime: '', color: 'blue', memberNames: '' })
    setShowForm(false)
  }

  return (
    <aside
      className="w-full lg:w-64 shrink-0 lg:h-full min-h-0 bg-white lg:bg-[#f4f3f8]
        lg:border-l border-gray-200
        flex flex-col lg:overflow-y-auto"
    >
      <div className="px-3 sm:px-4 flex flex-col gap-3 sm:gap-4 pb-4 sm:pb-6 pt-4 lg:pt-11">
        <div className="flex items-center justify-between gap-2">
          <span className="font-serif text-lg sm:text-xl text-gray-800">Schedule</span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setShowForm(s => !s)}
                    {...tipProps(showForm ? 'Close form' : 'Add event')}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-lg transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg,#6c47ff,#8b6dff)' }}>+</button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                {...tipProps('Close')}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close schedule"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-0.5 sm:gap-1 overflow-x-auto">
          {weekDays.map(c => (
            <button key={c.iso} onClick={() => onSelectDate(c.iso)}
                    {...tipProps(`${c.label}, day ${c.day}`)}
                    className={`flex-1 min-w-[2.25rem] flex flex-col items-center py-1.5 rounded-lg text-[10px] transition-all
                      ${selectedDate === c.iso ? 'text-white' : 'text-gray-400 hover:bg-gray-50 lg:hover:bg-white/60'}`}
                    style={selectedDate === c.iso ? { background: '#6c47ff' } : {}}>
              <span>{c.label}</span>
              <span className={`text-sm font-semibold mt-0.5 ${selectedDate === c.iso ? 'text-white' : 'text-gray-700'}`}>{c.day}</span>
            </button>
          ))}
        </div>

        {showForm && (
          <form onSubmit={submit} className="bg-gray-50 lg:bg-white rounded-2xl p-4 flex flex-col gap-3 shadow-card animate-fade-up">
            <input name="title" value={form.title} onChange={handle} placeholder="Event title" required
                   className="px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-purple-400 transition-all w-full"/>
            <div className="grid grid-cols-2 gap-2">
              <input name="startTime" value={form.startTime} onChange={handle} placeholder="09:00 AM (optional)"
                     className="px-2 py-1.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-purple-400 transition-all"/>
              <input name="endTime" value={form.endTime} onChange={handle} placeholder="10:00 AM (optional)"
                     className="px-2 py-1.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-purple-400 transition-all"/>
            </div>
            <select name="color" value={form.color} onChange={handle}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-purple-400 transition-all">
              <option value="yellow">🟡 Yellow</option>
              <option value="blue">🔵 Blue</option>
              <option value="pink">🩷 Pink</option>
              <option value="green">🟢 Green</option>
            </select>
            <input name="memberNames" value={form.memberNames} onChange={handle}
                   placeholder="Members (comma-separated)"
                   className="px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-purple-400 transition-all w-full"/>
            <button type="submit"
                    className="py-2 rounded-xl text-white text-xs font-medium transition-all hover:shadow-soft"
                    style={{ background: 'linear-gradient(135deg,#6c47ff,#8b6dff)' }}>
              Add Event
            </button>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : schedules.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No events for this day.</p>
        ) : (
          <div className="flex flex-col gap-2 sm:gap-3">
            {schedules.map((s, i) => <ScheduleCard key={s._id} s={s} onDelete={onDelete} index={i}/>)}
          </div>
        )}
      </div>
    </aside>
  )
}

function ScheduleCard({ s, onDelete, index }) {
  const [hovered, setHovered] = useState(false)
  const bg   = COLORS[s.color] || COLORS.blue
  const text = TEXT_C[s.color] || TEXT_C.blue

  return (
    <div
      className={`rounded-2xl p-3 sm:p-4 flex flex-col gap-2.5 cursor-pointer transition-all duration-200 animate-fade-up delay-${Math.min(index + 1, 4)} relative
        ${hovered ? 'shadow-md -translate-y-0.5' : ''}`}
      style={{ background: bg }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <button onClick={() => onDelete(s._id)}
                {...tipProps('Delete event')}
                className="absolute top-2 right-2 text-xs opacity-60 hover:opacity-100 transition-opacity"
                style={{ color: text }}>✕</button>
      )}
      {(s.startTime || s.endTime) && (
        <p className="text-[11px] font-medium opacity-70" style={{ color: text }}>
          {s.startTime}{s.startTime && s.endTime ? ' – ' : ''}{s.endTime}
        </p>
      )}
      <p className="text-sm font-semibold leading-snug" style={{ color: text }}>{s.title}</p>
      {s.members?.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex">
            {s.members.slice(0, 4).map((m, i) => (
              <div key={i}
                   className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-white/60 -mr-1.5"
                   style={{ background: AV_COLORS[i % AV_COLORS.length], color: '#fff' }}>
                {m.initials}
              </div>
            ))}
          </div>
          <span className="text-[10px] opacity-50" style={{ color: text }}>{s.members.length} members</span>
        </div>
      )}
    </div>
  )
}
