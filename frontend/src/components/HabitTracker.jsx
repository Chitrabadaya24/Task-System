import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { tipProps } from '../utils/tipProps.js'
import { useHabits } from '../hooks/useHabits.js'
import {
  filterHabits,
  greetingForHour,
  computeAchievements,
  weekTrendFromHabits,
  HABIT_CATEGORIES,
  toDateKey,
  isHabitDueOn,
  isCompletedOn,
} from '../utils/habitHelpers.js'
import HabitCard from './HabitCard.jsx'
import HabitModal from './HabitModal.jsx'
import HabitProgressRing from './HabitProgressRing.jsx'
import HabitHeatmap from './HabitHeatmap.jsx'
import HabitCalendar from './HabitCalendar.jsx'
import HabitConfetti from './HabitConfetti.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'completed', label: 'Completed' },
  { key: 'pending', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'paused', label: 'Paused' },
  { key: 'archived', label: 'Archived' },
]

export default function HabitTracker({ onCountsChange, createSignal = 0 }) {
  const { user } = useAuth()
  const {
    habits, stats, loading, statsLoading, saving,
    handleSave, handleDelete, handleArchive, handlePause, handleToggleDay,
  } = useHabits(true)

  const [filter, setFilter] = useState('all')
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [view, setView] = useState('board') // board | stats | calendar
  const prevAllDone = useRef(false)

  useEffect(() => {
    if (createSignal > 0) setModal('new')
  }, [createSignal])

  const today = toDateKey(new Date())
  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  const filtered = useMemo(
    () => filterHabits(habits, { filter, category, query }),
    [habits, filter, category, query],
  )

  const dueToday = useMemo(
    () => habits.filter(h => !h.isArchived && isHabitDueOn(h, today)),
    [habits, today],
  )
  const completedToday = dueToday.filter(h => isCompletedOn(h, today)).length
  const allDoneToday = dueToday.length > 0 && completedToday === dueToday.length

  useEffect(() => {
    if (allDoneToday && !prevAllDone.current) setShowConfetti(true)
    prevAllDone.current = allDoneToday
  }, [allDoneToday])

  useEffect(() => {
    onCountsChange?.({
      habits: habits.filter(h => !h.isArchived && !h.isPaused).length,
      pendingToday: Math.max(0, dueToday.length - completedToday),
    })
  }, [habits, dueToday.length, completedToday]) // eslint-disable-line react-hooks/exhaustive-deps — avoid parent callback churn

  const trend = useMemo(() => weekTrendFromHabits(habits), [habits])
  const achievements = useMemo(() => computeAchievements(habits, stats), [habits, stats])

  const reminders = useMemo(() => {
    return habits
      .filter(h => !h.isArchived && !h.isPaused && h.reminderTime && isHabitDueOn(h, today) && !isCompletedOn(h, today))
      .sort((a, b) => (a.reminderTime || '').localeCompare(b.reminderTime || ''))
  }, [habits, today])

  const onSave = async (form) => {
    const editId = modal && modal !== 'new' ? modal._id : null
    const ok = await handleSave(form, editId)
    if (ok) setModal(null)
  }

  const onToggleToday = async (id, completed) => {
    await handleToggleDay(id, today, completed)
  }

  const onToggleDay = async (id, date) => {
    await handleToggleDay(id, date)
  }

  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <div className="flex flex-col gap-4 sm:gap-5 animate-fade-in">
      <HabitConfetti active={showConfetti} onDone={() => setShowConfetti(false)} />

      {/* Greeting + stats strip */}
      <div className="habit-glass rounded-2xl border border-white/60 p-4 sm:p-5 shadow-card relative overflow-hidden">
        <div className="absolute inset-0 habit-dash-bg pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-purple-600 font-medium">{dateLabel}</p>
            <h2 className="font-serif text-xl sm:text-2xl text-gray-900 mt-0.5">
              {greetingForHour()}, {firstName}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {statsLoading
                ? 'Loading your progress…'
                : (stats?.motivational || 'Build consistency one day at a time.')}
            </p>
          </div>
          <HabitProgressRing
            value={stats?.completionPercentage ?? (dueToday.length ? Math.round((completedToday / dueToday.length) * 100) : 0)}
            size={88}
            stroke={8}
            color="#6c47ff"
            label={`${stats?.completionPercentage ?? (dueToday.length ? Math.round((completedToday / dueToday.length) * 100) : 0)}%`}
            sublabel="today"
          />
        </div>

        <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mt-4">
          <StatChip label="Total Habits" value={stats?.totalHabits ?? habits.filter(h => !h.isArchived).length} />
          <StatChip label="Completed Today" value={`${completedToday}/${dueToday.length || 0}`} accent />
          <StatChip label="Current Streak" value={stats?.currentStreak ?? 0} suffix="🔥" />
          <StatChip label="Longest Streak" value={stats?.longestStreak ?? 0} />
          <StatChip
            label="Completion"
            value={`${stats?.completionPercentage ?? 0}%`}
            className="col-span-2 sm:col-span-1"
          />
        </div>
      </div>

      {/* Weekly trend */}
      <div className="habit-glass rounded-2xl border border-white/60 p-4 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Weekly progress</h3>
            <p className="text-[11px] text-gray-400">Completion rate by day</p>
          </div>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
            {[
              { key: 'board', label: 'Habits' },
              { key: 'calendar', label: 'Calendar' },
              { key: 'stats', label: 'Stats' },
            ].map(v => (
              <button
                key={v.key}
                type="button"
                onClick={() => setView(v.key)}
                className={`px-3 py-1.5 transition-colors ${view === v.key ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-end gap-1.5 sm:gap-2 h-28">
          {trend.map(d => (
            <div key={d.iso} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <span className="text-[9px] text-gray-400 font-medium">{d.pct}%</span>
              <div className="w-full flex-1 flex items-end rounded-t-md bg-gray-50 overflow-hidden min-h-[4px]">
                <div
                  className="w-full rounded-t-md transition-all duration-500 habit-bar-rise"
                  style={{
                    height: `${Math.max(d.pct, d.due ? 4 : 0)}%`,
                    background: d.today
                      ? 'linear-gradient(180deg,#6c47ff,#8b6dff)'
                      : 'linear-gradient(180deg,#00c9a7,#7ee8d4)',
                  }}
                />
              </div>
              <span className={`text-[10px] font-medium ${d.today ? 'text-purple-600' : 'text-gray-400'}`}>
                {d.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {view === 'calendar' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <HabitCalendar habits={habits} />
          <HabitHeatmap habits={habits} />
        </div>
      )}

      {view === 'stats' && (
        <StatsPanel stats={stats} achievements={achievements} loading={statsLoading} />
      )}

      {view === 'board' && (
        <>
          <HabitHeatmap habits={habits.filter(h => !h.isArchived)} />

          {/* Filters + search */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                {FILTERS.map(f => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                      ${filter === f.key
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-white text-gray-500 border border-gray-100 hover:border-purple-200'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white outline-none focus:border-purple-400"
                >
                  <option value="all">All categories</option>
                  {HABIT_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="relative flex-1 sm:w-48">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                       className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search habits…"
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  />
                </div>
              </div>
            </div>

            {reminders.length > 0 && (
              <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 flex items-start gap-2">
                <span className="text-sm">⏰</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-amber-800">Upcoming reminders today</p>
                  <p className="text-[11px] text-amber-700 truncate">
                    {reminders.map(r => `${r.icon} ${r.title} (${r.reminderTime})`).join(' · ')}
                  </p>
                </div>
              </div>
            )}

            {loading ? (
              <HabitSkeleton />
            ) : filtered.length === 0 ? (
              <div className="habit-glass rounded-2xl border border-white/60 py-16 text-center shadow-card">
                <p className="text-3xl mb-3">🌱</p>
                <p className="text-sm text-gray-500 mb-1">
                  {habits.length === 0 ? 'No habits yet' : 'No habits match your filters'}
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  {habits.length === 0
                    ? 'Create a habit to start tracking streaks and progress.'
                    : 'Try another filter or clear search.'}
                </p>
                {habits.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setModal('new')}
                    className="text-sm text-purple-600 hover:underline"
                  >
                    Create your first habit
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filtered.map((h, i) => (
                  <HabitCard
                    key={h._id}
                    habit={h}
                    index={i}
                    onToggleToday={onToggleToday}
                    onToggleDay={onToggleDay}
                    onEdit={h => setModal(h)}
                    onDelete={id => setConfirmDelete(id)}
                    onArchive={handleArchive}
                    onPause={handlePause}
                  />
                ))}
              </div>
            )}

            {/* Achievements strip */}
            <div className="habit-glass rounded-2xl border border-white/60 p-4 shadow-card">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Achievements</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {achievements.map(a => (
                  <div
                    key={a.id}
                    {...tipProps(a.description)}
                    className={`rounded-xl border px-3 py-3 transition-all
                      ${a.unlocked
                        ? 'bg-gradient-to-br from-purple-50 to-teal-50 border-purple-100'
                        : 'bg-gray-50 border-gray-100 opacity-60 grayscale'}`}
                  >
                    <span className="text-xl">{a.icon}</span>
                    <p className="text-xs font-semibold text-gray-800 mt-1">{a.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{a.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {modal && (
        <HabitModal
          habit={modal === 'new' ? null : modal}
          saving={saving}
          onSave={onSave}
          onClose={() => setModal(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete habit?"
          message="This habit and its completion history will be permanently deleted."
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirmDelete(null)}
          onConfirm={async () => {
            await handleDelete(confirmDelete)
            setConfirmDelete(null)
          }}
        />
      )}
    </div>
  )
}

function StatChip({ label, value, suffix, accent, className = '' }) {
  return (
    <div className={`rounded-xl bg-white/80 border border-gray-100 px-3 py-2.5 ${className}`}>
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-semibold mt-0.5 ${accent ? 'text-teal-600' : 'text-gray-900'}`}>
        {value}{suffix ? <span className="ml-1 text-sm">{suffix}</span> : null}
      </p>
    </div>
  )
}

function StatsPanel({ stats, achievements, loading }) {
  if (loading || !stats) {
    return <HabitSkeleton rows={2} />
  }

  const rows = [
    { label: 'Weekly completions', value: stats.weeklyCompleted },
    { label: 'Monthly completions', value: stats.monthlyCompleted },
    { label: 'Total completed', value: stats.totalCompleted },
    { label: 'Success rate', value: `${stats.successRate}%` },
    { label: 'Average streak', value: stats.averageStreak },
    { label: 'Total active days', value: stats.totalActiveDays },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="habit-glass rounded-2xl border border-white/60 p-4 shadow-card space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">Reports</h3>
        <div className="grid grid-cols-2 gap-2">
          {rows.map(r => (
            <div key={r.label} className="rounded-xl bg-white/70 border border-gray-100 px-3 py-2.5">
              <p className="text-[10px] text-gray-400">{r.label}</p>
              <p className="text-base font-semibold text-gray-900 mt-0.5">{r.value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <PerfCard title="Best performing" habit={stats.bestHabit} tone="good" />
          <PerfCard title="Needs attention" habit={stats.weakestHabit} tone="warn" />
        </div>
      </div>

      <div className="habit-glass rounded-2xl border border-white/60 p-4 shadow-card">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Weekly trend</h3>
        <div className="space-y-2">
          {Object.entries(stats.weeklyTrend || {}).map(([day, count]) => {
            const max = Math.max(1, ...Object.values(stats.weeklyTrend || {}))
            return (
              <div key={day} className="flex items-center gap-2 text-xs">
                <span className="w-8 text-gray-400">{day}</span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-teal-400 transition-all duration-500"
                    style={{ width: `${(count / max) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right font-medium text-gray-700">{count}</span>
              </div>
            )
          })}
        </div>

        <h3 className="text-sm font-semibold text-gray-800 mt-5 mb-3">Badges</h3>
        <div className="grid grid-cols-2 gap-2">
          {achievements.map(a => (
            <div
              key={a.id}
              className={`rounded-xl px-3 py-2 border text-xs
                ${a.unlocked ? 'border-purple-200 bg-purple-50 text-purple-800' : 'border-gray-100 bg-gray-50 text-gray-400'}`}
            >
              <span className="mr-1">{a.icon}</span>
              {a.title}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PerfCard({ title, habit, tone }) {
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${tone === 'good' ? 'bg-teal-50/80 border-teal-100' : 'bg-amber-50/80 border-amber-100'}`}>
      <p className="text-[10px] text-gray-500">{title}</p>
      {habit ? (
        <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">
          {habit.icon} {habit.title}
          <span className="text-xs font-normal text-gray-500 ml-1">{habit.completionPercentage}%</span>
        </p>
      ) : (
        <p className="text-xs text-gray-400 mt-1">Not enough data yet</p>
      )}
    </div>
  )
}

function HabitSkeleton({ rows = 3 }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {Array.from({ length: rows * 2 }, (_, i) => (
        <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4 animate-pulse">
          <div className="flex gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-100 rounded w-2/3" />
              <div className="h-2 bg-gray-50 rounded w-full" />
              <div className="h-2 bg-gray-50 rounded w-1/2" />
            </div>
          </div>
          <div className="mt-4 h-12 bg-gray-50 rounded-xl" />
        </div>
      ))}
    </div>
  )
}
