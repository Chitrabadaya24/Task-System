import React from 'react'
import { tipProps } from '../utils/tipProps.js'
import { getWeekDays, getDayStatus, WEEKDAY_FULL, toDateKey } from '../utils/habitHelpers.js'

const STATUS_UI = {
  completed: { mark: '✔', cls: 'bg-teal-50 text-teal-600 border-teal-200' },
  missed: { mark: '✖', cls: 'bg-red-50 text-red-500 border-red-100' },
  pending: { mark: '○', cls: 'bg-gray-50 text-gray-400 border-gray-200' },
  skipped: { mark: '·', cls: 'bg-transparent text-gray-300 border-transparent' },
}

export default function HabitWeekTracker({ habit, onToggleDay, disabled }) {
  const days = getWeekDays()
  const today = toDateKey(new Date())

  return (
    <div className="flex items-center justify-between gap-1">
      {days.map((d, i) => {
        const status = getDayStatus(habit, d.iso)
        const ui = STATUS_UI[status] || STATUS_UI.pending
        const isFuture = d.iso > today
        const clickable = !disabled && status !== 'skipped' && !isFuture

        return (
          <button
            key={d.iso}
            type="button"
            disabled={!clickable}
            onClick={() => clickable && onToggleDay?.(habit._id, d.iso)}
            {...tipProps(`${WEEKDAY_FULL[i]} · ${status}`)}
            className={`flex-1 min-w-0 flex flex-col items-center gap-0.5 py-1.5 rounded-xl border text-[10px] font-medium transition-all
              ${ui.cls}
              ${d.today ? 'ring-2 ring-purple-300 ring-offset-1' : ''}
              ${clickable ? 'hover:scale-105 cursor-pointer' : 'cursor-default'}
              disabled:hover:scale-100 disabled:opacity-70`}
          >
            <span className="text-[9px] uppercase tracking-wide opacity-70">{d.label}</span>
            <span className={`text-xs leading-none ${status === 'completed' ? 'animate-check' : ''}`}>
              {ui.mark}
            </span>
          </button>
        )
      })}
    </div>
  )
}
