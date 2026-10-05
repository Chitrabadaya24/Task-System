import { toDateKey, fromDateKey, getWeekDays, getMonthGrid } from './taskHelpers.js'

export { toDateKey, fromDateKey, getWeekDays, getMonthGrid }

export const HABIT_CATEGORIES = [
  'Health',
  'Fitness',
  'Learning',
  'Finance',
  'Productivity',
  'Reading',
  'Meditation',
  'Custom',
]

export const HABIT_COLORS = [
  '#6c47ff',
  '#00c9a7',
  '#00b4d8',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#8b5cf6',
  '#10b981',
  '#6366f1',
  '#f97316',
]

export const HABIT_ICONS = [
  '🔥', '💪', '📚', '🧘', '💧', '🏃', '🧠', '🎯',
  '😴', '🥗', '✍️', '🎵', '🌱', '☀️', '☕', '📖',
]

export const DAY_LABELS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const WEEKDAY_FULL = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** JS getDay() indices for Mon→Sun display order */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function isHabitDueOn(habit, dateKey = toDateKey(new Date())) {
  if (!habit || habit.isPaused || habit.isArchived || habit.deletedAt) return false
  const d = fromDateKey(dateKey)
  const dow = d.getDay()
  const days = Array.isArray(habit.targetDays) && habit.targetDays.length
    ? habit.targetDays
    : [0, 1, 2, 3, 4, 5, 6]
  return days.includes(dow)
}

export function isCompletedOn(habit, dateKey = toDateKey(new Date())) {
  return Boolean(habit?.completionHistory?.[dateKey])
}

export function getDayStatus(habit, dateKey) {
  const today = toDateKey(new Date())
  if (!isHabitDueOn(habit, dateKey)) return 'skipped'
  if (isCompletedOn(habit, dateKey)) return 'completed'
  if (dateKey > today) return 'pending'
  if (dateKey === today) return 'pending'
  return 'missed'
}

export function filterHabits(habits, { filter = 'all', category = 'all', query = '' } = {}) {
  const today = toDateKey(new Date())
  const q = query.trim().toLowerCase()

  return (habits || []).filter(h => {
    if (q) {
      const hay = `${h.title} ${h.description || ''} ${h.category || ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }

    if (category !== 'all' && h.category !== category) return false

    switch (filter) {
      case 'today':
        return !h.isArchived && isHabitDueOn(h, today)
      case 'completed':
        return !h.isArchived && isHabitDueOn(h, today) && isCompletedOn(h, today)
      case 'pending':
        return !h.isArchived && !h.isPaused && isHabitDueOn(h, today) && !isCompletedOn(h, today)
      case 'active':
        return !h.isArchived && !h.isPaused
      case 'paused':
        return !h.isArchived && h.isPaused
      case 'archived':
        return h.isArchived
      default:
        return !h.isArchived
    }
  })
}

export function computeAchievements(habits, stats) {
  const list = []
  const longest = stats?.longestStreak || Math.max(0, ...(habits || []).map(h => h.longestStreak || 0))
  const totalCompleted = stats?.totalCompleted || (habits || []).reduce((s, h) => s + (h.totalCompletions || 0), 0)
  const successRate = stats?.successRate || 0

  list.push({
    id: 'streak-7',
    title: '7 Day Streak',
    description: 'Keep a habit going for a full week',
    icon: '⚡',
    unlocked: longest >= 7,
  })
  list.push({
    id: 'streak-30',
    title: '30 Day Streak',
    description: 'A month of unbroken consistency',
    icon: '🏆',
    unlocked: longest >= 30,
  })
  list.push({
    id: 'completions-100',
    title: '100 Completions',
    description: 'Log one hundred habit wins',
    icon: '💯',
    unlocked: totalCompleted >= 100,
  })
  list.push({
    id: 'consistency',
    title: 'Consistency Master',
    description: 'Maintain 80%+ overall success rate',
    icon: '👑',
    unlocked: successRate >= 80 && (habits || []).length >= 3,
  })

  return list
}

export function greetingForHour(date = new Date()) {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/** Build last N weeks of contribution-style cells (Mon-start) */
export function buildHeatmapWeeks(completionMap, weeks = 12) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const day = today.getDay()
  const endSunday = new Date(today)
  // Align to end of current week (Sunday)
  const sundayOffset = day === 0 ? 0 : 7 - day
  endSunday.setDate(today.getDate() + sundayOffset)

  const start = new Date(endSunday)
  start.setDate(endSunday.getDate() - (weeks * 7 - 1))

  const result = []
  for (let w = 0; w < weeks; w++) {
    const col = []
    for (let d = 0; d < 7; d++) {
      const cell = new Date(start)
      cell.setDate(start.getDate() + w * 7 + d)
      const iso = toDateKey(cell)
      const count = completionMap[iso] || 0
      col.push({
        iso,
        count,
        future: iso > toDateKey(today),
        today: iso === toDateKey(today),
      })
    }
    result.push(col)
  }
  return result
}

/** Aggregate completions across habits per day */
export function aggregateDailyCompletions(habits) {
  const map = {}
  for (const h of habits || []) {
    const hist = h.completionHistory || {}
    for (const [k, v] of Object.entries(hist)) {
      if (v) map[k] = (map[k] || 0) + 1
    }
  }
  return map
}

export function weekTrendFromHabits(habits) {
  const days = getWeekDays()
  return days.map(d => {
    let due = 0
    let done = 0
    for (const h of habits || []) {
      if (h.isArchived || h.isPaused) continue
      if (!isHabitDueOn(h, d.iso)) continue
      due += 1
      if (isCompletedOn(h, d.iso)) done += 1
    }
    return {
      ...d,
      due,
      done,
      pct: due ? Math.round((done / due) * 100) : 0,
    }
  })
}
