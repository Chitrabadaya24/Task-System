const startOfDay = (d) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export const toDateKey = (date) => {
  // Prefer YYYY-MM-DD prefix from ISO strings to avoid UTC timezone shifts
  if (typeof date === 'string') {
    const m = date.match(/^(\d{4}-\d{2}-\d{2})/)
    if (m) return m[1]
  }
  const x = startOfDay(date instanceof Date ? date : new Date(date))
  if (Number.isNaN(x.getTime())) return ''
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const d = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const fromDateKey = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const formatDateKey = (key, options) => fromDateKey(key).toLocaleDateString('en-US', options)

export const isTaskOverdue = (task) => {
  if (task.deletedAt || task.done || !task.dueDate) return false
  return toDateKey(task.dueDate) < toDateKey(new Date())
}

export const isTaskToday = (task) => {
  if (task.deletedAt) return false
  if (task.dueDate) {
    const due = toDateKey(task.dueDate)
    const today = toDateKey(new Date())
    if (due === today) return true
    // Incomplete past-due tasks stay on Today so they remain visible/actionable
    if (due < today && !task.done) return true
    return false
  }
  return task.isToday !== false
}

export const isTaskUpcoming = (task) => {
  if (task.deletedAt) return false
  if (isTaskToday(task)) return false
  if (task.dueDate) {
    return toDateKey(task.dueDate) > toDateKey(new Date())
  }
  return task.isToday === false
}

/** Incomplete tasks with due dates that are overdue, due today, or within 7 days. */
export const buildDeadlineItems = (list) => {
  const now = new Date()
  const weekMs = 7 * 24 * 60 * 60 * 1000
  return (list || [])
    .filter(t => !t.done && !t.deletedAt && t.type === 'task' && t.dueDate)
    .map(t => {
      const due = new Date(t.dueDate)
      due.setHours(23, 59, 59, 999)
      const diff = due.getTime() - now.getTime()
      let reminderType = null
      if (diff < 0) reminderType = 'overdue'
      else if (due.toDateString() === now.toDateString()) reminderType = 'today'
      else if (diff <= weekMs) reminderType = 'soon'
      return reminderType ? { ...t, reminderType } : null
    })
    .filter(Boolean)
    .sort((a, b) => {
      const order = { overdue: 0, today: 1, soon: 2 }
      return order[a.reminderType] - order[b.reminderType] || new Date(a.dueDate) - new Date(b.dueDate)
    })
}

export const getWeekDays = (anchor = new Date()) => {
  const d = new Date(anchor)
  const day = d.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + mondayOffset)

  const labels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
  return labels.map((label, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    const iso = toDateKey(date)
    const today = iso === toDateKey(new Date())
    return { label, day: date.getDate(), iso, today }
  })
}

export const taskOnDate = (task, isoDate) => {
  if (!isoDate || task.deletedAt) return false
  if (task.type === 'note' || task.type === 'link') return false
  if (task.dueDate) return toDateKey(task.dueDate) === isoDate
  if (task.isToday !== false && isoDate === toDateKey(new Date())) return true
  return false
}

export const getMonthGrid = (year, month) => {
  const first = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0).getDate()
  const startPad = (first.getDay() + 6) % 7 // Monday-start week

  const cells = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(year, month, d)
    cells.push({
      day: d,
      iso: toDateKey(date),
      today: toDateKey(date) === toDateKey(new Date()),
    })
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export const scheduleOnDate = (schedule, isoDate) => {
  if (!isoDate || !schedule.date || schedule.deletedAt) return false
  return toDateKey(schedule.date) === isoDate
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

export const sortTasks = (list, sortBy = 'created') => {
  const sorted = [...list]
  switch (sortBy) {
    case 'dueDate':
      return sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return toDateKey(a.dueDate).localeCompare(toDateKey(b.dueDate))
      })
    case 'priority':
      return sorted.sort((a, b) =>
        (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1)
      )
    case 'name':
      return sorted.sort((a, b) => (a.text || '').localeCompare(b.text || ''))
    case 'created':
    default:
      return sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  }
}
