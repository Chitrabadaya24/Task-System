import React, { useMemo, useState } from 'react'
import { tipProps } from '../utils/tipProps.js'
import {
  getMonthGrid,
  toDateKey,
  isHabitDueOn,
  isCompletedOn,
  WEEKDAY_FULL,
} from '../utils/habitHelpers.js'

export default function HabitCalendar({ habits }) {
  const now = new Date()
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const cells = useMemo(
    () => getMonthGrid(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  )
  const today = toDateKey(now)
  const title = new Date(cursor.year, cursor.month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const active = (habits || []).filter(h => !h.isArchived && !h.isPaused)

  const dayMeta = (iso) => {
    if (!iso) return null
    let due = 0
    let done = 0
    let inStreak = false
    for (const h of active) {
      if (!isHabitDueOn(h, iso)) continue
      due += 1
      if (isCompletedOn(h, iso)) {
        done += 1
        if ((h.streak || 0) > 0 && iso >= addDaysSafe(today, -(h.streak - 1))) {
          inStreak = true
        }
      }
    }
    let status = 'empty'
    if (due === 0) status = 'none'
    else if (done === due) status = 'completed'
    else if (iso < today) status = 'missed'
    else if (iso === today) status = done > 0 ? 'partial' : 'pending'
    else status = 'upcoming'
    return { due, done, status, inStreak }
  }

  const shift = (delta) => {
    setCursor(c => {
      const d = new Date(c.year, c.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  return (
    <div className="habit-glass rounded-2xl border border-white/60 p-4 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Monthly calendar</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Completions · misses · streak days</p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => shift(-1)} {...tipProps('Previous month')}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-purple-50 hover:text-purple-600">
            <Chevron dir="left" />
          </button>
          <span className="text-xs font-medium text-gray-700 min-w-[110px] text-center">{title}</span>
          <button type="button" onClick={() => shift(1)} {...tipProps('Next month')}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-purple-50 hover:text-purple-600">
            <Chevron dir="right" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_FULL.map(d => (
          <div key={d} className="text-[9px] font-semibold text-gray-400 text-center py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`e-${i}`} className="aspect-square" />
          const meta = dayMeta(cell.iso)
          const isToday = cell.iso === today
          return (
            <div
              key={cell.iso}
              {...tipProps(meta?.due
                ? `${cell.iso}: ${meta.done}/${meta.due} done`
                : cell.iso)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[11px] font-medium transition-all
                ${statusClass(meta?.status)}
                ${isToday ? 'ring-2 ring-purple-500 ring-offset-1' : ''}
                ${meta?.inStreak && meta?.status === 'completed' ? 'habit-streak-glow' : ''}`}
            >
              <span>{cell.day}</span>
              {meta?.due > 0 && (
                <span className="text-[8px] opacity-70 leading-none">{meta.done}/{meta.due}</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-gray-500">
        <Legend swatch="bg-teal-100 text-teal-700" label="Completed" />
        <Legend swatch="bg-red-50 text-red-500" label="Missed" />
        <Legend swatch="bg-purple-50 text-purple-600 ring-1 ring-purple-400" label="Today" />
        <Legend swatch="bg-amber-50 text-amber-600" label="Partial" />
      </div>
    </div>
  )
}

function statusClass(status) {
  switch (status) {
    case 'completed': return 'bg-teal-50 text-teal-700'
    case 'missed': return 'bg-red-50 text-red-500'
    case 'partial': return 'bg-amber-50 text-amber-700'
    case 'pending': return 'bg-purple-50/60 text-purple-700'
    case 'upcoming': return 'bg-gray-50 text-gray-400'
    default: return 'text-gray-400'
  }
}

function Legend({ swatch, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-3.5 h-3.5 rounded ${swatch}`} />
      {label}
    </span>
  )
}

function Chevron({ dir }) {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      {dir === 'left'
        ? <polyline points="15 18 9 12 15 6" />
        : <polyline points="9 18 15 12 9 6" />}
    </svg>
  )
}

function addDaysSafe(key, n) {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + n)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}
