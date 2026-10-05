import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../utils/api.js'
import { useToast } from '../context/ToastContext.jsx'
import { toDateKey, EMPTY_MANIFESTATIONS, joinJournalContent } from '../utils/journalHelpers.js'

const blankDraft = (dateKey) => ({
  _id: null,
  journalDate: dateKey,
  title: '',
  content: joinJournalContent(''),
  mood: '',
  manifestations: [...EMPTY_MANIFESTATIONS],
  tags: [],
  favorite: false,
  locked: false,
  aiReflection: null,
  wordCount: 0,
})

export function useJournals(enabled = true) {
  const { toast } = useToast()
  const [journals, setJournals] = useState([])
  const [datesMeta, setDatesMeta] = useState([])
  const [stats, setStats] = useState(null)
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()))
  const [draft, setDraft] = useState(() => blankDraft(toDateKey(new Date())))
  const [loading, setLoading] = useState(true)
  const [entryLoading, setEntryLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | saved | error
  const [dirty, setDirty] = useState(false)
  const draftRef = useRef(draft)
  const dirtyRef = useRef(false)
  const savingRef = useRef(false)

  useEffect(() => { draftRef.current = draft }, [draft])
  useEffect(() => { dirtyRef.current = dirty }, [dirty])

  const fetchList = useCallback(async () => {
    if (!enabled) return
    try {
      const { data } = await api.get('/journals')
      setJournals(data)
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to load journals')
    }
  }, [enabled, toast])

  const fetchDates = useCallback(async () => {
    if (!enabled) return
    try {
      const { data } = await api.get('/journals/dates')
      setDatesMeta(data)
    } catch { /* ignore */ }
  }, [enabled])

  const fetchStats = useCallback(async () => {
    if (!enabled) return
    try {
      const { data } = await api.get('/journals/stats')
      setStats(data)
    } catch { /* ignore */ }
  }, [enabled])

  const refreshMeta = useCallback(async () => {
    await Promise.all([fetchList(), fetchDates(), fetchStats()])
  }, [fetchList, fetchDates, fetchStats])

  const loadEntry = useCallback(async (dateKey) => {
    if (!enabled) return
    setEntryLoading(true)
    setSaveStatus('idle')
    try {
      const { data } = await api.get(`/journals/date/${dateKey}`)
      if (data) {
        setDraft({
          ...blankDraft(dateKey),
          ...data,
          content: data.content?.trim() ? data.content : joinJournalContent(''),
          manifestations: Array.isArray(data.manifestations) && data.manifestations.length
            ? [...data.manifestations, '', '', ''].slice(0, 3)
            : [...EMPTY_MANIFESTATIONS],
          tags: data.tags || [],
        })
      } else {
        setDraft(blankDraft(dateKey))
      }
      setDirty(false)
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to load entry')
      setDraft(blankDraft(dateKey))
    } finally {
      setEntryLoading(false)
    }
  }, [enabled, toast])

  useEffect(() => {
    if (!enabled) return
    setLoading(true)
    Promise.all([fetchList(), fetchDates(), fetchStats()])
      .finally(() => setLoading(false))
  }, [enabled, fetchList, fetchDates, fetchStats])

  useEffect(() => {
    if (!enabled) return
    loadEntry(selectedDate)
  }, [enabled, selectedDate, loadEntry])

  const patchDraft = useCallback((partial) => {
    setDraft(d => ({ ...d, ...partial }))
    setDirty(true)
    setSaveStatus('idle')
  }, [])

  const saveDraft = useCallback(async ({ silent = false } = {}) => {
    if (savingRef.current) return false
    const current = draftRef.current
    if (!current?.journalDate) return false

    savingRef.current = true
    setSaveStatus('saving')
    try {
      const payload = {
        journalDate: current.journalDate,
        title: '',
        content: current.content || '',
        mood: current.mood || '',
        manifestations: (current.manifestations || ['', '', '']).slice(0, 3),
        tags: [],
        favorite: Boolean(current.favorite),
        locked: Boolean(current.locked),
      }
      const { data } = await api.post('/journals', payload)
      setDraft(d => ({
        ...d,
        ...data,
        manifestations: Array.isArray(data.manifestations)
          ? [...data.manifestations, '', '', ''].slice(0, 3)
          : d.manifestations,
      }))
      setDirty(false)
      setSaveStatus('saved')
      await refreshMeta()
      if (!silent) toast('Journal saved', 'success')
      return true
    } catch (e) {
      setSaveStatus('error')
      toast(e.response?.data?.message || 'Failed to save journal')
      return false
    } finally {
      savingRef.current = false
    }
  }, [refreshMeta, toast])

  // Auto-save every 20s when dirty
  useEffect(() => {
    if (!enabled) return
    const id = setInterval(() => {
      if (dirtyRef.current && !savingRef.current) {
        saveDraft({ silent: true })
      }
    }, 20000)
    return () => clearInterval(id)
  }, [enabled, saveDraft])

  const selectDate = useCallback(async (dateKey) => {
    if (dateKey === selectedDate) return
    if (dirtyRef.current) {
      await saveDraft({ silent: true })
    }
    setSelectedDate(dateKey)
  }, [selectedDate, saveDraft])

  const toggleFavorite = useCallback(async () => {
    const next = !draftRef.current.favorite
    const updated = { ...draftRef.current, favorite: next }
    draftRef.current = updated
    setDraft(updated)
    setDirty(true)
    await saveDraft({ silent: true })
  }, [saveDraft])

  const toggleLocked = useCallback(() => {
    const next = !draftRef.current.locked
    draftRef.current = { ...draftRef.current, locked: next }
    setDraft(d => ({ ...d, locked: next }))
    setDirty(true)
  }, [])

  const deleteEntry = useCallback(async (id) => {
    try {
      await api.delete(`/journals/${id}`, { params: { permanent: 'true' } })
      toast('Journal deleted', 'success')
      if (draftRef.current._id === id) {
        setDraft(blankDraft(selectedDate))
        setDirty(false)
        setSaveStatus('idle')
      }
      await refreshMeta()
      return true
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to delete')
      return false
    }
  }, [selectedDate, refreshMeta, toast])

  /** AI Reflect stub — ready for future implementation */
  const requestAiReflect = useCallback(async (id) => {
    try {
      await api.post(`/journals/${id}/reflect`)
      return { ok: true }
    } catch (e) {
      if (e.response?.status === 501) {
        return { ok: false, comingSoon: true, message: e.response?.data?.message }
      }
      toast(e.response?.data?.message || 'AI reflection failed')
      return { ok: false }
    }
  }, [toast])

  return {
    journals,
    datesMeta,
    stats,
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
    toggleLocked,
    deleteEntry,
    requestAiReflect,
    refreshMeta,
  }
}
