import React, { useMemo, useState, useEffect } from 'react'
import { tipProps } from '../utils/tipProps.js'
import { useJournals } from '../hooks/useJournals.js'
import {
  formatJournalDate,
  formatClock,
  filterJournals,
  buildMonthOptions,
  toDateKey,
} from '../utils/journalHelpers.js'
import JournalEditor from './JournalEditor.jsx'
import JournalCalendar from './JournalCalendar.jsx'
import JournalTimeline from './JournalTimeline.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'

export default function JournalTracker({ onCountsChange }) {
  const {
    journals,
    datesMeta,
    selectedDate,
    draft,
    loading,
    entryLoading,
    saveStatus,
    dirty,
    selectDate,
    patchDraft,
    saveDraft,
    toggleFavorite,
    deleteEntry,
  } = useJournals(true)

  const [now, setNow] = useState(() => new Date())
  const [view, setView] = useState('write') // write | timeline
  const [query, setQuery] = useState('')
  const [monthFilter, setMonthFilter] = useState('all')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [calCursor, setCalCursor] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    onCountsChange?.({
      journals: journals.length,
      wroteToday: journals.some(j => j.journalDate === toDateKey(new Date())),
    })
  }, [journals]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep calendar month in sync when selecting a date
  useEffect(() => {
    if (!selectedDate) return
    const [y, m] = selectedDate.split('-').map(Number)
    setCalCursor({ year: y, month: m - 1 })
  }, [selectedDate])

  const filtered = useMemo(
    () => filterJournals(journals, { query, month: monthFilter, favoritesOnly }),
    [journals, query, monthFilter, favoritesOnly],
  )

  const monthOptions = useMemo(() => buildMonthOptions(journals), [journals])

  return (
    <div className="flex flex-col gap-4 sm:gap-5 animate-fade-in">
      {/* Diary header */}
      <div className="journal-glass rounded-2xl border border-white/60 p-4 sm:p-6 shadow-card relative overflow-hidden">
        <div className="absolute inset-0 journal-header-bg pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium text-purple-500 tracking-wide uppercase mb-1">Personal diary</p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">Dear Future Self ✨</h2>
            <p className="text-sm text-gray-500 mt-1.5">
              {formatJournalDate(selectedDate)}
              <span className="mx-2 text-gray-300">·</span>
              <span className="tabular-nums">{formatClock(now)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => selectDate(toDateKey(new Date()))}
            {...tipProps('Jump to today')}
            className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-100 text-gray-600 hover:border-purple-200 hover:text-purple-600 transition-colors self-start sm:self-auto"
          >
            Today
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">
        {/* Main writing column */}
        <div className="journal-glass rounded-2xl border border-white/60 p-4 sm:p-6 shadow-card min-w-0">
          <JournalEditor
            draft={draft}
            entryLoading={entryLoading}
            saveStatus={saveStatus}
            dirty={dirty}
            onChange={patchDraft}
            onSave={() => saveDraft({ silent: false })}
            onToggleFavorite={toggleFavorite}
            onDelete={(id) => setConfirmDelete(id)}
          />
        </div>

        {/* Side panel */}
        <div className="flex flex-col gap-4 min-w-0">
          <JournalCalendar
            cursor={calCursor}
            onCursorChange={setCalCursor}
            selectedDate={selectedDate}
            onSelectDate={selectDate}
            datesMeta={datesMeta}
          />

          <div className="journal-glass rounded-2xl border border-white/60 p-4 shadow-card flex-1">
            <div className="flex items-center justify-between mb-3 gap-2">
              <h3 className="text-sm font-semibold text-gray-800">Entries</h3>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-[11px]">
                {[
                  { key: 'write', label: 'Focus' },
                  { key: 'timeline', label: 'Timeline' },
                ].map(v => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => setView(v.key)}
                    className={`px-2.5 py-1 transition-colors ${view === v.key ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 mb-3">
              <div className="relative">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                     className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search journals…"
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-100 bg-white/80 text-xs outline-none focus:border-purple-300"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={monthFilter}
                  onChange={e => setMonthFilter(e.target.value)}
                  className="flex-1 px-2 py-1.5 rounded-xl border border-gray-100 bg-white/80 text-xs outline-none"
                >
                  <option value="all">All months</option>
                  {monthOptions.map(m => (
                    <option key={m} value={m}>
                      {new Date(`${m}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setFavoritesOnly(f => !f)}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs transition-colors ${
                    favoritesOnly
                      ? 'bg-amber-50 border-amber-200 text-amber-600'
                      : 'border-gray-100 text-gray-400 hover:text-amber-500'
                  }`}
                  {...tipProps('Favorites only')}
                >
                  ★
                </button>
              </div>
            </div>

            {(view === 'timeline' || filtered.length > 0) && (
              <JournalTimeline
                journals={filtered}
                selectedDate={selectedDate}
                onSelectDate={selectDate}
                onDelete={(id) => setConfirmDelete(id)}
                loading={loading}
              />
            )}

            {view === 'write' && !loading && filtered.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">
                  {journals.length === 0
                    ? 'Your timeline will grow as you write.'
                    : 'No entries match these filters.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete journal entry?"
          message="This page will be permanently removed from your diary."
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirmDelete(null)}
          onConfirm={async () => {
            await deleteEntry(confirmDelete)
            setConfirmDelete(null)
          }}
        />
      )}
    </div>
  )
}
