import React, { useMemo } from 'react'
import { tipProps } from '../utils/tipProps.js'
import { getMonthGrid, toDateKey, moodMeta } from '../utils/journalHelpers.js'

export default function JournalCalendar({
  cursor,
  onCursorChange,
  selectedDate,
  onSelectDate,
  datesMeta = [],
}) {
  const cells = useMemo(
    () => getMonthGrid(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  )
  const today = toDateKey(new Date())
  const title = new Date(cursor.year, cursor.month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const metaMap = useMemo(() => {
    const m = {}
    for (const d of datesMeta) m[d.journalDate] = d
    return m
  }, [datesMeta])

  const shift = (delta) => {
    const d = new Date(cursor.year, cursor.month + delta, 1)
    onCursorChange({ year: d.getFullYear(), month: d.getMonth() })
  }

  return (
    <div className="journal-glass rounded-2xl border border-white/60 p-4 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">Calendar</h3>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => shift(-1)} {...tipProps('Previous')}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-purple-50 hover:text-purple-600">
            <Chevron dir="left" />
          </button>
          <span className="text-xs font-medium text-gray-700 min-w-[100px] text-center">{title}</span>
          <button type="button" onClick={() => shift(1)} {...tipProps('Next')}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-purple-50 hover:text-purple-600">
            <Chevron dir="right" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
          <div key={d} className="text-[9px] font-semibold text-gray-400 text-center py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`e-${i}`} className="aspect-square" />
          const meta = metaMap[cell.iso]
          const hasEntry = Boolean(meta)
          const selected = cell.iso === selectedDate
          const isToday = cell.iso === today
          const mood = meta?.mood ? moodMeta(meta.mood) : null

          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => onSelectDate(cell.iso)}
              {...tipProps(hasEntry ? `${cell.iso} · entry` : cell.iso)}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center text-[11px] font-medium transition-all relative
                ${selected ? 'bg-purple-600 text-white shadow-sm' : isToday ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-purple-50/80'}
                ${hasEntry && !selected ? 'font-semibold' : ''}`}
            >
              {cell.day}
              {hasEntry && (
                <span
                  className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${selected ? 'bg-white' : 'bg-purple-500'}`}
                />
              )}
              {mood && !selected && (
                <span className="absolute top-0.5 right-0.5 text-[8px] leading-none opacity-80">{mood.emoji}</span>
              )}
              {meta?.favorite && (
                <span className={`absolute top-0.5 left-0.5 text-[7px] ${selected ? 'text-amber-200' : 'text-amber-400'}`}>★</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
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
