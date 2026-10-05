import React, { useState, useEffect, useRef } from 'react'
import api from '../utils/api.js'
import { tipProps } from '../utils/tipProps.js'

const TYPE_ICON = { task: '✓', note: '📝', link: '🔗' }
const TYPE_LABEL = { task: 'Task', note: 'Note', link: 'Link' }

export default function SearchBar({ onSelect, onNavigate }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setOpen(false)
      return
    }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/tasks', { params: { q: query.trim() } })
        setResults(data.slice(0, 8))
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(timerRef.current)
  }, [query])

  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handlePick = (item) => {
    setQuery('')
    setOpen(false)
    if (item.type === 'note') onNavigate('notes')
    else if (item.type === 'link') onNavigate('links')
    else if (item.category?.toLowerCase() === 'meetings') onNavigate('meetings')
    else onNavigate('today')
    onSelect?.(item)
  }

  const isMeeting = (item) => item.category?.toLowerCase() === 'meetings' && item.type !== 'note' && item.type !== 'link'

  return (
    <div ref={wrapRef} className="relative flex-1 min-w-0 max-w-md mx-1 sm:mx-4">
      <div className="relative">
        <svg className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          data-search-input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          placeholder="Search…"
          {...tipProps('Search (/)', 'below')}
          className="w-full pl-8 sm:pl-9 pr-8 py-1.5 sm:py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100 transition-all"
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false) }}
                  {...tipProps('Clear search', 'below')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden z-50 animate-fade-up">
          {loading ? (
            <p className="text-xs text-gray-400 px-4 py-3">Searching…</p>
          ) : results.length === 0 ? (
            <p className="text-xs text-gray-400 px-4 py-3">No results for "{query}"</p>
          ) : (
            results.map(item => (
              <button
                key={item._id}
                onClick={() => handlePick(item)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-purple-50 transition-colors border-b border-gray-50 last:border-0"
              >
                <span className="text-sm shrink-0 w-5 text-center">
                  {isMeeting(item) ? '👥' : (TYPE_ICON[item.type] || '✓')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{item.text}</p>
                  <p className="text-[10px] text-gray-400">
                    {isMeeting(item) ? 'Meeting' : (TYPE_LABEL[item.type] || 'Task')}
                    {item.category && item.category !== 'General' ? ` · ${item.category}` : ''}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
