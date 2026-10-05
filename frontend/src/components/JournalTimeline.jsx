import React from 'react'
import { tipProps } from '../utils/tipProps.js'
import {
  formatJournalDate,
  moodMeta,
  previewText,
  countWords,
} from '../utils/journalHelpers.js'

export default function JournalTimeline({
  journals,
  selectedDate,
  onSelectDate,
  onDelete,
  loading,
}) {
  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-50" />)}
      </div>
    )
  }

  if (!journals.length) {
    return (
      <div className="text-center py-10 px-4">
        <p className="text-2xl mb-2">📔</p>
        <p className="text-sm text-gray-400">No entries yet. Start writing today.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
      {journals.map((j, i) => {
        const mood = moodMeta(j.mood)
        const active = j.journalDate === selectedDate
        const words = j.wordCount || countWords(j.content)
        return (
          <div
            key={j._id}
            className={`group relative rounded-2xl border p-3 transition-all cursor-pointer animate-fade-up delay-${Math.min(i + 1, 6)}
              ${active
                ? 'border-purple-200 bg-purple-50/60 shadow-sm'
                : 'border-gray-100 bg-white/70 hover:border-purple-100 hover:shadow-card'}`}
            onClick={() => onSelectDate(j.journalDate)}
          >
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-base shrink-0">
                {mood?.emoji || '📝'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-gray-800 truncate">
                    {formatJournalDate(j.journalDate, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  {j.favorite && <span className="text-amber-400 text-[10px]">★</span>}
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {formatJournalDate(j.journalDate, { weekday: 'short', day: 'numeric', month: 'short' })}
                  {' · '}{words} words
                </p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {previewText(j.content, 100) || 'Empty entry'}
                </p>
              </div>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onDelete(j._id) }}
                {...tipProps('Delete')}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                </svg>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
