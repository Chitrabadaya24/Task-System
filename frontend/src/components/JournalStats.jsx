import React from 'react'
import { moodMeta } from '../utils/journalHelpers.js'

export default function JournalStats({ stats, loading }) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 animate-pulse">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 rounded-xl bg-gray-50" />)}
      </div>
    )
  }

  const mood = stats.mostCommonMood ? moodMeta(stats.mostCommonMood) : null

  const items = [
    { label: 'Total journals', value: stats.totalJournals ?? 0 },
    { label: 'Current streak', value: `${stats.currentStreak ?? 0}🔥` },
    { label: 'Longest streak', value: stats.longestStreak ?? 0 },
    { label: 'Words written', value: formatNum(stats.totalWords ?? 0) },
    { label: 'Top mood', value: mood ? `${mood.emoji} ${mood.label}` : '—' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      {items.map(item => (
        <div key={item.label} className="journal-glass rounded-xl border border-white/60 px-3 py-2.5 shadow-card">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">{item.label}</p>
          <p className="text-base font-semibold text-gray-900 mt-0.5 truncate">{item.value}</p>
        </div>
      ))}
    </div>
  )
}

function formatNum(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return String(n)
}
