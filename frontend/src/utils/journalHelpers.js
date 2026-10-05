import { toDateKey, fromDateKey, getMonthGrid } from './taskHelpers.js'

export { toDateKey, fromDateKey, getMonthGrid }

export const JOURNAL_MOODS = [
  { key: 'great', emoji: '😄', label: 'Great' },
  { key: 'good', emoji: '🙂', label: 'Good' },
  { key: 'okay', emoji: '😐', label: 'Okay' },
  { key: 'low', emoji: '😔', label: 'Low' },
  { key: 'rough', emoji: '😣', label: 'Rough' },
]

export const EMPTY_MANIFESTATIONS = ['', '', '']

/** Default letter opener — user writes after this line */
export const JOURNAL_OPENER = 'Dear Future Self,'

export const MANIFESTATION_PLACEHOLDERS = [
  'I believe in myself.',
  'I attract good opportunities.',
  'I will stay consistent.',
]

export function moodMeta(key) {
  return JOURNAL_MOODS.find(m => m.key === key) || null
}

export function countWords(text = '') {
  const t = String(text).trim()
  if (!t) return 0
  return t.split(/\s+/).filter(Boolean).length
}

/** Split stored content into opener + body for the editor */
export function splitJournalContent(content = '') {
  const raw = String(content || '')
  const opener = JOURNAL_OPENER
  if (raw.startsWith(opener)) {
    return { opener, body: raw.slice(opener.length).replace(/^\n+/, '') }
  }
  // Legacy "Dear diary" openers
  const legacy = /^Dear [Dd]iary[^\n]*,?\s*\n*/ 
  if (legacy.test(raw)) {
    return { opener, body: raw.replace(legacy, '') }
  }
  return { opener, body: raw }
}

export function joinJournalContent(body = '') {
  const text = String(body || '')
  if (!text.trim()) return `${JOURNAL_OPENER}\n\n`
  return `${JOURNAL_OPENER}\n\n${text}`
}

export function formatJournalDate(dateKey, opts) {
  if (!dateKey) return ''
  return fromDateKey(dateKey).toLocaleDateString('en-GB', opts || {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatClock(date = new Date()) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function monthKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function parseTagsInput(raw) {
  if (!raw) return []
  return String(raw)
    .split(/[,#]+/)
    .map(t => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12)
}

export function isJournalEmpty(j) {
  if (!j) return true
  const hasContent = Boolean((j.content || '').trim())
  const hasTitle = Boolean((j.title || '').trim())
  const hasMood = Boolean(j.mood)
  const hasMani = (j.manifestations || []).some(m => String(m || '').trim())
  const hasTags = (j.tags || []).length > 0
  return !(hasContent || hasTitle || hasMood || hasMani || hasTags || j.favorite)
}

export function filterJournals(list, { query = '', month = 'all', favoritesOnly = false } = {}) {
  const q = query.trim().toLowerCase()
  return (list || []).filter(j => {
    if (favoritesOnly && !j.favorite) return false
    if (month !== 'all' && !j.journalDate?.startsWith(month)) return false
    if (!q) return true
    const hay = `${j.title || ''} ${j.content || ''} ${(j.tags || []).join(' ')}`.toLowerCase()
    return hay.includes(q)
  })
}

export function buildMonthOptions(journals, yearsBack = 2) {
  const now = new Date()
  const keys = new Set()
  for (let i = 0; i < yearsBack * 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.add(monthKey(d))
  }
  for (const j of journals || []) {
    if (j.journalDate) keys.add(j.journalDate.slice(0, 7))
  }
  return [...keys].sort().reverse()
}

export function previewText(content = '', max = 140) {
  const t = String(content).replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max).trim()}…`
}
