import React, { useEffect, useRef } from 'react'
import { tipProps } from '../utils/tipProps.js'
import {
  JOURNAL_MOODS,
  MANIFESTATION_PLACEHOLDERS,
  countWords,
  splitJournalContent,
  joinJournalContent,
} from '../utils/journalHelpers.js'

export default function JournalEditor({
  draft,
  entryLoading,
  saveStatus,
  dirty,
  onChange,
  onSave,
  onToggleFavorite,
  onDelete,
}) {
  const textareaRef = useRef(null)
  const { body } = splitJournalContent(draft?.content || '')
  const words = countWords(draft?.content || '')
  const chars = (draft?.content || '').length

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, 220)}px`
  }, [body, entryLoading])

  if (entryLoading) {
    return <EditorSkeleton />
  }

  const statusLabel =
    saveStatus === 'saving' ? 'Saving…'
      : saveStatus === 'saved' ? 'Saved'
        : saveStatus === 'error' ? 'Save failed'
          : dirty ? 'Unsaved changes' : 'Ready'

  const onBodyChange = (value) => {
    onChange({ content: joinJournalContent(value) })
  }

  return (
    <div className="space-y-4">
      {/* Mood */}
      <div>
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">How are you feeling?</p>
        <div className="flex flex-wrap gap-2">
          {JOURNAL_MOODS.map(m => {
            const active = draft.mood === m.key
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => onChange({ mood: active ? '' : m.key })}
                {...tipProps(m.label)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm transition-all duration-200
                  ${active
                    ? 'bg-purple-100 text-purple-800 ring-2 ring-purple-300 scale-105 shadow-sm'
                    : 'bg-white/70 border border-gray-100 text-gray-500 hover:border-purple-200 hover:bg-purple-50/50'}`}
              >
                <span className="text-lg leading-none">{m.emoji}</span>
                <span className="text-xs font-medium hidden sm:inline">{m.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Writing surface — opener is fixed; user writes after it */}
      <div className="relative">
        <p className="font-serif text-xl sm:text-2xl font-bold text-gray-900 mb-3">
          Dear Future Self,
        </p>
        <textarea
          ref={textareaRef}
          value={body}
          onChange={e => onBodyChange(e.target.value)}
          placeholder="Write freely to the person you are becoming…"
          className="journal-editor w-full min-h-[220px] resize-none bg-transparent text-[15px] sm:text-base leading-relaxed text-gray-700 placeholder:text-gray-300 outline-none"
          spellCheck
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400">
        <div className="flex items-center gap-3">
          <span>{words} word{words !== 1 ? 's' : ''}</span>
          <span className="text-gray-200">·</span>
          <span>{chars} character{chars !== 1 ? 's' : ''}</span>
        </div>
        <span className={`font-medium ${
          saveStatus === 'saving' ? 'text-amber-500'
            : saveStatus === 'saved' ? 'text-teal-600'
              : saveStatus === 'error' ? 'text-red-500'
                : dirty ? 'text-purple-500' : 'text-gray-400'
        }`}>
          {statusLabel}
        </span>
      </div>

      {/* Manifestations */}
      <div className="journal-manifest rounded-2xl border border-purple-100/80 p-4 sm:p-5 relative overflow-hidden">
        <div className="absolute inset-0 journal-manifest-bg pointer-events-none" />
        <div className="relative">
          <h3 className="font-serif text-base text-gray-800 mb-1">✨ Today&apos;s Manifestation</h3>
          <p className="text-[11px] text-gray-400 mb-3">Three affirmations to carry into the day</p>
          <div className="space-y-2.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-purple-300 text-sm shrink-0">{i + 1}.</span>
                <input
                  value={(draft.manifestations || [])[i] || ''}
                  onChange={e => {
                    const next = [...(draft.manifestations || ['', '', ''])]
                    while (next.length < 3) next.push('')
                    next[i] = e.target.value
                    onChange({ manifestations: next.slice(0, 3) })
                  }}
                  placeholder={MANIFESTATION_PLACEHOLDERS[i]}
                  maxLength={300}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-white/80 border border-white text-sm text-gray-700 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-gray-300"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => onSave()}
          className="px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-soft"
          style={{ background: 'linear-gradient(135deg,#6c47ff,#8b6dff)' }}
        >
          Save Journal
        </button>

        <button
          type="button"
          onClick={onToggleFavorite}
          {...tipProps(draft.favorite ? 'Unfavorite' : 'Favorite')}
          className={`p-2.5 rounded-xl border transition-colors ${
            draft.favorite
              ? 'bg-amber-50 border-amber-200 text-amber-500'
              : 'bg-white border-gray-100 text-gray-400 hover:text-amber-500 hover:border-amber-200'
          }`}
        >
          <svg width="16" height="16" fill={draft.favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </button>

        {draft._id && (
          <button
            type="button"
            onClick={() => onDelete(draft._id)}
            {...tipProps('Delete entry')}
            className="p-2.5 rounded-xl border border-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

function EditorSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 w-16 rounded-2xl bg-gray-100" />)}
      </div>
      <div className="h-8 bg-gray-100 rounded-lg w-2/3" />
      <div className="h-52 bg-gray-50 rounded-2xl" />
      <div className="h-28 bg-purple-50/50 rounded-2xl" />
    </div>
  )
}
