import { useState, useEffect, useCallback } from 'react'
import api from '../utils/api.js'
import { useToast } from '../context/ToastContext.jsx'

export function useHabits(enabled = true) {
  const { toast } = useToast()
  const [habits, setHabits] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchHabits = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    try {
      // Fetch active + archived so filters can switch client-side
      const { data } = await api.get('/habits')
      setHabits(data)
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to load habits')
    } finally {
      setLoading(false)
    }
  }, [enabled, toast])

  const fetchStats = useCallback(async () => {
    if (!enabled) return
    setStatsLoading(true)
    try {
      const { data } = await api.get('/habits/stats')
      setStats(data)
    } catch {
      /* non-blocking */
    } finally {
      setStatsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    fetchHabits()
    fetchStats()
  }, [enabled, fetchHabits, fetchStats])

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchHabits(), fetchStats()])
  }, [fetchHabits, fetchStats])

  const handleSave = async (form, editId) => {
    setSaving(true)
    try {
      if (editId) {
        const { data } = await api.put(`/habits/${editId}`, form)
        setHabits(hs => hs.map(h => h._id === data._id ? data : h))
        toast('Habit updated', 'success')
      } else {
        const { data } = await api.post('/habits', form)
        setHabits(hs => [data, ...hs])
        toast('Habit created', 'success')
      }
      fetchStats()
      return true
    } catch (e) {
      toast(e.response?.data?.message || 'Error saving habit')
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/habits/${id}`, { params: { permanent: 'true' } })
      setHabits(hs => hs.filter(h => h._id !== id))
      toast('Habit deleted', 'success')
      fetchStats()
    } catch (e) {
      toast(e.response?.data?.message || 'Error deleting habit')
    }
  }

  const handleArchive = async (id, isArchived = true) => {
    try {
      const { data } = await api.put(`/habits/${id}/archive`, { isArchived })
      setHabits(hs => hs.map(h => h._id === data._id ? data : h))
      toast(isArchived ? 'Habit archived' : 'Habit restored', 'success')
      fetchStats()
    } catch (e) {
      toast(e.response?.data?.message || 'Error updating habit')
    }
  }

  const handlePause = async (id, isPaused) => {
    try {
      const { data } = await api.put(`/habits/${id}/pause`, {
        isPaused: isPaused !== undefined ? isPaused : undefined,
      })
      setHabits(hs => hs.map(h => h._id === data._id ? data : h))
      toast(data.isPaused ? 'Habit paused' : 'Habit resumed', 'success')
      fetchStats()
      return data
    } catch (e) {
      toast(e.response?.data?.message || 'Error updating habit')
    }
  }

  const handleToggleDay = async (id, date, completed) => {
    try {
      const body = { date }
      if (completed !== undefined) body.completed = completed
      const { data } = await api.put(`/habits/${id}/toggle`, body)
      setHabits(hs => hs.map(h => h._id === data.habit._id ? data.habit : h))
      fetchStats()
      return data
    } catch (e) {
      toast(e.response?.data?.message || 'Error updating completion')
      return null
    }
  }

  return {
    habits,
    stats,
    loading,
    statsLoading,
    saving,
    fetchHabits,
    fetchStats,
    refreshAll,
    handleSave,
    handleDelete,
    handleArchive,
    handlePause,
    handleToggleDay,
  }
}
