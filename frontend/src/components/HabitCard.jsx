import React, { useState } from 'react'
import { tipProps } from '../utils/tipProps.js'
import HabitProgressRing from './HabitProgressRing.jsx'
import HabitWeekTracker from './HabitWeekTracker.jsx'
import { isCompletedOn, isHabitDueOn, toDateKey } from '../utils/habitHelpers.js'

export default function HabitCard({
  habit,
  index = 0,
  onToggleToday,
  onToggleDay,
  onEdit,
  onDelete,
  onArchive,
  onPause,
}) {
  const [hovered, setHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const today = toDateKey(new Date())
  const dueToday = isHabitDueOn(habit, today)
  const doneToday = isCompletedOn(habit, today)
  const paused = habit.isPaused
  const archived = habit.isArchived

  return (
    <div
      className={`relative habit-glass rounded-2xl border border-white/60 p-4 flex flex-col gap-3 transition-all duration-200 animate-fade-up delay-${Math.min(index + 1, 6)}
        ${hovered ? 'shadow-soft -translate-y-0.5 border-purple-100' : 'shadow-card'}
        ${paused || archived ? 'opacity-75' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false) }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm"
          style={{ background: `${habit.color}22`, color: habit.color }}
        >
          {habit.icon || '🔥'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{habit.title}</h3>
              {habit.description && (
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{habit.description}</p>
              )}
            </div>
            <div className="relative flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => onEdit(habit)}
                {...tipProps('Edit habit')}
                className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
              >
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button
                type="button"
                onClick={() => onDelete(habit._id)}
                {...tipProps('Delete habit')}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setMenuOpen(o => !o)}
                {...tipProps('More actions')}
                className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
              >
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
                </svg>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 z-20 w-36 bg-white rounded-xl shadow-soft border border-gray-100 py-1 animate-fade-up">
                  <MenuBtn
                    label={paused ? 'Resume' : 'Pause'}
                    onClick={() => { setMenuOpen(false); onPause(habit._id, !paused) }}
                  />
                  <MenuBtn
                    label={archived ? 'Unarchive' : 'Archive'}
                    onClick={() => { setMenuOpen(false); onArchive(habit._id, !archived) }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: `${habit.color}18`, color: habit.color }}
            >
              {habit.category}
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">
              {habit.frequency}
            </span>
            {habit.reminderTime && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600"
                    {...tipProps('Reminder')}>
                ⏰ {habit.reminderTime}
              </span>
            )}
            {paused && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">
                Paused
              </span>
            )}
            {archived && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                Archived
              </span>
            )}
          </div>
        </div>

        <HabitProgressRing
          value={habit.completionPercentage || 0}
          size={56}
          stroke={5}
          color={habit.color || '#6c47ff'}
        />
      </div>

      <div className="flex items-center gap-4 text-[11px] text-gray-500">
        <span {...tipProps('Current streak')}>
          <span className="font-semibold text-gray-800">{habit.streak || 0}</span> day streak
        </span>
        <span className="text-gray-300">·</span>
        <span {...tipProps('Longest streak')}>
          Best <span className="font-semibold text-gray-800">{habit.longestStreak || 0}</span>
        </span>
        <span className="text-gray-300">·</span>
        <span>{habit.completionPercentage || 0}% overall</span>
      </div>

      <HabitWeekTracker
        habit={habit}
        onToggleDay={onToggleDay}
        disabled={paused || archived}
      />

      {dueToday && !archived && (
        <button
          type="button"
          disabled={paused}
          onClick={() => onToggleToday(habit._id, !doneToday)}
          className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2
            ${doneToday
              ? 'bg-teal-50 text-teal-700 border border-teal-100 hover:bg-teal-100'
              : 'text-white hover:-translate-y-0.5 hover:shadow-soft'}
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
          style={!doneToday ? { background: `linear-gradient(135deg,${habit.color},${habit.color}cc)` } : undefined}
        >
          {doneToday ? (
            <>
              <span className="animate-check">✔</span> Completed today
            </>
          ) : (
            <>Mark complete</>
          )}
        </button>
      )}
    </div>
  )
}

function MenuBtn({ label, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 text-xs transition-colors
        ${danger ? 'text-red-500 hover:bg-red-50' : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'}`}
    >
      {label}
    </button>
  )
}
